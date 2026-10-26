import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente com a service role: ignora o RLS. Só pode ser usado no servidor
// (rotas /api e páginas), depois de conferir quem está fazendo a requisição.
// É criado no primeiro uso para o build não depender da chave.
let client: SupabaseClient | null = null;

/** Sem as variáveis do Supabase o site abre em modo demonstração (dados de exemplo, nada é salvo). */
export const hasSupabase = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.");
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => Reflect.get(getClient(), prop),
});
