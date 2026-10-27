-- Lojinha do clã: moedinhas por atividades (torneio, castle, hunt...) e loja para trocar por itens.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez sem duplicar nada.

-- Tabela de atividades: quantas moedas cada uma vale (a liderança edita no painel)
create table if not exists public.activity_types (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  coins      integer not null check (coins > 0),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cada vez que a liderança aperta "Zerar moedas" entra uma linha aqui.
-- O "ciclo" atual é o maior id; saldo e pedidos contam só o ciclo atual (o histórico fica guardado).
create table if not exists public.coin_resets (
  id         bigint generated always as identity primary key,
  created_by text,
  created_at timestamptz not null default now()
);

-- Pedido de moedas: o membro manda o print da atividade com o dia e a hora
create table if not exists public.coin_claims (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members (id) on delete cascade,
  activity_id   uuid references public.activity_types (id) on delete set null,
  activity_name text not null,            -- cópia na hora do envio
  coins         integer not null,          -- moedas na hora do envio
  happened_at   timestamptz not null,      -- dia e hora da atividade
  proof_path    text,                      -- print no bucket privado "provas"
  note          text,
  epoch         bigint not null default 0,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);
create index if not exists coin_claims_member on public.coin_claims (member_id, epoch, status);
create index if not exists coin_claims_pending on public.coin_claims (status, created_at);

-- Itens da loja
create table if not exists public.shop_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  image_url   text,
  price       integer not null check (price > 0),
  stock       integer check (stock is null or stock >= 0),   -- vazio = ilimitado
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Resgates: as moedas saem na hora; a liderança entrega no jogo e marca como entregue
create table if not exists public.shop_orders (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.members (id) on delete cascade,
  item_id      uuid references public.shop_items (id) on delete set null,
  item_name    text not null,
  price        integer not null,
  epoch        bigint not null default 0,
  status       text not null default 'pending' check (status in ('pending', 'delivered', 'cancelled')),
  created_at   timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists shop_orders_member on public.shop_orders (member_id, epoch, status);
create index if not exists shop_orders_pending on public.shop_orders (status, created_at);

alter table public.activity_types enable row level security;
alter table public.coin_resets    enable row level security;
alter table public.coin_claims    enable row level security;
alter table public.shop_items     enable row level security;
alter table public.shop_orders    enable row level security;

-- Ciclo atual (0 enquanto ninguém zerou)
create or replace function public.coin_epoch() returns bigint
language sql stable as $$
  select coalesce(max(id), 0) from public.coin_resets
$$;

-- Saldo do membro no ciclo atual: moedas aprovadas menos resgates não cancelados
create or replace function public.coin_balance(p_member uuid) returns integer
language sql stable as $$
  select
    coalesce((select sum(coins) from public.coin_claims
              where member_id = p_member and status = 'approved' and epoch = public.coin_epoch()), 0)
  - coalesce((select sum(price) from public.shop_orders
              where member_id = p_member and status <> 'cancelled' and epoch = public.coin_epoch()), 0)
$$;

-- Compra atômica: trava o membro e o item, confere saldo e estoque, desconta e cria o pedido.
-- Dois cliques ao mesmo tempo não gastam o mesmo saldo duas vezes nem furam o estoque.
create or replace function public.buy_shop_item(p_member uuid, p_item uuid) returns uuid
language plpgsql as $$
declare
  v_item  public.shop_items%rowtype;
  v_order uuid;
begin
  perform pg_advisory_xact_lock(hashtext('coins:' || p_member::text));
  select * into v_item from public.shop_items where id = p_item and active for update;
  if not found then raise exception 'ITEM_INDISPONIVEL'; end if;
  if v_item.stock is not null and v_item.stock <= 0 then raise exception 'SEM_ESTOQUE'; end if;
  if public.coin_balance(p_member) < v_item.price then raise exception 'SALDO_INSUFICIENTE'; end if;
  if v_item.stock is not null then
    update public.shop_items set stock = stock - 1 where id = p_item;
  end if;
  insert into public.shop_orders (member_id, item_id, item_name, price, epoch)
  values (p_member, v_item.id, v_item.name, v_item.price, public.coin_epoch())
  returning id into v_order;
  return v_order;
end
$$;

-- As funções só podem ser chamadas pelo servidor do site (service role), nunca direto do navegador
revoke execute on function public.coin_epoch() from public, anon, authenticated;
revoke execute on function public.coin_balance(uuid) from public, anon, authenticated;
revoke execute on function public.buy_shop_item(uuid, uuid) from public, anon, authenticated;
grant execute on function public.coin_epoch() to service_role;
grant execute on function public.coin_balance(uuid) to service_role;
grant execute on function public.buy_shop_item(uuid, uuid) to service_role;

-- Atividades de exemplo (edite ou apague no painel)
insert into public.activity_types (name, coins)
select v.name, v.coins from (values ('Torneio do clã', 50), ('Castle', 30), ('Hunt do clã', 10)) as v(name, coins)
where not exists (select 1 from public.activity_types);
