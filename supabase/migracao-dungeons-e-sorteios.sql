-- Três novidades num SQL só. Rode no SQL Editor do Supabase. Pode rodar mais de uma vez sem duplicar nada.
--   1) Dungeons: membros criam grupos com horário (1 a 4 jogadores) e os outros vão ocupando as vagas.
--   2) Sorteio do torneio: os giros do Provably Fair passam a aceitar o tipo "torneio".
--   3) Inscritos do sorteio: a liderança pode rejeitar (tirar) ou aprovar de volta a inscrição de alguém.
--   4) Popup de destaque: um aviso pode aparecer em popup toda vez que alguém entra no site.

-- ===================== 1) Dungeons =====================

-- Lista de dungeons (a liderança cadastra no painel)
create table if not exists public.dungeons (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Grupos marcados: quem criou já ocupa uma das vagas
create table if not exists public.dungeon_runs (
  id           uuid primary key default gen_random_uuid(),
  dungeon_id   uuid references public.dungeons (id) on delete set null,
  dungeon_name text not null,              -- cópia na hora de criar
  creator_id   uuid not null references public.members (id) on delete cascade,
  slots        smallint not null check (slots between 1 and 4),
  starts_at    timestamptz not null,
  note         text,
  status       text not null default 'open' check (status in ('open', 'cancelled')),
  created_at   timestamptz not null default now()
);
create index if not exists dungeon_runs_upcoming on public.dungeon_runs (status, starts_at);
create index if not exists dungeon_runs_creator on public.dungeon_runs (creator_id, status, starts_at);

-- Quem está em cada grupo
create table if not exists public.dungeon_participants (
  run_id    uuid not null references public.dungeon_runs (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (run_id, member_id)
);

alter table public.dungeons             enable row level security;
alter table public.dungeon_runs         enable row level security;
alter table public.dungeon_participants enable row level security;

-- Entrar no grupo de forma travada: duas pessoas na última vaga ao mesmo tempo, só uma entra.
-- Devolve: 'ok', 'cheio', 'fechado' (cancelado ou já passou) ou 'ja_esta'.
create or replace function public.dungeon_join(p_run uuid, p_member uuid) returns text
language plpgsql as $$
declare
  v_run   public.dungeon_runs%rowtype;
  v_count integer;
begin
  select * into v_run from public.dungeon_runs where id = p_run for update;
  if not found or v_run.status <> 'open' or v_run.starts_at < now() - interval '2 hours' then return 'fechado'; end if;
  if exists (select 1 from public.dungeon_participants where run_id = p_run and member_id = p_member) then return 'ja_esta'; end if;
  select count(*) into v_count from public.dungeon_participants where run_id = p_run;
  if v_count >= v_run.slots then return 'cheio'; end if;
  insert into public.dungeon_participants (run_id, member_id) values (p_run, p_member);
  return 'ok';
end
$$;

revoke execute on function public.dungeon_join(uuid, uuid) from public, anon, authenticated;
grant execute on function public.dungeon_join(uuid, uuid) to service_role;

-- Primeira dungeon de exemplo (edite ou adicione as outras no painel)
insert into public.dungeons (name)
select 'Magma'
where not exists (select 1 from public.dungeons);

-- ===================== 2) Sorteio do torneio =====================
alter table public.fair_draws drop constraint if exists fair_draws_kind_check;
alter table public.fair_draws add constraint fair_draws_kind_check check (kind in ('sorteio', 'torneio'));

-- ===================== 3) Inscritos do sorteio: aprovar / rejeitar =====================
-- "ok" entra na roleta; "rejected" foi tirado pela liderança e não consegue entrar de novo sozinho
alter table public.giveaway_entries add column if not exists status text not null default 'ok';
alter table public.giveaway_entries drop constraint if exists giveaway_entries_status_check;
alter table public.giveaway_entries add constraint giveaway_entries_status_check check (status in ('ok', 'rejected'));

-- ===================== 4) Popup de destaque =====================
-- popup: aparece ao entrar no site (só um por vez); popup_public: visitantes (não membros) também veem
alter table public.posts add column if not exists popup boolean not null default false;
alter table public.posts add column if not exists popup_public boolean not null default false;
