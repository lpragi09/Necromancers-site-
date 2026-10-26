import { getViewer, isActiveMember } from "@/lib/viewer";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanText, decodeImage, DEMO_MESSAGE, fail, ok } from "@/lib/http";

const MAX_PENDING = 30;

// Membro envia um drop com print. Fica pendente até a liderança aprovar no painel.
export async function POST(request: Request) {
  if (!hasSupabase()) return fail(DEMO_MESSAGE, 503);
  const viewer = await getViewer();
  if (!viewer) return fail("Entre com o Discord para enviar drops.", 401);
  if (!isActiveMember(viewer)) return fail("Só membros aprovados do clã podem enviar drops.", 403);

  const body = await request.json().catch(() => null);
  const quantity = Math.floor(Number(body?.quantity) || 1);
  if (quantity < 1 || quantity > 999) return fail("Quantidade inválida.");
  const image = decodeImage(body?.proof);
  if (!image) return fail("Anexe o print do drop (imagem de até 3 MB).");

  const db = supabaseAdmin;
  const [{ data: item }, { data: season }, { count }] = await Promise.all([
    db.from("drop_items").select("id, name, points, rarity, active").eq("id", String(body?.itemId ?? "")).maybeSingle(),
    db.from("seasons").select("id").eq("status", "active").order("starts_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("drops").select("id", { count: "exact", head: true }).eq("member_id", viewer.member.id).eq("status", "pending"),
  ]);
  if (!item || !item.active) return fail("Escolha um item da lista.");
  if (!season) return fail("Nenhuma temporada aberta no momento.");
  if ((count ?? 0) >= MAX_PENDING) return fail("Você já tem muitos drops esperando aprovação. Aguarde a liderança conferir.");

  // Print vai para o bucket privado; o banco guarda só o caminho
  const path = `${viewer.member.id}/${crypto.randomUUID()}.${image.ext}`;
  const { error: upErr } = await db.storage.from("provas").upload(path, image.bytes, { contentType: image.contentType });
  if (upErr) return fail("Falha ao enviar o print: " + upErr.message, 500);

  const { error } = await db.from("drops").insert({
    season_id: season.id,
    member_id: viewer.member.id,
    item_id: item.id,
    item_name: item.name,
    rarity: item.rarity,
    points: item.points,
    quantity,
    proof_path: path,
    note: cleanText(body?.note, 200) || null,
  });
  if (error) {
    await db.storage.from("provas").remove([path]);
    return fail(error.message, 500);
  }
  return ok();
}
