import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";

// Mantém o Supabase ativo (o plano gratuito pausa o projeto após 7 dias sem uso).
// Chamado todo dia pelo cron da Vercel (vercel.json). Faz uma consulta de verdade no banco.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabase()) return Response.json({ ok: false, error: "Supabase não configurado" }, { status: 503 });
  const started = Date.now();
  const { error } = await supabaseAdmin.from("members").select("id", { count: "exact", head: true });
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json(
    { ok: true, ms: Date.now() - started, em: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
