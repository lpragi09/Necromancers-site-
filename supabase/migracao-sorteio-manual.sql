-- Sorteio com participantes digitados pela liderança. Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.
--   giveaways.manual_entries: lista de nomes. Preenchida = sorteio manual, sem inscrição pelo site.
--   Vazia (null) = sorteio normal, com inscrição dos membros.

alter table public.giveaways add column if not exists manual_entries text[];
