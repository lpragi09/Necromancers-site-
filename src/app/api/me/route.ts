import { getViewer } from "@/lib/viewer";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminId } from "@/lib/admins";
import { cleanText, DEMO_MESSAGE, fail, ok } from "@/lib/http";

// Cadastro no clã: quem entrou pelo Discord informa o personagem. A liderança aprova no painel.
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return fail("Entre com o Discord primeiro.", 401);
  if (!hasSupabase()) return fail(DEMO_MESSAGE, 503);

  const body = await request.json().catch(() => null);
  const charName = cleanText(body?.charName, 30);
  const levelRaw = Number(body?.level);
  const level = Number.isFinite(levelRaw) && levelRaw > 0 ? Math.min(1000, Math.floor(levelRaw)) : null;
  if (charName.length < 2) return fail("Informe o nome do seu personagem.");

  const db = supabaseAdmin;
  const fields = { char_name: charName, level, discord_name: viewer.name || "membro", avatar_url: viewer.image };

  if (viewer.member) {
    const { error } = await db.from("members").update(fields).eq("id", viewer.member.id);
    if (error) return fail(/members_char_name|duplicate/i.test(error.message) ? "Já existe um membro com esse personagem." : error.message, 400);
    return ok();
  }

  // Admin fixo (ADMIN_DISCORD_IDS) já entra ativo como líder; o resto espera aprovação
  const boss = isAdminId(viewer.discordId);
  const { error } = await db.from("members").insert({
    ...fields,
    discord_id: viewer.discordId,
    status: boss ? "active" : "pending",
    role: boss ? "lider" : "recruta",
  });
  if (error) return fail(/members_char_name|duplicate/i.test(error.message) ? "Já existe um membro com esse personagem." : error.message, 400);
  return ok();
}
