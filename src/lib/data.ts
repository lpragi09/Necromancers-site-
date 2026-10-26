import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { MEMBER_COLUMNS } from "@/lib/viewer";
import { DEMO_GIVEAWAYS, DEMO_ITEMS, DEMO_MEMBERS, DEMO_POSTS, DEMO_RANKING, DEMO_SEASON } from "@/lib/demo";
import type { Drop, DropItem, Giveaway, Member, Post, RankingRow, Rarity, Season } from "@/lib/types";

// Leituras usadas pelas páginas (sempre no servidor, pela service role).
// Sem Supabase configurado, devolvem os dados de exemplo de lib/demo.ts.

export const POST_COLUMNS = "id, kind, title, body, image_url, event_at, pinned, published, created_at";
export const GIVEAWAY_COLUMNS = "id, title, description, prize, image_url, status, ends_at, winner_member_id, winner_name, fair_draw_id, created_at";
export const SEASON_COLUMNS = "id, name, starts_at, ends_at, prizes, status, created_at";
export const ITEM_COLUMNS = "id, name, points, rarity, image_url, active";
export const DROP_COLUMNS = "id, season_id, member_id, item_id, item_name, rarity, points, quantity, proof_path, note, status, created_at, reviewed_at";

export const isDemo = () => !hasSupabase();

export async function getPosts(limit = 50): Promise<Post[]> {
  if (isDemo()) return DEMO_POSTS.slice(0, limit);
  const { data } = await supabaseAdmin
    .from("posts")
    .select(POST_COLUMNS)
    .eq("published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Post[]) ?? [];
}

export async function getGiveaways(memberId?: string | null): Promise<Giveaway[]> {
  if (isDemo()) return DEMO_GIVEAWAYS;
  const { data } = await supabaseAdmin.from("giveaways").select(GIVEAWAY_COLUMNS).order("created_at", { ascending: false }).limit(30);
  const list = (data as Giveaway[]) ?? [];
  if (list.length === 0) return list;
  const { data: entries } = await supabaseAdmin
    .from("giveaway_entries")
    .select("giveaway_id, member_id")
    .in("giveaway_id", list.map((g) => g.id));
  const counts = new Map<string, number>();
  const joined = new Set<string>();
  for (const e of entries ?? []) {
    counts.set(e.giveaway_id, (counts.get(e.giveaway_id) ?? 0) + 1);
    if (memberId && e.member_id === memberId) joined.add(e.giveaway_id);
  }
  return list.map((g) => ({ ...g, entries_count: counts.get(g.id) ?? 0, joined: joined.has(g.id) }));
}

export async function getSeasons(): Promise<Season[]> {
  if (isDemo()) return [DEMO_SEASON];
  const { data } = await supabaseAdmin.from("seasons").select(SEASON_COLUMNS).order("starts_at", { ascending: false });
  return (data as Season[]) ?? [];
}

/** Temporada pedida, ou a ativa mais recente, ou a última. */
export function pickSeason(seasons: Season[], id?: string | null) {
  return seasons.find((s) => s.id === id) ?? seasons.find((s) => s.status === "active") ?? seasons[0] ?? null;
}

const RARITY_RANK: Record<Rarity, number> = { comum: 0, raro: 1, epico: 2, lendario: 3, shiny: 4 };

export async function getRanking(seasonId: string | null | undefined): Promise<RankingRow[]> {
  if (isDemo()) return DEMO_RANKING;
  if (!seasonId) return [];
  const { data } = await supabaseAdmin
    .from("drops")
    .select("member_id, item_name, rarity, points, quantity, members!inner(char_name, avatar_url)")
    .eq("season_id", seasonId)
    .eq("status", "approved");

  const rows = new Map<string, RankingRow>();
  for (const d of (data ?? []) as unknown as (Drop & { members: { char_name: string; avatar_url: string | null } })[]) {
    const row = rows.get(d.member_id) ?? {
      member_id: d.member_id, char_name: d.members.char_name, avatar_url: d.members.avatar_url, points: 0, drops: 0, best: null,
    };
    row.points += d.points * d.quantity;
    row.drops += d.quantity;
    if (!row.best || RARITY_RANK[d.rarity] > RARITY_RANK[row.best.rarity]) row.best = { item_name: d.item_name, rarity: d.rarity };
    rows.set(d.member_id, row);
  }
  return [...rows.values()].sort((a, b) => b.points - a.points || b.drops - a.drops || a.char_name.localeCompare(b.char_name));
}

export async function getMembers(): Promise<Member[]> {
  if (isDemo()) return DEMO_MEMBERS;
  const { data } = await supabaseAdmin.from("members").select(MEMBER_COLUMNS).eq("status", "active").order("char_name");
  return (data as Member[]) ?? [];
}

export async function getItems(activeOnly = true): Promise<DropItem[]> {
  if (isDemo()) return DEMO_ITEMS;
  let q = supabaseAdmin.from("drop_items").select(ITEM_COLUMNS).order("points", { ascending: false });
  if (activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return (data as DropItem[]) ?? [];
}

export async function getMyDrops(memberId: string): Promise<Drop[]> {
  if (isDemo()) return [];
  const { data } = await supabaseAdmin.from("drops").select(DROP_COLUMNS).eq("member_id", memberId).order("created_at", { ascending: false }).limit(50);
  return (data as Drop[]) ?? [];
}

export async function getStats() {
  if (isDemo()) return { members: DEMO_MEMBERS.length, drops: 67, openGiveaways: 1 };
  const [m, d, g] = await Promise.all([
    supabaseAdmin.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("drops").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabaseAdmin.from("giveaways").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  return { members: m.count ?? 0, drops: d.count ?? 0, openGiveaways: g.count ?? 0 };
}
