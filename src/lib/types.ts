export type MemberRole = "lider" | "vice" | "veterano" | "membro" | "recruta";
export type MemberStatus = "pending" | "active" | "inactive";

export interface Member {
  id: string;
  discord_id: string;
  discord_name: string;
  avatar_url: string | null;
  char_name: string;
  level: number | null;
  role: MemberRole;
  status: MemberStatus;
  created_at: string;
}

export type PostKind = "aviso" | "novidade" | "evento";

export interface Post {
  id: string;
  kind: PostKind;
  title: string;
  body: string;
  image_url: string | null;
  event_at: string | null;
  pinned: boolean;
  published: boolean;
  created_at: string;
  popup?: boolean; // aparece em popup ao entrar no site
  popup_public?: boolean; // visitantes também veem o popup
}

export type GiveawayStatus = "open" | "closed" | "drawn";

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  prize: string;
  image_url: string | null;
  status: GiveawayStatus;
  ends_at: string | null;
  winner_member_id: string | null;
  winner_name: string | null;
  fair_draw_id: string | null;
  created_at: string;
  entries_count?: number;
  joined?: boolean;
  rejected?: boolean; // a liderança tirou este membro do sorteio
  drawn_at?: string | null; // quando saiu o ganhador (vem do giro do Provably Fair)
}

export interface Season {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string | null;
  prizes: string[];
  status: "active" | "closed";
  created_at: string;
}

export type Rarity = "comum" | "raro" | "epico" | "lendario" | "shiny";

export interface DropItem {
  id: string;
  name: string;
  points: number;
  rarity: Rarity;
  image_url: string | null;
  active: boolean;
}

export type DropStatus = "pending" | "approved" | "rejected";

export interface Drop {
  id: string;
  season_id: string;
  member_id: string;
  item_id: string | null;
  item_name: string;
  rarity: Rarity;
  points: number;
  quantity: number;
  proof_path: string | null;
  note: string | null;
  status: DropStatus;
  created_at: string;
  reviewed_at: string | null;
}

export interface RankingRow {
  member_id: string;
  char_name: string;
  avatar_url: string | null;
  points: number;
  drops: number;
  best: { item_name: string; rarity: Rarity } | null;
}

export const ROLE_LABEL: Record<MemberRole, string> = {
  lider: "Líder",
  vice: "Vice-líder",
  veterano: "Veterano",
  membro: "Membro",
  recruta: "Recruta",
};

export const ROLE_ORDER: MemberRole[] = ["lider", "vice", "veterano", "membro", "recruta"];

export const POST_KIND_LABEL: Record<PostKind, string> = { aviso: "Aviso", novidade: "Novidade", evento: "Evento" };

export const RARITY: Record<Rarity, { label: string; text: string; border: string; bg: string; glow: string }> = {
  comum: { label: "Comum", text: "text-zinc-300", border: "border-zinc-500/40", bg: "bg-zinc-500/10", glow: "" },
  raro: { label: "Raro", text: "text-sky-300", border: "border-sky-400/40", bg: "bg-sky-400/10", glow: "shadow-[0_0_18px_rgba(56,189,248,0.25)]" },
  epico: { label: "Épico", text: "text-violet-300", border: "border-violet-400/50", bg: "bg-violet-500/10", glow: "shadow-[0_0_18px_rgba(167,139,250,0.35)]" },
  lendario: { label: "Lendário", text: "text-amber-300", border: "border-amber-400/50", bg: "bg-amber-400/10", glow: "shadow-[0_0_22px_rgba(251,191,36,0.35)]" },
  shiny: { label: "Shiny", text: "text-pink-300", border: "border-pink-400/60", bg: "bg-pink-500/10", glow: "shadow-[0_0_24px_rgba(236,72,153,0.45)]" },
};

// ---------- Lojinha ----------
export interface ActivityType {
  id: string;
  name: string;
  coins: number;
  active: boolean;
}

export type ClaimStatus = "pending" | "approved" | "rejected" | "expired";

export interface CoinClaim {
  id: string;
  member_id: string;
  activity_id: string | null;
  activity_name: string;
  coins: number;
  happened_at: string;
  proof_path: string | null;
  note: string | null;
  epoch: number;
  status: ClaimStatus;
  created_at: string;
  reviewed_at: string | null;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  price: number;
  stock: number | null; // null = ilimitado
  active: boolean;
}

export type OrderStatus = "pending" | "delivered" | "cancelled";

export interface ShopOrder {
  id: string;
  member_id: string;
  item_id: string | null;
  item_name: string;
  price: number;
  epoch: number;
  status: OrderStatus;
  created_at: string;
  delivered_at: string | null;
}

// ---------- Torneios ----------
export interface TournamentMonth {
  id: string;
  name: string;
  created_at: string;
}

export interface TournamentScore {
  id: string;
  month_id: string;
  week: number; // 1 a 4
  player_name: string;
  count: number;
  updated_at: string;
}

export interface TournamentRow {
  player_name: string;
  count: number;
  avatar_url: string | null;
}

// ---------- Dungeons ----------
export interface Dungeon {
  id: string;
  name: string;
  active: boolean;
}

export interface DungeonPlayer {
  member_id: string;
  char_name: string;
  avatar_url: string | null;
}

export interface DungeonRun {
  id: string;
  dungeon_id: string | null;
  dungeon_name: string;
  creator_id: string;
  slots: number; // 1 a 4, contando quem criou
  starts_at: string;
  note: string | null;
  status: "open" | "cancelled";
  created_at: string;
  players: DungeonPlayer[];
}
