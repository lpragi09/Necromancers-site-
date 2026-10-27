import { getViewer, MEMBER_COLUMNS } from "@/lib/viewer";
import { ADMIN_ROLES, isAdminId } from "@/lib/admins";
import { deletePost as deleteDiscordPost, discordEnabled, editPost as editDiscordPost, sendPost as sendDiscordPost } from "@/lib/discord";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanText, decodeImage, DEMO_MESSAGE, fail, ok } from "@/lib/http";
import { ACTIVITY_COLUMNS, CLAIM_COLUMNS, DROP_COLUMNS, getCoinEpoch, getDrawnAt, GIVEAWAY_COLUMNS, ITEM_COLUMNS, ORDER_COLUMNS, POST_COLUMNS, SEASON_COLUMNS, SHOP_ITEM_COLUMNS, TOURNAMENT_SCORE_COLUMNS, DUNGEON_RUN_COLUMNS, DUNGEON_GRACE_MS } from "@/lib/data";
import { FAIR_COLUMNS, runFairDraw, setFairStatus } from "@/lib/fairServer";
import { ROLE_ORDER, type CoinClaim, type Drop, type Giveaway, type Post, type Rarity, type ShopOrder } from "@/lib/types";

// O sorteio espera o número público do drand (alguns segundos)
export const maxDuration = 30;

