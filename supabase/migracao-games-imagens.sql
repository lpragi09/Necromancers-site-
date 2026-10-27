-- Imagem dos jogos e das salas de Games. Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.
--   game_modes.image_url: imagem do jogo (aparece no cabeçalho e é o ícone padrão das salas).
--   game_rooms.image_url: ícone próprio de uma sala (opcional).

alter table public.game_modes add column if not exists image_url text;
alter table public.game_rooms add column if not exists image_url text;
