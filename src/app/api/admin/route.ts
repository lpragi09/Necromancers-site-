import { getViewer, MEMBER_COLUMNS } from "@/lib/viewer";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { cleanText, decodeImage, DEMO_MESSAGE, fail, ok } from "@/lib/http";
import { DROP_COLUMNS, GIVEAWAY_COLUMNS, ITEM_COLUMNS, POST_COLUMNS, SEASON_COLUMNS } from "@/lib/data";
import { FAIR_COLUMNS, runFairDraw, setFairStatus } from "@/lib/fairServer";
import { ROLE_ORDER, type Drop, type Rarity } from "@/lib/types";

// O sorteio espera o número público do drand (alguns segundos)
export const maxDuration = 30;

const RARITIES: Rarity[] = ["comum", "raro", "epico", "lendario", "shiny"];
const optionalDate = (v: unknown) => (typeof v === "string" && v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);
const str = (v: unknown) => (typeof v === "string" ? v : "");

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
    case "overview": {
      const [posts, giveaways, entries, seasons, items, members, pending, reviewed] = await Promise.all([
        db.from("posts").select(POST_COLUMNS).order("created_at", { ascending: false }),
        db.from("giveaways").select(GIVEAWAY_COLUMNS).order("created_at", { ascending: false }),
        db.from("giveaway_entries").select("giveaway_id"),
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
      const withUrl = (d: Drop) => ({ ...d, proof_url: d.proof_path ? signed.get(d.proof_path) ?? null : null });

      return ok({
        posts: posts.data,
        giveaways: (giveaways.data ?? []).map((g) => ({ ...g, entries_count: counts.get(g.id) ?? 0 })),
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
        image_url: cleanText(p.image_url, 500) || null,
        event_at: kind === "evento" ? optionalDate(p.event_at) : null,
        pinned: !!p.pinned,
        published: p.published !== false,
      };
      if (!fields.title) return fail("Dê um título.");
      const { error } = p.id ? await db.from("posts").update(fields).eq("id", p.id) : await db.from("posts").insert(fields);
      return error ? fail(error.message, 500) : ok();
    }
    case "deletePost": {
      const { error } = await db.from("posts").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }

    // ---------- Sorteios ----------
    case "saveGiveaway": {
      const g = body?.giveaway ?? {};
      const fields = {
        title: cleanText(g.title, 120),
        prize: cleanText(g.prize, 200),
        description: cleanText(g.description, 2000),
        image_url: cleanText(g.image_url, 500) || null,
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
      const { data } = await db.from("giveaway_entries").select("created_at, members(char_name, status)").eq("giveaway_id", id).order("created_at");
      return ok({ entries: data ?? [] });
    }
    case "fairDraw": {
      const targetId = str(body?.targetId);
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
      const { error } = s.id ? await db.from("seasons").update(fields).eq("id", s.id) : await db.from("seasons").insert(fields);
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
      const { error } = await db.from("seasons").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }

    // ---------- Itens ----------
    case "saveItem": {
      const it = body?.item ?? {};
      const fields = {
        name: cleanText(it.name, 80),
        points: Math.floor(Number(it.points) || 0),
        rarity: RARITIES.includes(it.rarity) ? it.rarity : "raro",
        image_url: cleanText(it.image_url, 500) || null,
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
      const { error } = await db.from("members").update(fields).eq("id", str(m.id));
      if (error) return fail(/members_char_name|duplicate/i.test(error.message) ? "Já existe um membro com esse personagem." : error.message, 400);
      return ok();
    }
    case "deleteMember": {
      if (viewer.member?.id === id) return fail("Você não pode remover a si mesmo.");
      const { error } = await db.from("members").delete().eq("id", id);
      return error ? fail(error.message, 500) : ok();
    }

    default:
      return fail("Ação desconhecida.");
  }
}
