import type { Dungeon, DungeonRun, TournamentMonth, TournamentScore, ActivityType, DropItem, Giveaway, Member, Post, RankingRow, Season, ShopItem } from "@/lib/types";

// Dados de exemplo mostrados enquanto o Supabase não está configurado (modo demonstração).
const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export const DEMO_MEMBERS: Member[] = [
  ["Lorde Haunter", "lider", 312],
  ["Kuroshi", "vice", 298],
  ["Morte Rubra", "veterano", 276],
  ["Sombra de Gengar", "veterano", 251],
  ["Duskull Eterno", "membro", 233],
  ["Nyx Banette", "membro", 219],
  ["Velho Spiritomb", "membro", 205],
  ["Chandelure", "membro", 188],
  ["Lápide Fria", "recruta", 152],
  ["Misdreavus", "recruta", 140],
].map(([char_name, role, level], i) => ({
  id: `demo-m${i}`,
  discord_id: `${i}`,
  discord_name: String(char_name).toLowerCase().replace(/\s/g, ""),
  avatar_url: null,
  char_name: String(char_name),
  level: Number(level),
  role: role as Member["role"],
  status: "active",
  created_at: ago(120 - i * 9),
}));

export const DEMO_POSTS: Post[] = [
  {
    id: "demo-p1", kind: "aviso", pinned: true, published: true, image_url: null, event_at: null, created_at: ago(1),
    title: "Hunt obrigatória de sábado",
    body: "Todos os membros ativos na hunt de Ghost Tower no sábado às 21h. Levem revive e potions, a quest só abre com 8 na party.",
  },
  {
    id: "demo-p2", kind: "evento", pinned: false, published: true, image_url: null, event_at: ahead(4), created_at: ago(2),
    title: "Torneio PvP Necromancers",
    body: "Chaveamento 1x1, level livre. O campeão leva 50kk e a tag de Ceifador por um mês. Inscrição com o Kuroshi no Discord.",
  },
  {
    id: "demo-p3", kind: "novidade", pinned: false, published: true, image_url: null, event_at: null, created_at: ago(5),
    title: "Ranking de drops: Temporada 1 aberta",
    body: "Todo drop raro agora vale ponto. Mandem o print pelo site, a liderança aprova e o ranking atualiza na hora. Top 3 leva prêmio no fim do mês.",
  },
  {
    id: "demo-p4", kind: "novidade", pinned: false, published: true, image_url: null, event_at: null, created_at: ago(9),
    title: "Novas regras de recrutamento",
    body: "Recrutas passam 2 semanas em período de teste. Level mínimo 120 e presença em pelo menos duas hunts por semana.",
  },
];

export const DEMO_SEASON: Season = {
  id: "demo-s1", name: "Temporada 1 · Lua de Sangue", starts_at: ago(12), ends_at: ahead(18), status: "active", created_at: ago(12),
  prizes: ["1º lugar: 100kk + Shiny Gengar", "2º lugar: 50kk + Dusk Stone", "3º lugar: 25kk"],
};

export const DEMO_ITEMS: DropItem[] = [
  { id: "demo-i1", name: "Shiny Gengar", points: 500, rarity: "shiny", image_url: null, active: true },
  { id: "demo-i2", name: "Darkrai Essence", points: 300, rarity: "lendario", image_url: null, active: true },
  { id: "demo-i3", name: "Reaper Cloth", points: 120, rarity: "epico", image_url: null, active: true },
  { id: "demo-i4", name: "Dusk Stone", points: 60, rarity: "raro", image_url: null, active: true },
  { id: "demo-i5", name: "Ghost Essence", points: 10, rarity: "comum", image_url: null, active: true },
];

export const DEMO_RANKING: RankingRow[] = [
  [0, 1420, 9, 0], [2, 1180, 12, 1], [1, 960, 7, 1], [3, 720, 11, 2], [5, 540, 6, 2],
  [4, 410, 8, 3], [7, 300, 5, 3], [6, 180, 4, 3], [8, 90, 3, 4], [9, 40, 2, 4],
].map(([m, points, drops, item]) => ({
  member_id: DEMO_MEMBERS[m].id,
  char_name: DEMO_MEMBERS[m].char_name,
  avatar_url: null,
  points,
  drops,
  best: { item_name: DEMO_ITEMS[item].name, rarity: DEMO_ITEMS[item].rarity },
}));

