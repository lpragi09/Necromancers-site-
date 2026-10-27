import { Bomb, Car, Gamepad2, Trophy, type LucideIcon } from "lucide-react";
import type { GameIcon } from "@/lib/types";

/** Ícone de cada modo de jogo (o painel escolhe entre estes). */
export const GAME_ICONS: Record<GameIcon, { icon: LucideIcon; label: string }> = {
  bomb: { icon: Bomb, label: "Bomba" },
  kart: { icon: Car, label: "Kart" },
  trophy: { icon: Trophy, label: "Troféu" },
  gamepad: { icon: Gamepad2, label: "Controle" },
};
