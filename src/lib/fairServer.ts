import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  drandRoundTime, entriesText, fetchDrandLatestRound, fetchDrandRound, pickWinner, sha256Hex,
  type FairDraw, type FairEntry, type FairKind,
} from "@/lib/fair";
import { inTournamentDraw } from "@/lib/tournament";

export const FAIR_COLUMNS =
  "id, kind, target_id, title, entries, total_weight, entries_hash, drand_round, drand_randomness, drand_signature, ticket, winner_label, winner_username, status, created_at, drawn_at";

type Pool = { title: string; entries: FairEntry[]; owners: Map<string, string> };

// Torneio: só quem tem 30% de presença na semana entra, com 1 chance cada. Nomes iguais a membros guardam o id.
async function buildTournamentPool(monthId: string, week: number | null): Promise<Pool | null> {
  const db = supabaseAdmin;
  const { data: month } = await db.from("tournament_months").select("name").eq("id", monthId).maybeSingle();
  if (!month) return null;
  let q = db.from("tournament_scores").select("player_name, count").eq("month_id", monthId).gt("count", 0);
  if (week) q = q.eq("week", week);
  const [{ data: scores }, { data: members }] = await Promise.all([
    q,
    db.from("members").select("id, char_name").eq("status", "active"),
  ]);
  const totals = new Map<string, { label: string; weight: number }>();
  for (const s of scores ?? []) {
    const key = s.player_name.trim().toLowerCase();
    const row = totals.get(key) ?? { label: s.player_name.trim(), weight: 0 };
    row.weight += s.count;
    totals.set(key, row);
  }
  const ids = new Map((members ?? []).map((m) => [m.char_name.trim().toLowerCase(), m.id]));
  const entries = [...totals.values()].filter((e) => inTournamentDraw(e.weight)).map((e) => ({ ...e, weight: 1 })).sort((a, b) => (a.label.toLowerCase() < b.label.toLowerCase() ? -1 : a.label.toLowerCase() > b.label.toLowerCase() ? 1 : 0));
  const owners = new Map(entries.flatMap((e) => { const id = ids.get(e.label.toLowerCase()); return id ? [[e.label, id] as [string, string]] : []; }));
  return { title: `Torneio · ${month.name} · ${week ? `Semana ${week}` : "Mês todo"}`, entries, owners };
}

// A lista sai sempre do banco (nunca do navegador): membros ativos inscritos, 1 chance cada.
async function buildPool(targetId: string): Promise<Pool | null> {
  const db = supabaseAdmin;
  const { data: g } = await db.from("giveaways").select("title").eq("id", targetId).maybeSingle();
  if (!g) return null;
  const { data: rows } = await db
    .from("giveaway_entries")
    .select("member_id, members!inner(char_name, status)")
    .eq("giveaway_id", targetId)
    .eq("status", "ok") // quem a liderança rejeitou fica fora
    .eq("members.status", "active");

  const owners = new Map<string, string>();
  for (const r of (rows ?? []) as unknown as { member_id: string; members: { char_name: string } }[]) {
    owners.set(r.members.char_name, r.member_id);
  }
  const entries = [...owners.keys()]
    .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0))
    .map((label) => ({ label, weight: 1 }));
  return { title: g.title, entries, owners };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

/**
 * Congela a lista, grava (com a rodada futura do drand) e, quando a rodada sai,
 * calcula e grava o ganhador. Leva de 3 a 7 segundos.
 */
export async function runFairDraw(kind: FairKind, targetId: string, week: number | null = null): Promise<{ draw?: FairDraw; error?: string; status?: number }> {
  const db = supabaseAdmin;
  const pool = kind === "torneio" ? await buildTournamentPool(targetId, week) : await buildPool(targetId);
  if (!pool) return { error: "Sorteio não encontrado.", status: 404 };
  if (pool.entries.length === 0) return { error: kind === "torneio" ? "Ninguém chegou a 30% de presença nessa semana." : "Ninguém se inscreveu neste sorteio ainda.", status: 400 };

  const entriesHash = await sha256Hex(entriesText(pool.entries));
  // Duas rodadas à frente da última publicada: o número ainda não existe quando a lista é gravada.
  // A rodada atual vem do drand (o relógio do servidor pode estar alguns segundos errado).
  let latest: number;
  try {
    latest = await fetchDrandLatestRound();
  } catch {
    return { error: "O número público (drand) não respondeu. Tente sortear de novo.", status: 503 };
  }
  const round = latest + 2;

  const { data: created, error } = await db
    .from("fair_draws")
    .insert({
      kind,
      target_id: targetId,
      title: pool.title,
      entries: pool.entries,
      total_weight: pool.entries.reduce((s, e) => s + e.weight, 0),
      entries_hash: entriesHash,
      drand_round: round,
    })
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Erro ao sortear.", status: 500 };

  // Espera a rodada sair (~3 a 6s) e tenta buscar por até ~12s
  await wait(Math.min(6500, drandRoundTime(round) - Date.now() + 400));
  let beacon: { randomness: string; signature: string } | null = null;
  for (let attempt = 0; attempt < 12 && !beacon; attempt++) {
    try {
      beacon = await fetchDrandRound(round);
    } catch {
      await wait(1000);
    }
  }
  if (!beacon) return { error: "O número público (drand) não respondeu. Tente sortear de novo.", status: 503 };

  const { ticket, index } = await pickWinner(pool.entries, entriesHash, beacon.randomness);
  const label = pool.entries[index].label;
  const { data: draw, error: updateError } = await db
    .from("fair_draws")
    .update({
      drand_randomness: beacon.randomness,
      drand_signature: beacon.signature,
      ticket: ticket.toString(),
      winner_label: label,
      winner_username: pool.owners.get(label) ?? null, // id do membro
      status: "drawn",
      drawn_at: new Date().toISOString(),
    })
    .eq("id", created.id)
    .select(FAIR_COLUMNS)
    .single();
  if (updateError || !draw) return { error: updateError?.message ?? "Erro ao sortear.", status: 500 };
  return { draw: draw as FairDraw };
}

/** Marca o giro como confirmado (ganhador salvo) ou descartado (cancelado, sortear de novo). */
export async function setFairStatus(id: string | undefined | null, status: "confirmed" | "skipped") {
  if (!id) return;
  // Só um giro "sorteado" muda de estado: confirmado nunca vira descartado, nem o contrário
  await supabaseAdmin.from("fair_draws").update({ status }).eq("id", id).eq("status", "drawn");
}
