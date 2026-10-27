-- Limite de login: no máximo 2 contas diferentes do Discord por conexão (IP) a cada 15 minutos.
-- Guarda só um hash do IP (nunca o IP puro); o site apaga os registros com mais de 1 dia.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez sem duplicar nada.

create table if not exists public.login_events (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  discord_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists login_events_ip on public.login_events (ip_hash, created_at desc);
create index if not exists login_events_old on public.login_events (created_at);

alter table public.login_events enable row level security;
