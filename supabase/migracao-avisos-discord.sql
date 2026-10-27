-- Avisos no Discord: guarda qual mensagem do canal corresponde a cada aviso do site,
-- para editar e apagar no Discord junto com o site.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez sem problema.

alter table public.posts add column if not exists discord_message_id text;
