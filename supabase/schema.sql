-- Necromancers: rodar uma vez no SQL Editor do Supabase (idempotente, não apaga dados).
-- Toda tabela tem RLS ligado e nenhuma policy pública: só as rotas /api do site
-- (service role) leem e escrevem. O navegador nunca fala direto com o banco.

create extension if not exists pgcrypto;

-- Membros do clã (login pelo Discord + nome do personagem)
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  discord_id   text not null unique,
  discord_name text not null,
  avatar_url   text,
  char_name    text not null,
  level        integer,
  role         text not null default 'membro' check (role in ('lider', 'vice', 'veterano', 'membro', 'recruta')),
  status       text not null default 'pending' check (status in ('pending', 'active', 'inactive')),
  created_at   timestamptz not null default now()
);
create unique index if not exists members_char_name on public.members (lower(char_name));

-- Avisos, novidades e eventos
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null default 'novidade' check (kind in ('aviso', 'novidade', 'evento')),
  title      text not null,
  body       text not null default '',
  image_url  text,
  event_at   timestamptz,
  pinned     boolean not null default false,
  published  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists posts_recent on public.posts (published, pinned desc, created_at desc);

-- Temporadas do ranking de drops (prêmios por colocação: ["1º lugar: ...", "2º: ...", ...])
create table if not exists public.seasons (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  prizes     jsonb not null default '[]'::jsonb,
  status     text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now()
);

-- Itens que valem pontos no ranking
create table if not exists public.drop_items (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  points    integer not null check (points > 0),
  rarity    text not null default 'raro' check (rarity in ('comum', 'raro', 'epico', 'lendario', 'shiny')),
  image_url text,
  active    boolean not null default true,
  created_at timestamptz not null default now()
);

-- Drops enviados pelos membros (print privado no bucket "provas"; o banco guarda só o caminho)
create table if not exists public.drops (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid not null references public.seasons (id) on delete cascade,
  member_id   uuid not null references public.members (id) on delete cascade,
  item_id     uuid references public.drop_items (id) on delete set null,
  item_name   text not null,           -- cópia do item na hora do envio (o ranking não muda se o item for editado)
  rarity      text not null,
  points      integer not null,        -- pontos por unidade na hora do envio
  quantity    integer not null default 1 check (quantity between 1 and 999),
  proof_path  text,
  note        text,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists drops_ranking on public.drops (season_id, status);
create index if not exists drops_member on public.drops (member_id, created_at desc);

-- Sorteios do clã
create table if not exists public.giveaways (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text not null default '',
  prize            text not null,
  image_url        text,
  status           text not null default 'open' check (status in ('open', 'closed', 'drawn')),
  ends_at          timestamptz,
  winner_member_id uuid references public.members (id) on delete set null,
  winner_name      text,
  fair_draw_id     uuid,
  created_at       timestamptz not null default now()
);

-- Uma inscrição por membro em cada sorteio (a PK impede duplicata)
create table if not exists public.giveaway_entries (
  giveaway_id uuid not null references public.giveaways (id) on delete cascade,
  member_id   uuid not null references public.members (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (giveaway_id, member_id)
);

-- Provably fair: cada giro de roleta fica registrado aqui (conta em src/lib/fair.ts)
create table if not exists public.fair_draws (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null default 'sorteio' check (kind in ('sorteio')),
  target_id        uuid not null,
  title            text not null,
  entries          jsonb not null,
  total_weight     integer not null check (total_weight > 0),
  entries_hash     text not null,
  drand_round      bigint not null,
  drand_randomness text,
  drand_signature  text,
  ticket           text,
  winner_label     text,
  winner_username  text,
  status           text not null default 'waiting' check (status in ('waiting', 'drawn', 'confirmed', 'skipped')),
  created_at       timestamptz not null default now(),
  drawn_at         timestamptz
);
create index if not exists fair_draws_target on public.fair_draws (target_id, created_at);
create index if not exists fair_draws_recent on public.fair_draws (created_at desc);

alter table public.members          enable row level security;
alter table public.posts            enable row level security;
alter table public.seasons          enable row level security;
alter table public.drop_items       enable row level security;
alter table public.drops            enable row level security;
alter table public.giveaways        enable row level security;
alter table public.giveaway_entries enable row level security;
alter table public.fair_draws       enable row level security;

-- Storage: imagens públicas (avisos, itens, sorteios) e prints dos drops (privado)
insert into storage.buckets (id, name, public) values ('imagens', 'imagens', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('provas', 'provas', false) on conflict (id) do nothing;

-- Primeira temporada, pra o ranking já abrir com algo
insert into public.seasons (name, prizes)
select 'Temporada 1', '["1º lugar: a definir", "2º lugar: a definir", "3º lugar: a definir"]'::jsonb
where not exists (select 1 from public.seasons);