export const DEMO_GIVEAWAYS: Giveaway[] = [
  {
    id: "demo-g1", title: "Sorteio da Lua Nova", prize: "Shiny Mismagius + 20kk", status: "open", ends_at: ahead(3), created_at: ago(2),
    description: "Todo membro ativo pode participar. Uma chance por pessoa, resultado comprovado pelo drand.",
    image_url: null, winner_member_id: null, winner_name: null, fair_draw_id: null, entries_count: 27,
  },
  {
    id: "demo-g2", title: "Sorteio de boas-vindas", prize: "Kit de 100 Ultra Balls", status: "drawn", ends_at: ago(6), created_at: ago(14),
    description: "Comemoração dos 30 membros do clã.",
    image_url: null, winner_member_id: DEMO_MEMBERS[6].id, winner_name: DEMO_MEMBERS[6].char_name, fair_draw_id: null, entries_count: 30,
  },
];

export const DEMO_ACTIVITIES: ActivityType[] = [
  { id: "demo-a1", name: "Torneio do clã", coins: 50, active: true },
  { id: "demo-a2", name: "Castle", coins: 30, active: true },
  { id: "demo-a3", name: "Hunt do clã", coins: 10, active: true },
];

export const DEMO_SHOP_ITEMS: ShopItem[] = [
  { id: "demo-s1", name: "Dusk Stone", description: "Entregue no depósito do clã.", image_url: null, price: 80, stock: 5, active: true },
  { id: "demo-s2", name: "Ultra Ball x100", description: "", image_url: null, price: 120, stock: null, active: true },
  { id: "demo-s3", name: "Shiny Gengar", description: "Prêmio máximo da temporada.", image_url: null, price: 1500, stock: 1, active: true },
];

export const DEMO_TOURNAMENT_MONTHS: TournamentMonth[] = [
  { id: "demo-t1", name: "Outubro 2026", created_at: ago(20) },
  { id: "demo-t0", name: "Setembro 2026", created_at: ago(50) },
];

// Presenças de exemplo: alguns membros em cada semana de outubro
export const DEMO_TOURNAMENT_SCORES: TournamentScore[] = [
  ["Lorde Haunter", 1, 3], ["Kuroshi", 1, 2], ["Morte Rubra", 1, 1],
  ["Kuroshi", 2, 4], ["Lorde Haunter", 2, 2], ["Nyx Banette", 2, 2], ["Chandelure", 2, 1],
  ["Morte Rubra", 3, 3], ["Kuroshi", 3, 1], ["Sombra de Gengar", 3, 2],
  ["Lorde Haunter", 4, 1],
].map(([player_name, week, count], i) => ({
  id: `demo-ts${i}`, month_id: "demo-t1", week: Number(week), player_name: String(player_name), count: Number(count), updated_at: ago(1),
}));

export const DEMO_DUNGEONS: Dungeon[] = [
  { id: "demo-d1", name: "Magma", active: true },
  { id: "demo-d2", name: "Caverna Sombria", active: true },
  { id: "demo-d3", name: "Torre Fantasma", active: true },
];

const player = (i: number) => ({ member_id: DEMO_MEMBERS[i].id, char_name: DEMO_MEMBERS[i].char_name, avatar_url: null });
export const DEMO_DUNGEON_RUNS: DungeonRun[] = [
  { id: "demo-r1", dungeon_id: "demo-d1", dungeon_name: "Magma", creator_id: DEMO_MEMBERS[1].id, slots: 4, starts_at: ahead(0.08), note: "Levem revive", status: "open", created_at: ago(0.1), players: [player(1), player(3)] },
  { id: "demo-r2", dungeon_id: "demo-d2", dungeon_name: "Caverna Sombria", creator_id: DEMO_MEMBERS[0].id, slots: 3, starts_at: ahead(0.4), note: null, status: "open", created_at: ago(0.2), players: [player(0), player(2), player(5)] },
  { id: "demo-r3", dungeon_id: "demo-d3", dungeon_name: "Torre Fantasma", creator_id: DEMO_MEMBERS[4].id, slots: 2, starts_at: ahead(1.2), note: "Só level 200+", status: "open", created_at: ago(0.3), players: [player(4)] },
];
