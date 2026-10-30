import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import { MEMBER_COLUMNS } from "@/lib/viewer";
import { DEMO_ACTIVITIES, DEMO_DUNGEONS, DEMO_DUNGEON_RUNS, DEMO_GAMES, DEMO_TOURNAMENT_MONTHS, DEMO_TOURNAMENT_SCORES, DEMO_GIVEAWAYS, DEMO_ITEMS, DEMO_MEMBERS, DEMO_POSTS, DEMO_RANKING, DEMO_SEASON, DEMO_SHOP_ITEMS } from "@/lib/demo";
import { MIN_WEEK_PRESENCES, monthFrequency, type FrequencyPrize } from "@/lib/tournament";
import type { ActivityType, CoinClaim, Drop, DropItem, Giveaway, Member, Post, RankingRow, Rarity, Season, ShopItem, ShopOrder, TournamentMonth, TournamentRow, TournamentScore, Dungeon, DungeonPlayer, DungeonRun, GameMode, GamePlayer, GameRoom } from "@/lib/types";

// Leituras usadas pelas páginas (sempre no servidor, pela service role).
// Sem Supabase configurado, devolvem os dados de exemplo de lib/demo.ts.

export const POST_COLUMNS = "id, kind, title, body, image_url, event_at, pinned, published, created_at, popup, popup_public";
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