const RARITIES: Rarity[] = ["comum", "raro", "epico", "lendario", "shiny"];
const optionalDate = (v: unknown) => (typeof v === "string" && v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Deixa a mensagem do Discord igual ao aviso: manda, edita ou apaga. Devolve um alerta se o Discord falhar. */
async function syncPostToDiscord(post: Post & { discord_message_id: string | null }, send: boolean, mention: boolean): Promise<{ discordError?: string }> {
  if (!discordEnabled()) return {};
  const setMessage = (messageId: string | null) => supabaseAdmin.from("posts").update({ discord_message_id: messageId }).eq("id", post.id);
  try {
    if (!post.published) {
      if (post.discord_message_id) {
        await deleteDiscordPost(post.discord_message_id);
        await setMessage(null);
      }
      return {};
    }
    if (post.discord_message_id && (await editDiscordPost(post.discord_message_id, post))) return {};
    if (send || post.discord_message_id) {
      const messageId = await sendDiscordPost(post, mention);
      await setMessage(messageId);
    }
    return {};
  } catch (err) {
    return { discordError: err instanceof Error ? err.message : String(err) };
  }
}
// Só aceita link http(s) como imagem: um blob:/data: (imagem ainda subindo) não pode ir pro banco
const imageUrl = (v: unknown) => { const u = cleanText(v, 500); return /^https?:\/\//.test(u) || /^\/dungeons\/[\w-]+\.webp$/.test(u) ? u : null; };

// Painel da liderança: UMA rota, com `action`. Confere se é admin antes de tudo.
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return fail("Acesso negado.", 403);
  if (!hasSupabase()) return fail(DEMO_MESSAGE, 503);

  const body = await request.json().catch(() => null);
  const action = body?.action as string | undefined;
  const db = supabaseAdmin;
  const id = str(body?.id);

  switch (action) {
    // Consulta leve que o painel faz a cada poucos segundos: só diz se chegou pedido ou drop novo
    case "pendingCheck": {
      const [members, drops] = await Promise.all([
        db.from("members").select("id").eq("status", "pending").order("id"),
        db.from("drops").select("id").eq("status", "pending").order("id"),
      ]);
      const ids = (r: typeof members) => (r.data ?? []).map((x) => x.id).join(",");
      return ok({ signature: `${ids(members)}|${ids(drops)}` });
    }
    case "overview": {
      const [posts, giveaways, entries, seasons, items, members, pending, reviewed] = await Promise.all([
        db.from("posts").select(POST_COLUMNS).order("created_at", { ascending: false }),
        db.from("giveaways").select(GIVEAWAY_COLUMNS).order("created_at", { ascending: false }),
        db.from("giveaway_entries").select("giveaway_id").eq("status", "ok"),
        db.from("seasons").select(SEASON_COLUMNS).order("starts_at", { ascending: false }),
        db.from("drop_items").select(ITEM_COLUMNS).order("points", { ascending: false }),
        db.from("members").select(MEMBER_COLUMNS).order("created_at", { ascending: false }),
        db.from("drops").select(DROP_COLUMNS).eq("status", "pending").order("created_at"),
        db.from("drops").select(DROP_COLUMNS).neq("status", "pending").order("reviewed_at", { ascending: false }).limit(40),
      ]);
      const firstError = [posts, giveaways, seasons, items, members, pending].find((r) => r.error)?.error;
      if (firstError) {
        return fail(/does not exist|schema cache/i.test(firstError.message) ? "Falta rodar o supabase/schema.sql no SQL Editor do Supabase." : firstError.message, 500);
      }
      const counts = new Map<string, number>();
      for (const e of entries.data ?? []) counts.set(e.giveaway_id, (counts.get(e.giveaway_id) ?? 0) + 1);

      // Prints em bucket privado: links assinados de 1h, em lote
      const drops = [...((pending.data as Drop[]) ?? []), ...((reviewed.data as Drop[]) ?? [])];
      const paths = drops.map((d) => d.proof_path).filter((p): p is string => !!p);
      const signed = new Map<string, string>();
      if (paths.length) {
        const { data } = await db.storage.from("provas").createSignedUrls(paths, 3600);
        for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
      }
      const drawnAt = await getDrawnAt((giveaways.data as Giveaway[]) ?? []);
      const withUrl = (d: Drop) => ({ ...d, proof_url: d.proof_path ? signed.get(d.proof_path) ?? null : null });

      return ok({
        discordEnabled: discordEnabled(),
        posts: posts.data,
        giveaways: (giveaways.data ?? []).map((g) => ({ ...g, entries_count: counts.get(g.id) ?? 0, drawn_at: g.fair_draw_id ? drawnAt.get(g.fair_draw_id) ?? null : null })),
        seasons: seasons.data,
        items: items.data,
        members: members.data,
        pendingDrops: ((pending.data as Drop[]) ?? []).map(withUrl),
        reviewedDrops: ((reviewed.data as Drop[]) ?? []).map(withUrl),
      });
    }

    case "uploadImage": {
      const image = decodeImage(body?.image);
      if (!image) return fail("Imagem inválida ou maior que 3 MB.");
      const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${image.ext}`;
      const { error } = await db.storage.from("imagens").upload(path, image.bytes, { contentType: image.contentType });
      if (error) return fail("Falha ao enviar a imagem: " + error.message, 500);
      return ok({ url: db.storage.from("imagens").getPublicUrl(path).data.publicUrl });
    }

    // ---------- Avisos / novidades ----------
    case "savePost": {
      const p = body?.post ?? {};
      const kind = ["aviso", "novidade", "evento"].includes(p.kind) ? p.kind : "novidade";
      const fields = {
        kind,
        title: cleanText(p.title, 120),
        body: cleanText(p.body, 5000),
        image_url: imageUrl(p.image_url),
        event_at: kind === "evento" ? optionalDate(p.event_at) : null,
        pinned: !!p.pinned,
        published: p.published !== false,
        popup: !!p.popup,
        popup_public: !!p.popup && !!p.popup_public,
      };
      if (!fields.title) return fail("Dê um título.");
      const cols = `${POST_COLUMNS}, discord_message_id`;
      const { data: saved, error } = p.id
        ? await db.from("posts").update(fields).eq("id", p.id).select(cols).single()
        : await db.from("posts").insert(fields).select(cols).single();
      if (error || !saved) return fail(error?.message ?? "Não foi possível salvar.", 500);
      // Só um popup de destaque por vez: marcar este desmarca os outros
      if (fields.popup) await db.from("posts").update({ popup: false }).eq("popup", true).neq("id", (saved as Post).id);
      // O aviso já está salvo; o Discord é extra (se falhar, avisa sem desfazer nada)
      const discord = await syncPostToDiscord(saved as Post & { discord_message_id: string | null }, p.sendDiscord !== false, !!p.mentionEveryone);
      return ok({ ok: true, ...discord });
    }
    case "deletePost": {
      const { data: old } = await db.from("posts").select("discord_message_id").eq("id", id).maybeSingle();
      const { error } = await db.from("posts").delete().eq("id", id);
      if (error) return fail(error.message, 500);
      if (old?.discord_message_id) await deleteDiscordPost(old.discord_message_id).catch(() => {});
      return ok();
    }

    // ---------- Sorteios ----------
    case "saveGiveaway": {
      const g = body?.giveaway ?? {};
      const fields = {
        title: cleanText(g.title, 120),
        prize: cleanText(g.prize, 200),
        description: cleanText(g.description, 2000),
        image_url: imageUrl(g.image_url),
        ends_at: optionalDate(g.ends_at),
      };
      if (!fields.title || !fields.prize) return fail("Preencha título e prêmio.");
      const { error } = g.id ? await db.from("giveaways").update(fields).eq("id", g.id) : await db.from("giveaways").insert(fields);
      return error ? fail(error.message, 500) : ok();
    }
    case "setGiveawayStatus": {
      const status = body?.status === "closed" ? "closed" : "open";
      const { error } = await db.from("giveaways").update({ status }).eq("id", id).neq("status", "drawn");
      return error ? fail(error.message, 500) : ok();
    }
    case "deleteGiveaway": {
      const { error } = await db.from("giveaways").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }
    case "giveawayEntries": {
      const { data } = await db.from("giveaway_entries").select("member_id, status, created_at, members(char_name, status, avatar_url)").eq("giveaway_id", id).order("created_at");
      return ok({ entries: data ?? [] });
    }
    case "setEntryStatus": {
      // Aprovar ou rejeitar a inscrição de alguém (saiu do clã, fez besteira...). Rejeitado não volta sozinho.
      const status = body?.status === "rejected" ? "rejected" : "ok";
      const { data: g } = await db.from("giveaways").select("status").eq("id", str(body?.giveawayId)).maybeSingle();
      if (g?.status === "drawn") return fail("Esse sorteio já tem ganhador.");
      const { error } = await db.from("giveaway_entries").update({ status }).eq("giveaway_id", str(body?.giveawayId)).eq("member_id", str(body?.memberId));
      return error ? fail(error.message, 500) : ok();
    }
    case "fairDraw": {
      const targetId = str(body?.targetId);
      if (body?.kind === "torneio") {
        const w = Math.floor(Number(body?.week));
        const result = await runFairDraw("torneio", targetId, w >= 1 && w <= 4 ? w : null);
        if (result.error) return fail(result.error, result.status ?? 500);
        return ok({ data: result.draw });
      }
      const { data: g } = await db.from("giveaways").select("status").eq("id", targetId).maybeSingle();
      if (!g) return fail("Sorteio não encontrado.", 404);
      if (g.status === "drawn") return fail("Este sorteio já tem ganhador.");
      // Fecha as inscrições antes de congelar a lista
      if (g.status === "open") await db.from("giveaways").update({ status: "closed" }).eq("id", targetId);
      const result = await runFairDraw("sorteio", targetId);
      if (result.error) return fail(result.error, result.status ?? 500);
      return ok({ data: result.draw });
    }
    case "fairStatus": {
      await setFairStatus(id, body?.status === "confirmed" ? "confirmed" : "skipped");
      return ok();
    }
    case "confirmGiveawayWinner": {
      const { data: draw } = await db.from("fair_draws").select(FAIR_COLUMNS).eq("id", str(body?.drawId)).maybeSingle();
      if (!draw || draw.status !== "drawn") return fail("Giro não encontrado ou já resolvido.");
      const { error } = await db
        .from("giveaways")
        .update({ status: "drawn", winner_member_id: draw.winner_username, winner_name: draw.winner_label, fair_draw_id: draw.id })
        .eq("id", draw.target_id);
      if (error) return fail(error.message, 500);
      await setFairStatus(draw.id, "confirmed");
      return ok();
    }

    // ---------- Temporadas ----------
    case "saveSeason": {
      const s = body?.season ?? {};
      const prizes = (Array.isArray(s.prizes) ? s.prizes : [])
        .map((p: unknown) => cleanText(p, 200))
        .filter(Boolean)
        .slice(0, 10);
      const fields = {
        name: cleanText(s.name, 80),
        starts_at: optionalDate(s.starts_at) ?? new Date().toISOString(),
        ends_at: optionalDate(s.ends_at),
        prizes,
      };
      if (!fields.name) return fail("Dê um nome para a temporada.");
      // Nova nasce encerrada: só uma temporada fica ativa, e quem ativa é a liderança na lista
      const { error } = s.id ? await db.from("seasons").update(fields).eq("id", s.id) : await db.from("seasons").insert({ ...fields, status: "closed" });
      return error ? fail(error.message, 500) : ok();
    }
    case "setSeasonStatus": {
      const status = body?.status === "closed" ? "closed" : "active";
      // Só uma temporada recebe drops por vez: abrir uma fecha as outras
      if (status === "active") await db.from("seasons").update({ status: "closed" }).neq("id", id);
      const { error } = await db.from("seasons").update({ status }).eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }
    case "deleteSeason": {
      const { data: proofs } = await db.from("drops").select("proof_path").eq("season_id", id);
      const { error } = await db.from("seasons").delete().eq("id", id);
      if (error) return fail(error.message, 500);
      const paths = (proofs ?? []).map((d) => d.proof_path).filter((p): p is string => !!p);
      if (paths.length) await db.storage.from("provas").remove(paths);
      return ok();
    }

    // ---------- Itens ----------
    case "saveItem": {
      const it = body?.item ?? {};
      const fields = {
        name: cleanText(it.name, 80),
        points: Math.floor(Number(it.points) || 0),
        rarity: RARITIES.includes(it.rarity) ? it.rarity : "raro",
        image_url: imageUrl(it.image_url),
        active: it.active !== false,
      };
      if (!fields.name || fields.points <= 0) return fail("Preencha nome e pontos (maior que zero).");
      const { error } = it.id ? await db.from("drop_items").update(fields).eq("id", it.id) : await db.from("drop_items").insert(fields);
      return error ? fail(error.message, 500) : ok();
    }
    case "deleteItem": {
      const { error } = await db.from("drop_items").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }

    // ---------- Drops ----------
    case "reviewDrop": {
      const status = body?.status === "approved" ? "approved" : body?.status === "rejected" ? "rejected" : "pending";
      const { error } = await db
        .from("drops")
        .update({ status, reviewed_at: status === "pending" ? null : new Date().toISOString() })
        .eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }
    case "deleteDrop": {
      const { data } = await db.from("drops").select("proof_path").eq("id", id).maybeSingle();
      const { error } = await db.from("drops").delete().eq("id", id);
      if (error) return fail(error.message, 500);
      if (data?.proof_path) await db.storage.from("provas").remove([data.proof_path]);
      return ok();
    }

    // ---------- Lojinha ----------
    case "shopOverview": {
      const epoch = await getCoinEpoch();
      const [activities, items, members, pendingClaims, reviewedClaims, pendingOrders, recentOrders, approved, spent, lastReset] = await Promise.all([
        db.from("activity_types").select(ACTIVITY_COLUMNS).order("coins", { ascending: false }),
        db.from("shop_items").select(SHOP_ITEM_COLUMNS).order("price"),
        db.from("members").select("id, char_name, avatar_url"),
        db.from("coin_claims").select(CLAIM_COLUMNS).eq("status", "pending").order("created_at").limit(200),
        db.from("coin_claims").select(CLAIM_COLUMNS).neq("status", "pending").order("reviewed_at", { ascending: false, nullsFirst: false }).limit(40),
        db.from("shop_orders").select(ORDER_COLUMNS).eq("status", "pending").order("created_at").limit(200),
        db.from("shop_orders").select(ORDER_COLUMNS).neq("status", "pending").order("delivered_at", { ascending: false, nullsFirst: false }).limit(40),
        db.from("coin_claims").select("member_id, coins").eq("status", "approved").eq("epoch", epoch),
        db.from("shop_orders").select("member_id, price").neq("status", "cancelled").eq("epoch", epoch),
        db.from("coin_resets").select("created_at, created_by").order("id", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const firstError = [activities, items, pendingClaims].find((r) => r.error)?.error;
      if (firstError) {
        return fail(/does not exist|schema cache|coin_epoch/i.test(firstError.message) ? "Falta rodar o supabase/migracao-lojinha.sql no SQL Editor do Supabase." : firstError.message, 500);
      }

      // Saldo de cada membro no ciclo atual
      const balances = new Map<string, { earned: number; spent: number }>();
      for (const c of approved.data ?? []) {
        const b = balances.get(c.member_id) ?? { earned: 0, spent: 0 };
        b.earned += c.coins;
        balances.set(c.member_id, b);
      }
      for (const o of spent.data ?? []) {
        const b = balances.get(o.member_id) ?? { earned: 0, spent: 0 };
        b.spent += o.price;
        balances.set(o.member_id, b);
      }
      const people = new Map((members.data ?? []).map((m) => [m.id, m]));
      const ranking = [...balances.entries()]
        .map(([id, b]) => ({ member_id: id, char_name: people.get(id)?.char_name ?? "?", avatar_url: people.get(id)?.avatar_url ?? null, ...b, balance: b.earned - b.spent }))
        .sort((a, b) => b.balance - a.balance);

      // Prints em bucket privado: links assinados de 1h
      const claims = [...((pendingClaims.data as CoinClaim[]) ?? []), ...((reviewedClaims.data as CoinClaim[]) ?? [])];
      const paths = claims.map((c) => c.proof_path).filter((p): p is string => !!p);
      const signed = new Map<string, string>();
      if (paths.length) {
        const { data } = await db.storage.from("provas").createSignedUrls(paths, 3600);
        for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
      }
      const names = (id: string) => ({ char_name: people.get(id)?.char_name ?? "membro removido", avatar_url: people.get(id)?.avatar_url ?? null });
      const claimView = (c: CoinClaim) => ({ ...c, ...names(c.member_id), proof_url: c.proof_path ? signed.get(c.proof_path) ?? null : null });
      const orderView = (o: ShopOrder) => ({ ...o, ...names(o.member_id) });

      return ok({
        epoch,
        lastReset: lastReset.data ?? null,
        activities: activities.data,
        items: items.data,
        pendingClaims: ((pendingClaims.data as CoinClaim[]) ?? []).map(claimView),
        reviewedClaims: ((reviewedClaims.data as CoinClaim[]) ?? []).map(claimView),
        pendingOrders: ((pendingOrders.data as ShopOrder[]) ?? []).map(orderView),
        recentOrders: ((recentOrders.data as ShopOrder[]) ?? []).map(orderView),
        balances: ranking,
      });
    }
    case "saveActivity": {
      const a = body?.activity ?? {};
      const fields = { name: cleanText(a.name, 80), coins: Math.floor(Number(a.coins) || 0), active: a.active !== false };
      if (!fields.name || fields.coins <= 0) return fail("Preencha o nome e as moedas (maior que zero).");
      const { error } = a.id ? await db.from("activity_types").update(fields).eq("id", a.id) : await db.from("activity_types").insert(fields);
      return error ? fail(error.message, 500) : ok();
    }
    case "deleteActivity": {
      const { error } = await db.from("activity_types").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }
    case "saveShopItem": {
      const it = body?.item ?? {};
      const stockRaw = it.stock === "" || it.stock === null || it.stock === undefined ? null : Math.floor(Number(it.stock));
      const fields = {
        name: cleanText(it.name, 80),
        description: cleanText(it.description, 300),
        image_url: imageUrl(it.image_url),
        price: Math.floor(Number(it.price) || 0),
        stock: stockRaw === null || Number.isNaN(stockRaw) ? null : Math.max(0, stockRaw),
        active: it.active !== false,
      };
      if (!fields.name || fields.price <= 0) return fail("Preencha o nome e o preço (maior que zero).");
      const { error } = it.id ? await db.from("shop_items").update(fields).eq("id", it.id) : await db.from("shop_items").insert(fields);
      return error ? fail(error.message, 500) : ok();
    }
    case "deleteShopItem": {
      const { error } = await db.from("shop_items").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }
    case "reviewClaim": {
      const status = body?.status === "approved" ? "approved" : body?.status === "rejected" ? "rejected" : "pending";
      const { error } = await db
        .from("coin_claims")
        .update({ status, reviewed_at: status === "pending" ? null : new Date().toISOString() })
        .eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }
    case "deleteClaim": {
      const { data } = await db.from("coin_claims").select("proof_path").eq("id", id).maybeSingle();
      const { error } = await db.from("coin_claims").delete().eq("id", id);
      if (error) return fail(error.message, 500);
      if (data?.proof_path) await db.storage.from("provas").remove([data.proof_path]);
      return ok();
    }
    case "setOrderStatus": {
      const status = body?.status === "delivered" ? "delivered" : body?.status === "cancelled" ? "cancelled" : "pending";
      const { data: order } = await db.from("shop_orders").select("status, item_id").eq("id", id).maybeSingle();
      if (!order) return fail("Pedido não encontrado.", 404);
      if (order.status === status) return ok();
      // Reabrir um cancelado gastaria as moedas de novo sem conferir o saldo: o membro resgata outra vez
      if (order.status === "cancelled") return fail("Pedido cancelado não pode ser reaberto. O membro pode resgatar de novo.");
      const { error } = await db
        .from("shop_orders")
        .update({ status, delivered_at: status === "delivered" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) return fail(error.message, 500);
      // Cancelar devolve o item ao estoque (as moedas voltam sozinhas: pedido cancelado não conta no saldo)
      if (order.item_id && status === "cancelled") {
        const { data: item } = await db.from("shop_items").select("stock").eq("id", order.item_id).maybeSingle();
        if (item && item.stock !== null) await db.from("shop_items").update({ stock: item.stock + 1 }).eq("id", order.item_id);
      }
      return ok();
    }
    case "resetCoins": {
      // Novo ciclo: todo saldo volta a zero (o histórico fica). Pedidos de moedas ainda não conferidos expiram.
      const { error } = await db.from("coin_resets").insert({ created_by: viewer.member?.char_name ?? viewer.name });
      if (error) return fail(error.message, 500);
      await db.from("coin_claims").update({ status: "expired", reviewed_at: new Date().toISOString() }).eq("status", "pending");
      return ok();
    }

    // ---------- Torneios ----------
    case "tournamentOverview": {
      const { data: months, error } = await db.from("tournament_months").select("id, name, created_at").order("created_at", { ascending: false });
      if (error) {
        return fail(/does not exist|schema cache/i.test(error.message) ? "Falta rodar o supabase/migracao-torneios.sql no SQL Editor do Supabase." : error.message, 500);
      }
      const monthId = str(body?.monthId) || months?.[0]?.id || "";
      const [scores, members] = await Promise.all([
        monthId ? db.from("tournament_scores").select(TOURNAMENT_SCORE_COLUMNS).eq("month_id", monthId).order("count", { ascending: false }).order("player_name") : Promise.resolve({ data: [] }),
        db.from("members").select("char_name, avatar_url").eq("status", "active").order("char_name"),
      ]);
      return ok({
        months: months ?? [], monthId, scores: scores.data ?? [],
        names: (members.data ?? []).map((m) => m.char_name),
        photos: (members.data ?? []).filter((m) => m.avatar_url).map((m) => [m.char_name, m.avatar_url]),
      });
    }
    case "createTournamentMonth": {
      const name = cleanText(body?.name, 60);
      if (!name) return fail("Dê um nome para o mês (ex.: Novembro 2026).");
      const { data, error } = await db.from("tournament_months").insert({ name }).select("id").single();
      return error ? fail(error.message, 500) : ok({ id: data.id });
    }
    case "deleteTournamentMonth": {
      const { error } = await db.from("tournament_months").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }
    case "tournamentAdd": {
      const week = Math.floor(Number(body?.week));
      const name = cleanText(body?.name, 40);
      if (!name) return fail("Digite o nome de quem foi.");
      if (week < 1 || week > 4) return fail("Semana inválida.");
      const { data, error } = await db.rpc("tournament_add", { p_month: str(body?.monthId), p_week: week, p_name: name });
      return error ? fail(error.message, 500) : ok({ count: data });
    }
    case "tournamentBump": {
      const delta = Number(body?.delta) > 0 ? 1 : -1;
      const { data, error } = await db.rpc("tournament_bump", { p_id: id, p_delta: delta });
      return error ? fail(error.message, 500) : ok({ count: data });
    }
    case "tournamentRemove": {
      const { error } = await db.from("tournament_scores").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }

    // ---------- Dungeons ----------
    case "dungeonsOverview": {
      const [dungeons, runs] = await Promise.all([
        db.from("dungeons").select("id, name, image_url, active").order("name"),
        db.from("dungeon_runs").select(`${DUNGEON_RUN_COLUMNS}, dungeon_participants(member_id), members!dungeon_runs_creator_id_fkey(char_name)`)
          .eq("status", "open").gte("starts_at", new Date(Date.now() - DUNGEON_GRACE_MS).toISOString()).order("starts_at").limit(200),
      ]);
      if (dungeons.error) {
        return fail(/does not exist|schema cache/i.test(dungeons.error.message) ? "Falta rodar o supabase/migracao-dungeons.sql no SQL Editor do Supabase." : dungeons.error.message, 500);
      }
      const list = ((runs.data ?? []) as unknown as (Record<string, unknown> & { dungeon_participants: unknown[]; members: { char_name: string } | null })[])
        .map(({ dungeon_participants, members, ...r }) => ({ ...r, filled: dungeon_participants.length, creator_name: members?.char_name ?? "?" }));
      return ok({ dungeons: dungeons.data, runs: list });
    }
    case "saveDungeon": {
      const d = body?.dungeon ?? {};
      const fields = { name: cleanText(d.name, 60), image_url: imageUrl(d.image_url), active: d.active !== false };
      if (!fields.name) return fail("Dê o nome da dungeon.");
      const { error } = d.id ? await db.from("dungeons").update(fields).eq("id", d.id) : await db.from("dungeons").insert(fields);
      return error ? fail(error.message, 500) : ok();
    }
    case "deleteDungeon": {
      const { error } = await db.from("dungeons").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }
    case "cancelDungeonRun": {
      const { error } = await db.from("dungeon_runs").update({ status: "cancelled" }).eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }

    // ---------- Membros ----------
    case "saveMember": {
      const m = body?.member ?? {};
      const fields: Record<string, unknown> = {};
      if (ROLE_ORDER.includes(m.role)) fields.role = m.role;
      if (["pending", "active", "inactive"].includes(m.status)) fields.status = m.status;
      if (typeof m.char_name === "string" && m.char_name.trim()) fields.char_name = cleanText(m.char_name, 30);
      if (m.level !== undefined) fields.level = Number(m.level) > 0 ? Math.min(1000, Math.floor(Number(m.level))) : null;
      // Ninguém tira o próprio acesso sem querer
      if (viewer.member?.id === m.id && (fields.status && fields.status !== "active")) return fail("Você não pode desativar a si mesmo.");
      if (viewer.member?.id === m.id && fields.role && !ADMIN_ROLES.includes(fields.role as string) && !isAdminId(viewer.discordId)) {
        return fail("Você perderia o acesso ao painel. Peça para outro líder mudar o seu cargo.");
      }
      const { error } = await db.from("members").update(fields).eq("id", str(m.id));
      if (error) return fail(/members_char_name|duplicate/i.test(error.message) ? "Já existe um membro com esse personagem." : error.message, 400);
      return ok();
    }
    case "deleteMember": {
      if (viewer.member?.id === id) return fail("Você não pode remover a si mesmo.");
      // Os drops somem junto (cascade); os prints guardados também precisam sair do bucket
      const { data: proofs } = await db.from("drops").select("proof_path").eq("member_id", id);
      const { error } = await db.from("members").delete().eq("id", id);
      if (error) return fail(error.message, 500);
      const paths = (proofs ?? []).map((d) => d.proof_path).filter((p): p is string => !!p);
      if (paths.length) await db.storage.from("provas").remove(paths);
      return ok();
    }

    default:
      return fail("Ação desconhecida.");
  }
}
