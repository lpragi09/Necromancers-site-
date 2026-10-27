import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { FAIR_COLUMNS } from "@/lib/fairServer";
import { canSeeContent, getViewer } from "@/lib/viewer";

const LIST_COLUMNS = "id, kind, target_id, title, total_weight, drand_round, winner_label, winner_username, status, created_at, drawn_at";

// Registro dos sorteios (só para membros): ?id= traz um giro completo (com a lista), ?target= os giros de um sorteio
export async function GET(request: Request) {
  if (!canSeeContent(await getViewer())) return Response.json({ error: "Área exclusiva do clã." }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const target = url.searchParams.get("target");
  // Resposta depende de quem pede: nada de cache compartilhado na CDN
  const headers = { "Cache-Control": "private, no-store" };
  if (!hasSupabase()) return Response.json(id ? { error: "Sorteio não encontrado." } : { draws: [] }, { status: id ? 404 : 200 });

  if (id) {
    const { data } = await supabaseAdmin.from("fair_draws").select(FAIR_COLUMNS).eq("id", id).maybeSingle();
    if (!data) return Response.json({ error: "Sorteio não encontrado." }, { status: 404 });
    return Response.json({ draw: data }, { headers });
  }

  let query = supabaseAdmin.from("fair_draws").select(LIST_COLUMNS).order("created_at", { ascending: false }).limit(100);
  if (target) query = query.eq("target_id", target);
  const { data, error } = await query;
  return Response.json({ draws: error ? [] : data ?? [] }, { headers });
}