/** Mural paginado no banco: só busca as linhas da página pedida. */
export async function getPostsPage(page: number, size: number): Promise<{ items: Post[]; total: number }> {
  if (isDemo()) return { items: DEMO_POSTS.slice((page - 1) * size, page * size), total: DEMO_POSTS.length };
  const from = (page - 1) * size;
  const { data, count } = await supabaseAdmin
    .from("posts")
    .select(POST_COLUMNS, { count: "exact" })
    .eq("published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + size - 1);
  return { items: (data as Post[]) ?? [], total: count ?? 0 };
}

/** Um aviso publicado, para a página do aviso completo. */
export async function getPost(id: string): Promise<Post | null> {
  if (isDemo()) return DEMO_POSTS.find((p) => p.id === id) ?? null;
  const { data } = await supabaseAdmin.from("posts").select(POST_COLUMNS).eq("id", id).eq("published", true).maybeSingle();
  return (data as Post | null) ?? null;
}

export async function getGiveaways(memberId?: string | null): Promise<Giveaway[]> {
  if (isDemo()) return DEMO_GIVEAWAYS;
  const { data } = await supabaseAdmin.from("giveaways").select(GIVEAWAY_COLUMNS).order("created_at", { ascending: false }).limit(30);
  return withEntries((data as Giveaway[]) ?? [], memberId);
}

/** Sorteios paginados no banco: "ativos" (abertos ou esperando sorteio) ou "sorteados". */
export async function getGiveawaysPage(kind: "active" | "drawn", page: number, size: number, memberId?: string | null): Promise<{ items: Giveaway[]; total: number }> {
  if (isDemo()) {
    const all = DEMO_GIVEAWAYS.filter((g) => (kind === "drawn" ? g.status === "drawn" : g.status !== "drawn"));
    return { items: all.slice((page - 1) * size, page * size), total: all.length };
  }
  const from = (page - 1) * size;
  let q = supabaseAdmin.from("giveaways").select(GIVEAWAY_COLUMNS, { count: "exact" }).order("created_at", { ascending: false });
  q = kind === "drawn" ? q.eq("status", "drawn") : q.neq("status", "drawn");
  const { data, count } = await q.range(from, from + size - 1);
  return { items: await withEntries((data as Giveaway[]) ?? [], memberId), total: count ?? 0 };
}

/** Junta a contagem de inscritos e se o membro está participando. */
async function withEntries(list: Giveaway[], memberId?: string | null): Promise<Giveaway[]> {
  if (list.length === 0) return list;
  const { data: entries } = await supabaseAdmin
    .from("giveaway_entries")
    .select("giveaway_id, member_id, status")
    .in("giveaway_id", list.map((g) => g.id));
  const counts = new Map<string, number>();
  const joined = new Set<string>();
  const rejected = new Set<string>();
  for (const e of entries ?? []) {
    if (e.status === "rejected") {
      if (memberId && e.member_id === memberId) rejected.add(e.giveaway_id);
      continue; // removido pela liderança: não conta
    }
    counts.set(e.giveaway_id, (counts.get(e.giveaway_id) ?? 0) + 1);
    if (memberId && e.member_id === memberId) joined.add(e.giveaway_id);
  }
  const drawnAt = await getDrawnAt(list);
  return list.map((g) => ({ ...g, entries_count: counts.get(g.id) ?? 0, joined: joined.has(g.id), rejected: rejected.has(g.id), drawn_at: g.fair_draw_id ? drawnAt.get(g.fair_draw_id) ?? null : null }));
}

/** Dia e hora em que cada sorteio teve ganhador (o giro do Provably Fair guarda isso). */
export async function getDrawnAt(list: Giveaway[]): Promise<Map<string, string>> {
  const ids = list.map((g) => g.fair_draw_id).filter((id): id is string => !!id);
  if (!ids.length) return new Map();
  const { data } = await supabaseAdmin.from("fair_draws").select("id, drawn_at, created_at").in("id", ids);
  return new Map((data ?? []).map((d) => [d.id, d.drawn_at ?? d.created_at]));
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

/** Drops do membro só na temporada atual: quando a temporada acaba, somem do perfil (o ranking antigo continua). */
export async function getMyDrops(memberId: string, seasonId: string | null | undefined): Promise<Drop[]> {
  if (isDemo() || !seasonId) return [];
  const { data } = await supabaseAdmin
    .from("drops")
    .select(DROP_COLUMNS)
    .eq("member_id", memberId)
    .eq("season_id", seasonId)
    .order("created_at", { ascending: false })
    .limit(500);
  return (data as Drop[]) ?? [];
}

export async function getStats() {
  if (isDemo()) return { members: DEMO_MEMBERS.length, drops: 67, openGiveaways: 1 };
  const [m, d, g] = await Promise.all([
    supabaseAdmin.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("drops").select("id", { count: "exact", head: true }).eq("status", "approved"),
    // Aberto de verdade: status aberto e sem prazo vencido
    supabaseAdmin.from("giveaways").select("id", { count: "exact", head: true }).eq("status", "open").or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`),
  ]);
  return { members: m.count ?? 0, drops: d.count ?? 0, openGiveaways: g.count ?? 0 };
}

// ---------- Lojinha ----------
export const ACTIVITY_COLUMNS = "id, name, coins, active";
export const CLAIM_COLUMNS = "id, member_id, activity_id, activity_name, coins, happened_at, proof_path, note, epoch, status, created_at, reviewed_at";
export const SHOP_ITEM_COLUMNS = "id, name, description, image_url, price, stock, active";
export const ORDER_COLUMNS = "id, member_id, item_id, item_name, price, epoch, status, created_at, delivered_at";

/** Ciclo atual das moedas (sobe 1 cada vez que a liderança zera). */
export async function getCoinEpoch(): Promise<number> {
  const { data } = await supabaseAdmin.rpc("coin_epoch");
  return Number(data ?? 0);
}

/** Tudo que a página da lojinha precisa para um membro: saldo, atividades, itens e o que ele já pediu no ciclo atual. */
export async function getShop(memberId: string | null) {
  if (isDemo()) {
    return {
      balance: 140, activities: DEMO_ACTIVITIES, items: DEMO_SHOP_ITEMS, claims: [] as CoinClaim[], orders: [] as ShopOrder[],
    };
  }
  const epoch = await getCoinEpoch();
  const [activities, items, balance, claims, orders] = await Promise.all([
    supabaseAdmin.from("activity_types").select(ACTIVITY_COLUMNS).eq("active", true).order("coins", { ascending: false }),
    supabaseAdmin.from("shop_items").select(SHOP_ITEM_COLUMNS).eq("active", true).order("price"),
    memberId ? supabaseAdmin.rpc("coin_balance", { p_member: memberId }) : Promise.resolve({ data: 0 }),
    memberId
      ? supabaseAdmin.from("coin_claims").select(CLAIM_COLUMNS).eq("member_id", memberId).eq("epoch", epoch).order("created_at", { ascending: false }).limit(300)
      : Promise.resolve({ data: [] }),
    memberId
      ? supabaseAdmin.from("shop_orders").select(ORDER_COLUMNS).eq("member_id", memberId).eq("epoch", epoch).order("created_at", { ascending: false }).limit(300)
      : Promise.resolve({ data: [] }),
  ]);
  return {
    balance: Number(balance.data ?? 0),
    activities: (activities.data as ActivityType[]) ?? [],
    items: (items.data as ShopItem[]) ?? [],
    claims: (claims.data as CoinClaim[]) ?? [],
    orders: (orders.data as ShopOrder[]) ?? [],
  };
}

// ---------- Torneios ----------
export const TOURNAMENT_SCORE_COLUMNS = "id, month_id, week, player_name, count, updated_at";

export async function getTournamentMonths(): Promise<TournamentMonth[]> {
  if (isDemo()) return DEMO_TOURNAMENT_MONTHS;
  const { data } = await supabaseAdmin.from("tournament_months").select("id, name, created_at").order("created_at", { ascending: false });
  return (data as TournamentMonth[]) ?? [];
}

/** Prêmio de frequência de cada semana de um mês. A corrente vem desde o primeiro mês, porque quem ganhou uma semana passa a seguinte. */
export async function getTournamentFrequency(monthId: string) {
  const months = [...await getTournamentMonths()].reverse();
  let scores: TournamentScore[];
  if (isDemo()) scores = DEMO_TOURNAMENT_SCORES;
  else {
    // Só quem bateu o mínimo disputa, então os mais recentes bastam para a corrente
    const { data } = await supabaseAdmin.from("tournament_scores").select(TOURNAMENT_SCORE_COLUMNS).gte("count", MIN_WEEK_PRESENCES).order("updated_at", { ascending: false }).limit(1000);
    scores = (data as TournamentScore[]) ?? [];
  }
  let prior: string | null = null;
  for (const m of months) {
    const result = monthFrequency(scores.filter((s) => s.month_id === m.id), prior);
    if (m.id === monthId) return { prizes: result.prizes, prior };
    prior = result.last;
  }
  return { prizes: {} as Record<number, FrequencyPrize | null>, prior: null };
}

/** Ranking de um mês: de uma semana (1 a 4) ou do mês todo (soma das semanas). Nomes iguais a um membro ganham a foto dele. */
export async function getTournamentRanking(monthId: string, week: number | null): Promise<TournamentRow[]> {
  let scores: TournamentScore[];
  if (isDemo()) {
    scores = DEMO_TOURNAMENT_SCORES.filter((s) => s.month_id === monthId);
  } else {
    let q = supabaseAdmin.from("tournament_scores").select(TOURNAMENT_SCORE_COLUMNS).eq("month_id", monthId).gt("count", 0);
    if (week) q = q.eq("week", week);
    scores = ((await q).data as TournamentScore[]) ?? [];
  }
  if (week) scores = scores.filter((s) => s.week === week);
  const totals = new Map<string, { player_name: string; count: number }>();
  for (const s of scores) {
    const key = s.player_name.trim().toLowerCase();
    const row = totals.get(key) ?? { player_name: s.player_name.trim(), count: 0 };
    row.count += s.count;
    totals.set(key, row);
  }
  const members = await getMembers();
  const photo = new Map(members.map((m) => [m.char_name.trim().toLowerCase(), m.avatar_url]));
  return [...totals.entries()]
    .map(([key, r]) => ({ ...r, avatar_url: photo.get(key) ?? null }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count || a.player_name.localeCompare(b.player_name));
}

// ---------- Dungeons ----------
export const DUNGEON_RUN_COLUMNS = "id, dungeon_id, dungeon_name, creator_id, slots, starts_at, note, status, created_at";
/** Grupos continuam na lista até 2 horas depois do horário marcado. */
export const DUNGEON_GRACE_MS = 2 * 3600_000;

export async function getDungeons(activeOnly = true): Promise<Dungeon[]> {
  if (isDemo()) return DEMO_DUNGEONS;
  let q = supabaseAdmin.from("dungeons").select("id, name, image_url, active").order("name");
  if (activeOnly) q = q.eq("active", true);
  return ((await q).data as Dungeon[]) ?? [];
}

/** Próximos grupos (em ordem de horário), paginados no banco, com quem já está em cada um. */
export async function getDungeonRuns(page: number, size: number): Promise<{ items: DungeonRun[]; total: number }> {
  if (isDemo()) return { items: DEMO_DUNGEON_RUNS.slice((page - 1) * size, page * size), total: DEMO_DUNGEON_RUNS.length };
  const from = (page - 1) * size;
  const { data, count } = await supabaseAdmin
    .from("dungeon_runs")
    .select(DUNGEON_RUN_COLUMNS, { count: "exact" })
    .eq("status", "open")
    .gte("starts_at", new Date(Date.now() - DUNGEON_GRACE_MS).toISOString())
    .order("starts_at")
    .range(from, from + size - 1);
  const runs = (data as Omit<DungeonRun, "players">[]) ?? [];
  if (!runs.length) return { items: [], total: count ?? 0 };
  const { data: parts } = await supabaseAdmin
    .from("dungeon_participants")
    .select("run_id, member_id, joined_at, members(char_name, avatar_url)")
    .in("run_id", runs.map((r) => r.id))
    .order("joined_at");
  const byRun = new Map<string, DungeonPlayer[]>();
  for (const p of (parts ?? []) as unknown as { run_id: string; member_id: string; members: { char_name: string; avatar_url: string | null } | null }[]) {
    const list = byRun.get(p.run_id) ?? [];
    list.push({ member_id: p.member_id, char_name: p.members?.char_name ?? "?", avatar_url: p.members?.avatar_url ?? null });
    byRun.set(p.run_id, list);
  }
  // Quem criou sempre aparece primeiro
  const items = runs.map((r) => {
    const players = byRun.get(r.id) ?? [];
    players.sort((a, b) => (a.member_id === r.creator_id ? -1 : b.member_id === r.creator_id ? 1 : 0));
    return { ...r, players };
  });
  return { items, total: count ?? 0 };
}

/** Sorteios confirmados de um mês de torneios (mais recentes primeiro). */
export async function getTournamentDraws(monthId: string): Promise<{ id: string; title: string; winner_label: string | null; drawn_at: string | null }[]> {
  if (isDemo()) return [];
  const { data } = await supabaseAdmin
    .from("fair_draws")
    .select("id, title, winner_label, drawn_at")
    .eq("kind", "torneio")
    .eq("target_id", monthId)
    .eq("status", "confirmed")
    .order("drawn_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

/** Aviso marcado como popup de destaque (só um por vez). Visitante só vê se o aviso liberar. */
export async function getPopupPost(canSeeContent: boolean): Promise<Post | null> {
  if (isDemo()) return null;
  const { data } = await supabaseAdmin.from("posts").select(POST_COLUMNS).eq("popup", true).eq("published", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const post = (data as Post | null) ?? null;
  if (!post || (!canSeeContent && !post.popup_public)) return null;
  return post;
}

// ---------- Meu inventário ----------
export interface InventoryGiveaway {
  id: string;
  title: string;
  prize: string;
  status: Giveaway["status"];
  ends_at: string | null;
  won: boolean;
  rejected: boolean;
}
export interface InventoryRun { id: string; dungeon_name: string; starts_at: string; slots: number; filled: number; mine: boolean }
export interface Inventory {
  season: { name: string } | null;
  drops: Drop[];
  rank: { position: number; total: number; points: number; drops: number } | null;
  coins: { balance: number; pending: number; toReceive: ShopOrder[] };
  tournament: { month: string; total: number; weeks: number[]; position: number | null; players: number } | null;
  giveaways: InventoryGiveaway[];
  runs: InventoryRun[];
}

/** Tudo do membro dentro do site: drops, moedas, torneios, sorteios e dungeons. */
export async function getInventory(memberId: string, charName: string): Promise<Inventory> {
  const seasons = await getSeasons();
  const season = seasons.find((s) => s.status === "active") ?? null;
  const months = await getTournamentMonths();
  const month = months[0] ?? null;
  const me = charName.trim().toLowerCase();

  const [drops, ranking, shop, monthRanking, monthScores, giveaways, runs] = await Promise.all([
    season ? getMyDrops(memberId, season.id) : Promise.resolve([] as Drop[]),
    season ? getRanking(season.id) : Promise.resolve([] as RankingRow[]),
    getShop(memberId),
    month ? getTournamentRanking(month.id, null) : Promise.resolve([] as TournamentRow[]),
    month
      ? isDemo()
        ? Promise.resolve(DEMO_TOURNAMENT_SCORES.filter((s) => s.month_id === month.id))
        : supabaseAdmin.from("tournament_scores").select(TOURNAMENT_SCORE_COLUMNS).eq("month_id", month.id).then((r) => (r.data as TournamentScore[]) ?? [])
      : Promise.resolve([] as TournamentScore[]),
    getMyGiveaways(memberId),
    getMyRuns(memberId),
  ]);

  const pos = ranking.findIndex((r) => r.member_id === memberId);
  const tPos = monthRanking.findIndex((r) => r.player_name.trim().toLowerCase() === me);
  const weeks = [1, 2, 3, 4].map((w) => monthScores.filter((s) => s.week === w && s.player_name.trim().toLowerCase() === me).reduce((n, s) => n + s.count, 0));

  return {
    season: season ? { name: season.name } : null,
    drops,
    rank: pos >= 0 ? { position: pos + 1, total: ranking.length, points: ranking[pos].points, drops: ranking[pos].drops } : null,
    coins: {
      balance: shop.balance,
      pending: shop.claims.filter((c) => c.status === "pending").reduce((n, c) => n + c.coins, 0),
      toReceive: shop.orders.filter((o) => o.status === "pending"),
    },
    tournament: month ? { month: month.name, total: weeks.reduce((a, b) => a + b, 0), weeks, position: tPos >= 0 ? tPos + 1 : null, players: monthRanking.length } : null,
    giveaways,
    runs,
  };
}

// Sorteios em que o membro entrou (abertos primeiro) e os que ele ganhou
async function getMyGiveaways(memberId: string): Promise<InventoryGiveaway[]> {
  if (isDemo()) {
    return DEMO_GIVEAWAYS.slice(0, 3).map((g, i) => ({ id: g.id, title: g.title, prize: g.prize, status: g.status, ends_at: g.ends_at, won: i === 2 && g.status === "drawn", rejected: false }));
  }
  const { data } = await supabaseAdmin
    .from("giveaway_entries")
    .select("status, created_at, giveaways!inner(id, title, prize, status, ends_at, winner_member_id)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(500);
  const order = { open: 0, closed: 1, drawn: 2 } as const;
  return ((data ?? []) as unknown as { status: string; giveaways: Giveaway }[])
    .map(({ status, giveaways: g }) => ({ id: g.id, title: g.title, prize: g.prize, status: g.status, ends_at: g.ends_at, won: g.winner_member_id === memberId, rejected: status === "rejected" }))
    .sort((a, b) => order[a.status] - order[b.status]);
}

// Próximos grupos de dungeon em que o membro está
async function getMyRuns(memberId: string): Promise<InventoryRun[]> {
  if (isDemo()) {
    return DEMO_DUNGEON_RUNS.slice(0, 2).map((r, i) => ({ id: r.id, dungeon_name: r.dungeon_name, starts_at: r.starts_at, slots: r.slots, filled: r.players.length, mine: i === 0 }));
  }
  const { data } = await supabaseAdmin
    .from("dungeon_participants")
    .select("dungeon_runs!inner(id, dungeon_name, starts_at, slots, status, creator_id, dungeon_participants(member_id))")
    .eq("member_id", memberId)
    .eq("dungeon_runs.status", "open")
    .gte("dungeon_runs.starts_at", new Date(Date.now() - DUNGEON_GRACE_MS).toISOString());
  return ((data ?? []) as unknown as { dungeon_runs: { id: string; dungeon_name: string; starts_at: string; slots: number; creator_id: string; dungeon_participants: unknown[] } }[])
    .map(({ dungeon_runs: r }) => ({ id: r.id, dungeon_name: r.dungeon_name, starts_at: r.starts_at, slots: r.slots, filled: r.dungeon_participants.length, mine: r.creator_id === memberId }))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

// ---------- Games ----------
/** A entrada numa sala vale 1 hora; depois a vaga libera sozinha. */
export const GAME_SEAT_MS = 3600_000;

/** Modos de jogo com as salas e quem está em cada uma agora. activeOnly: só o que aparece no site. */
export async function getGames(activeOnly = true): Promise<GameMode[]> {
  if (isDemo()) return DEMO_GAMES;
  let modesQ = supabaseAdmin.from("game_modes").select("id, name, icon, image_url, sort, active").order("sort").order("name");
  let roomsQ = supabaseAdmin.from("game_rooms").select("id, mode_id, name, image_url, slots, sort, active").order("sort").order("name");
  if (activeOnly) { modesQ = modesQ.eq("active", true); roomsQ = roomsQ.eq("active", true); }
  const since = new Date(Date.now() - GAME_SEAT_MS).toISOString();
  const [modes, rooms, players, bench] = await Promise.all([
    modesQ,
    roomsQ,
    supabaseAdmin
      .from("game_room_players")
      .select("room_id, member_id, joined_at, members(char_name, avatar_url)")
      .gte("joined_at", since)
      .order("joined_at"),
    supabaseAdmin
      .from("game_bench")
      .select("mode_id, member_id, joined_at, members(char_name, avatar_url)")
      .gte("joined_at", since)
      .order("joined_at"),
  ]);
  const benchByMode = new Map<string, GamePlayer[]>();
  for (const b of (bench.data ?? []) as unknown as { mode_id: string; member_id: string; members: { char_name: string; avatar_url: string | null } | null }[]) {
    const list = benchByMode.get(b.mode_id) ?? [];
    list.push({ member_id: b.member_id, char_name: b.members?.char_name ?? "?", avatar_url: b.members?.avatar_url ?? null });
    benchByMode.set(b.mode_id, list);
  }
  const byRoom = new Map<string, GamePlayer[]>();
  for (const p of (players.data ?? []) as unknown as { room_id: string; member_id: string; members: { char_name: string; avatar_url: string | null } | null }[]) {
    const list = byRoom.get(p.room_id) ?? [];
    list.push({ member_id: p.member_id, char_name: p.members?.char_name ?? "?", avatar_url: p.members?.avatar_url ?? null });
    byRoom.set(p.room_id, list);
  }
  const roomsByMode = new Map<string, GameRoom[]>();
  for (const r of (rooms.data ?? []) as Omit<GameRoom, "players">[]) {
    const list = roomsByMode.get(r.mode_id) ?? [];
    list.push({ ...r, players: byRoom.get(r.id) ?? [] });
    roomsByMode.set(r.mode_id, list);
  }
  return ((modes.data ?? []) as Omit<GameMode, "rooms">[]).map((m) => ({ ...m, rooms: roomsByMode.get(m.id) ?? [], bench: benchByMode.get(m.id) ?? [] }));
}
