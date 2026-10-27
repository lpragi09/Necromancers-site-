-- Torneios: ranking semanal de quem foi aos torneios do clã (Semana 1 a 4 de cada mês).
-- A liderança digita o nome e vai clicando em "+" a cada torneio. Rode no SQL Editor do Supabase.
-- Pode rodar mais de uma vez sem duplicar nada.

-- Cada mês de torneios (ex.: "Novembro 2026")
create table if not exists public.tournament_months (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- Quantas vezes cada pessoa foi ao torneio em cada semana do mês
create table if not exists public.tournament_scores (
  id          uuid primary key default gen_random_uuid(),
  month_id    uuid not null references public.tournament_months (id) on delete cascade,
  week        smallint not null check (week between 1 and 4),
  player_name text not null,
  count       integer not null default 1 check (count >= 0),
  updated_at  timestamptz not null default now()
);
-- Uma linha por pessoa por semana (sem diferenciar maiúscula/minúscula)
create unique index if not exists tournament_scores_unique on public.tournament_scores (month_id, week, lower(player_name));
create index if not exists tournament_scores_month on public.tournament_scores (month_id, week);

alter table public.tournament_months enable row level security;
alter table public.tournament_scores enable row level security;

-- Adiciona a pessoa na semana (ou soma 1 se ela já está). Devolve o total dela na semana.
create or replace function public.tournament_add(p_month uuid, p_week smallint, p_name text) returns integer
language sql as $$
  insert into public.tournament_scores (month_id, week, player_name, count)
  values (p_month, p_week, trim(p_name), 1)
  on conflict (month_id, week, lower(player_name))
  do update set count = public.tournament_scores.count + 1, updated_at = now()
  returning count
$$;

-- Soma ou tira presenças de forma atômica (dois líderes clicando juntos não perdem clique). Nunca fica negativo.
create or replace function public.tournament_bump(p_id uuid, p_delta integer) returns integer
language sql as $$
  update public.tournament_scores
  set count = greatest(0, count + p_delta), updated_at = now()
  where id = p_id
  returning count
$$;

-- Só o servidor do site (service role) chama essas funções
revoke execute on function public.tournament_add(uuid, smallint, text) from public, anon, authenticated;
revoke execute on function public.tournament_bump(uuid, integer) from public, anon, authenticated;
grant execute on function public.tournament_add(uuid, smallint, text) to service_role;
grant execute on function public.tournament_bump(uuid, integer) to service_role;

-- Primeiro mês, para já começar a preencher
insert into public.tournament_months (name)
select (array['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'])
         [extract(month from now() at time zone 'America/Sao_Paulo')::int]
       || ' ' || extract(year from now() at time zone 'America/Sao_Paulo')::int
where not exists (select 1 from public.tournament_months);
