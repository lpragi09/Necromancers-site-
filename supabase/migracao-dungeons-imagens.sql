-- Imagem do boss em cada dungeon. Rode no SQL Editor do Supabase. Pode rodar mais de uma vez sem duplicar nada.
--   1) Coluna image_url nas dungeons (a liderança troca a imagem pelo painel).
--   2) Cadastra Magma, Nightmare, Sacred Ruins e Undersea Volcano com as imagens que já vêm no site.

alter table public.dungeons add column if not exists image_url text;

insert into public.dungeons (name, image_url)
select v.name, v.image_url
from (values
  ('Magma',            '/dungeons/magma.webp'),
  ('Nightmare',        '/dungeons/nightmare.webp'),
  ('Sacred Ruins',     '/dungeons/sacred-ruins.webp'),
  ('Undersea Volcano', '/dungeons/undersea-volcano.webp')
) as v (name, image_url)
where not exists (select 1 from public.dungeons d where lower(d.name) = lower(v.name));

-- Quem já existia (ex.: a Magma do SQL anterior) ganha a imagem, se ainda não tiver uma
update public.dungeons d
set image_url = v.image_url
from (values
  ('magma',            '/dungeons/magma.webp'),
  ('nightmare',        '/dungeons/nightmare.webp'),
  ('sacred ruins',     '/dungeons/sacred-ruins.webp'),
  ('undersea volcano', '/dungeons/undersea-volcano.webp')
) as v (name, image_url)
where lower(d.name) = v.name and d.image_url is null;
