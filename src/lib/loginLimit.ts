import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminId } from "@/lib/admins";

// Limite contra spam de login: no máximo 2 contas diferentes por conexão (IP) a cada 15 minutos.
// Entrar de novo com a mesma conta não conta. Se o banco falhar, o login passa (o limite nunca tranca o clã).
const MAX_ACCOUNTS = 2;
const WINDOW_MS = 15 * 60_000;

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

// Só o hash do IP vai pro banco (com um "sal" do próprio site, para não dar pra reverter)
const hashIp = (ip: string) => createHash("sha256").update(`${process.env.NEXTAUTH_SECRET ?? ""}:${ip}`).digest("hex");

/** true = pode entrar. Registra o login quando libera. */
export async function allowLogin(discordId: string): Promise<boolean> {
  if (!hasSupabase() || isAdminId(discordId)) return true;
  try {
    const ip = await clientIp();
    if (!ip) return true;
    const ipHash = hashIp(ip);
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { data, error } = await supabaseAdmin.from("login_events").select("discord_id").eq("ip_hash", ipHash).gte("created_at", since);
    if (error) return true;
    const accounts = new Set((data ?? []).map((r) => r.discord_id));
    if (!accounts.has(discordId) && accounts.size >= MAX_ACCOUNTS) return false;
    await supabaseAdmin.from("login_events").insert({ ip_hash: ipHash, discord_id: discordId });
    return true;
  } catch {
    return true;
  }
}

/** Apaga registros de login com mais de 1 dia (chamado pela rotina diária). */
export async function cleanupLoginEvents() {
  if (!hasSupabase()) return;
  await supabaseAdmin.from("login_events").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
}
