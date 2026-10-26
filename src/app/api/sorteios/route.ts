import { getViewer, isActiveMember } from "@/lib/viewer";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { DEMO_MESSAGE, fail, ok } from "@/lib/http";

// Membro ativo entra (ou sai) de um sorteio aberto. Uma inscrição por pessoa (PK no banco).
export async function POST(request: Request) {
  if (!hasSupabase()) return fail(DEMO_MESSAGE, 503);
  const viewer = await getViewer();
  if (!viewer) return fail("Entre com o Discord para participar.", 401);
  if (!isActiveMember(viewer)) return fail("Só membros aprovados do clã podem participar. Complete seu cadastro no perfil.", 403);

  const body = await request.json().catch(() => null);
  const id = typeof body?.giveawayId === "string" ? body.giveawayId : "";
  const leave = body?.leave === true;

  const { data: g } = await supabaseAdmin.from("giveaways").select("status, ends_at").eq("id", id).maybeSingle();
  if (!g) return fail("Sorteio não encontrado.", 404);
  if (g.status !== "open" || (g.ends_at && new Date(g.ends_at).getTime() < Date.now())) return fail("As inscrições deste sorteio já fecharam.");

  if (leave) {
    await supabaseAdmin.from("giveaway_entries").delete().eq("giveaway_id", id).eq("member_id", viewer.member.id);
    return ok({ joined: false });
  }
  const { error } = await supabaseAdmin
    .from("giveaway_entries")
    .upsert({ giveaway_id: id, member_id: viewer.member.id }, { onConflict: "giveaway_id,member_id", ignoreDuplicates: true });
  if (error) return fail(error.message, 500);
  return ok({ joined: true });
}
