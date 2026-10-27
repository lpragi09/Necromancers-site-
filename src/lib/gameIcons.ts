import { Bomb, Car, Gamepad2, Trophy, type LucideIcon } from "lucide-react";
import type { GameIcon } from "@/lib/types";

/** Ícone de cada modo de jogo (o painel escolhe entre estes). */
export const GAME_ICONS: Record<GameIcon, { icon: LucideIcon; label: string }> = {
  bomb: { icon: Bomb, label: "Bomba" },
  kart: { icon: Car, label: "Kart" },
  trophy: { icon: Trophy, label: "Troféu" },
  gamepad: { icon: Gamepad2, label: "Controle" },
};

/** Imagem que vem com o site para cada ícone (vale enquanto o painel não tiver uma própria). */
export const GAME_DEFAULT_IMAGE: Partial<Record<GameIcon, string>> = {
  bomb: "/games/bomberman.webp",
  kart: "/games/pokekart.webp",
};

/** Imagem do jogo: a do painel ou, sem ela, a que vem com o site. */
export const gameImage = (m: { icon: GameIcon; image_url: string | null }) => m.image_url ?? GAME_DEFAULT_IMAGE[m.icon] ?? null;
