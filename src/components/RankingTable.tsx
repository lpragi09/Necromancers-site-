import { Crown, Medal } from "lucide-react";
import Avatar from "@/components/Avatar";
import { RarityBadge } from "@/components/ui";
import type { RankingRow } from "@/lib/types";
import { fmtPoints } from "@/lib/format";

const PODIUM = [
  { ring: "ring-amber-300/70", text: "text-amber-300", glow: "shadow-[0_0_40px_rgba(251,191,36,0.25)]", h: "sm:pt-0" },
  { ring: "ring-zinc-300/60", text: "text-zinc-200", glow: "shadow-[0_0_30px_rgba(212,212,216,0.15)]", h: "sm:pt-8" },
  { ring: "ring-orange-400/60", text: "text-orange-300", glow: "shadow-[0_0_30px_rgba(251,146,60,0.15)]", h: "sm:pt-12" },
];

/** Pódio com os 3 primeiros e o prêmio de cada colocação */
export function Podium({ rows, prizes }: { rows: RankingRow[]; prizes: string[] }) {
  const top = rows.slice(0, 3);
  if (top.length === 0) return null;
  // Ordem visual: 2º, 1º, 3º
  const order = [1, 0, 2].filter((i) => top[i]);
  return (
    <div className="grid sm:grid-cols-3 gap-4 items-start">
      {order.map((i) => {
        const r = top[i];
        const p = PODIUM[i];
        return (
          <div key={r.member_id} className={`${p.h} ${i === 0 ? "order-first sm:order-none" : ""}`}>
            <div className={`crypt-card p-6 text-center ${p.glow}`}>
              <div className="relative w-fit mx-auto">
                {i === 0 && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-7 h-7 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />}
                <Avatar src={r.avatar_url} name={r.char_name} size={i === 0 ? 84 : 68} className={`ring-4 ${p.ring}`} />
              </div>
              <p className={`mt-3 font-title text-sm font-bold uppercase tracking-[0.2em] ${p.text}`}>{i + 1}º lugar</p>
              <p className="font-title text-xl font-bold text-bone truncate">{r.char_name}</p>
              <p className="mt-1 text-2xl font-black text-ecto tabular-nums">{fmtPoints(r.points)} <span className="text-xs text-bone/40 font-semibold">pts</span></p>
              {prizes[i] && <p className="mt-3 text-xs text-bone/60 rounded-lg bg-white/5 border border-white/5 px-3 py-2">{prizes[i]}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RankingTable({ rows, start = 0, compact = false }: { rows: RankingRow[]; start?: number; compact?: boolean }) {
  return (
    <div className="crypt-card divide-y divide-spirit/10 overflow-hidden">
      {rows.map((r, idx) => {
        const pos = start + idx + 1;
        return (
          <div key={r.member_id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-white/[0.02] transition-colors">
            <span className={`w-7 text-center font-title font-bold tabular-nums ${pos <= 3 ? "text-amber-300" : "text-bone/40"}`}>
              {pos <= 3 ? <Medal className="w-5 h-5 mx-auto" /> : pos}
            </span>
            <Avatar src={r.avatar_url} name={r.char_name} size={compact ? 32 : 38} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-bone truncate">{r.char_name}</p>
              {!compact && r.best && (
                <p className="text-xs text-bone/45 truncate flex items-center gap-2 mt-0.5">melhor drop: {r.best.item_name} <RarityBadge rarity={r.best.rarity} /></p>
              )}
            </div>
            {!compact && <span className="hidden sm:block text-xs text-bone/40 tabular-nums">{r.drops} drops</span>}
            <span className="font-black text-ecto tabular-nums">{fmtPoints(r.points)}<span className="text-[10px] text-bone/40 ml-1">pts</span></span>
          </div>
        );
      })}
    </div>
  );
}
