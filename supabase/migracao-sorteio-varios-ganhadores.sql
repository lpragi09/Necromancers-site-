-- Sorteio com mais de um ganhador. Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.
--   giveaways.winners_count: quantos ganhadores o sorteio tem (1 é o padrão, como já era).
--   giveaways.winners: quem já ganhou, na ordem: [{ name, member_id, draw_id, drawn_at }].

alter table public.giveaways add column if not exists winners_count integer not null default 1;
alter table public.giveaways drop constraint if exists giveaways_winners_count_check;
alter table public.giveaways add constraint giveaways_winners_count_check check (winners_count between 1 and 50);
alter table public.giveaways add column if not exists winners jsonb not null default '[]'::jsonb;

-- Sorteios que já tinham ganhador entram na lista nova
update public.giveaways g
set winners = jsonb_build_array(jsonb_build_object(
  'name', g.winner_name,
  'member_id', g.winner_member_id,
  'draw_id', g.fair_draw_id,
  'drawn_at', (select coalesce(d.drawn_at, d.created_at) from public.fair_draws d where d.id = g.fair_draw_id)
))
where g.winner_name is not null and g.winners = '[]'::jsonb;
