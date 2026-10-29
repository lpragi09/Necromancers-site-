import { getViewer, isActiveMember } from "@/lib/viewer";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanText, decodeImage, DEMO_MESSAGE, fail, ok } from "@/lib/http";
import { getCoinEpoch } from "@/lib/data";

const MAX_PENDING = 20;
const MAX_AGE_DAYS = 30;

// Lojinha do membro: pedir moedas de uma atividade (com print) ou resgatar um item com as moedas.
export async function POST(request: Request) {
  if (!hasSupabase()) return fail(DEMO_MESSAGE, 503);
  const viewer = await getViewer();
  if (!viewer) return fail("Entre com o Discord primeiro.", 401);
  if (!isActiveMember(viewer)) return fail("Só membros aprovados do clã usam a lojinha.", 403);

  const body = await request.json().catch(() => null);
  const db = supabaseAdmin;
  const memberId = viewer.member.id;

  if (body?.action === "claim") {
    const happened = new Date(String(body?.happenedAt ?? ""));
    if (Number.isNaN(happened.getTime())) return fail("Informe o dia e a hora da atividade.");
    if (happened.getTime() > Date.now() + 10 * 60_000) return fail("A data da atividade não pode ser no futuro.");
    if (happened.getTime() < Date.now() - MAX_AGE_DAYS * 86_400_000) return fail(`Só vale atividade dos últimos ${MAX_AGE_DAYS} dias.`);
    const image = decodeImage(body?.proof);
    if (!image) return fail("Anexe o print da atividade (imagem de até 3 MB).");

    const [{ data: activity }, { count }, epoch] = await Promise.all([
      db.from("activity_types").select("id, name, coins, active").eq("id", String(body?.activityId ?? "")).maybeSingle(),
      db.from("coin_claims").select("id", { count: "exact", head: true }).eq("member_id", memberId).eq("status", "pending"),
      getCoinEpoch(),
    ]);
    if (!activity || !activity.active) return fail("Escolha uma atividade da lista.");
    if ((count ?? 0) >= MAX_PENDING) return fail("Você já tem muitos pedidos esperando a liderança. Aguarde conferirem.");

    const path = `moedas/${memberId}/${crypto.randomUUID()}.${image.ext}`;
    const { error: upErr } = await db.storage.from("provas").upload(path, image.bytes, { contentType: image.contentType });
    if (upErr) return fail("Falha ao enviar o print: " + upErr.message, 500);

    const { error } = await db.from("coin_claims").insert({
      member_id: memberId,
      activity_id: activity.id,
      activity_name: activity.name,
      coins: activity.coins,
      happened_at: happened.toISOString(),
      proof_path: path,
      note: cleanText(body?.note, 200) || null,
      epoch,
    });
    if (error) {
      await db.storage.from("provas").remove([path]);
      return fail(error.message, 500);
    }
    return ok();
  }

  if (body?.action === "buy") {
    const { data, error } = await db.rpc("buy_shop_item", { p_member: memberId, p_item: String(body?.itemId ?? "") });
    if (error) {
      if (/SALDO_INSUFICIENTE/.test(error.message)) return fail("Evaldocoins insuficientes para esse item.");
      if (/SEM_ESTOQUE/.test(error.message)) return fail("Esse item acabou no estoque.");
      if (/ITEM_INDISPONIVEL/.test(error.message)) return fail("Esse item não está mais disponível.");
      return fail(error.message, 500);
    }
    return ok({ orderId: data });
  }

  return fail("Ação desconhecida.");
}
