-- Banco dos Games: quem quer jogar entra no banco do jogo e a liderança aleatoriza nas salas.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.
--   Quem está no banco não está em sala (e vice-versa). A vaga no banco vale 1 hora, como nas salas.

create table if not exists public.game_bench (
  mode_id   uuid not null references public.game_modes (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (mode_id, member_id)
);
create index if not exists game_bench_member on public.game_bench (member_id);
alter table public.game_bench enable row level security;

-- Entrar numa sala também tira a pessoa do banco
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
  delete from public.game_bench where member_id = p_member;
  insert into public.game_room_players (room_id, member_id) values (p_room, p_member);
  return 'ok';
end
$$;

-- Aleatorizar: embaralha o banco do jogo e coloca nas salas com vaga (enche uma sala de cada vez).
-- Quem não couber continua no banco. Devolve quantas pessoas foram colocadas.
create or replace function public.game_shuffle(p_mode uuid) returns integer
language plpgsql as $$
declare
  v_member uuid;
  v_room   uuid;
  v_placed integer := 0;
begin
  -- Trava as salas do jogo enquanto distribui
  perform 1 from public.game_rooms where mode_id = p_mode for update;
  delete from public.game_bench where joined_at < now() - interval '1 hour';
  delete from public.game_room_players where joined_at < now() - interval '1 hour';

  for v_member in select member_id from public.game_bench where mode_id = p_mode order by random() loop
    select r.id into v_room
    from public.game_rooms r
    where r.mode_id = p_mode and r.active
      and (select count(*) from public.game_room_players p where p.room_id = r.id) < r.slots
    order by r.sort, r.name
    limit 1;
    exit when v_room is null;
    delete from public.game_room_players where member_id = v_member;
    insert into public.game_room_players (room_id, member_id) values (v_room, v_member);
    delete from public.game_bench where mode_id = p_mode and member_id = v_member;
    v_placed := v_placed + 1;
  end loop;
  return v_placed;
end
$$;

revoke execute on function public.game_join(uuid, uuid) from public, anon, authenticated;
grant execute on function public.game_join(uuid, uuid) to service_role;
revoke execute on function public.game_shuffle(uuid) from public, anon, authenticated;
grant execute on function public.game_shuffle(uuid) to service_role;
