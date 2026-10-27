-- Games: salas para combinar os minigames do jogo (Bomberman, Poke Kart...). Rode no SQL Editor do Supabase.
-- Pode rodar mais de uma vez sem duplicar nada.
--   Cada modo de jogo tem salas (arenas) com vagas. Membros entram e saem pelo site.
--   A entrada vale 1 hora: depois disso a vaga libera sozinha. Cada membro fica em uma sala por vez.

-- Modos de jogo (a liderança cadastra no painel)
create table if not exists public.game_modes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  icon       text not null default 'gamepad' check (icon in ('gamepad', 'bomb', 'kart', 'trophy')),
  sort       integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Salas de cada modo
create table if not exists public.game_rooms (
  id         uuid primary key default gen_random_uuid(),
  mode_id    uuid not null references public.game_modes (id) on delete cascade,
  name       text not null,
  slots      smallint not null default 4 check (slots between 1 and 8),
  sort       integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists game_rooms_mode on public.game_rooms (mode_id, sort);

-- Quem está em cada sala agora
create table if not exists public.game_room_players (
  room_id   uuid not null references public.game_rooms (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, member_id)
);
create index if not exists game_room_players_member on public.game_room_players (member_id);

alter table public.game_modes        enable row level security;
alter table public.game_rooms        enable row level security;
alter table public.game_room_players enable row level security;

-- Entrar na sala de forma travada: duas pessoas na última vaga ao mesmo tempo, só uma entra.
-- Limpa entradas com mais de 1 hora e tira o membro de qualquer outra sala.
-- Devolve: 'ok', 'cheio', 'fechado' (sala ou modo desativado) ou 'ja_esta'.
create or replace function public.game_join(p_room uuid, p_member uuid) returns text
language plpgsql as $$
declare
  v_room  public.game_rooms%rowtype;
  v_count integer;
begin
  select * into v_room from public.game_rooms where id = p_room for update;
  if not found or not v_room.active then return 'fechado'; end if;
  if not exists (select 1 from public.game_modes where id = v_room.mode_id and active) then return 'fechado'; end if;
  delete from public.game_room_players where room_id = p_room and joined_at < now() - interval '1 hour';
  if exists (select 1 from public.game_room_players where room_id = p_room and member_id = p_member) then return 'ja_esta'; end if;
  select count(*) into v_count from public.game_room_players where room_id = p_room;
  if v_count >= v_room.slots then return 'cheio'; end if;
  delete from public.game_room_players where member_id = p_member;
  insert into public.game_room_players (room_id, member_id) values (p_room, p_member);
  return 'ok';
end
$$;

revoke execute on function public.game_join(uuid, uuid) from public, anon, authenticated;
grant execute on function public.game_join(uuid, uuid) to service_role;

-- Modos e salas iniciais, iguais aos do jogo (só cria se ainda não houver nenhum modo)
do $$
declare
  v_bomb uuid;
  v_kart uuid;
begin
  if exists (select 1 from public.game_modes) then return; end if;
  insert into public.game_modes (name, icon, sort) values ('Bomberman', 'bomb', 1) returning id into v_bomb;
  insert into public.game_modes (name, icon, sort) values ('Poke Kart', 'kart', 2) returning id into v_kart;
  insert into public.game_rooms (mode_id, name, sort) values
    (v_bomb, 'Components Arena', 1), (v_bomb, 'Ice Arena', 2), (v_bomb, 'Crystal Arena', 3),
    (v_bomb, 'Volcano Arena', 4), (v_bomb, 'Desert Arena', 5), (v_bomb, 'Undersea Arena', 6),
    (v_kart, 'Racetrack 1', 1), (v_kart, 'Racetrack 2', 2), (v_kart, 'Racetrack 3', 3),
    (v_kart, 'Racetrack 4', 4), (v_kart, 'Racetrack 5', 5), (v_kart, 'Racetrack 6', 6);
end
$$;
