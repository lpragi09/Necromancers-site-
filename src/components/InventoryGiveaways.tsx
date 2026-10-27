"use client";

import { Crown, Gift, Mountain, Package, Trophy } from "lucide-react";
import Pagination, { usePagination } from "@/components/Pagination";
import { fmtDateTime, timeAgo } from "@/lib/format";
import type { InventoryGiveaway, InventoryRun } from "@/lib/data";
import type { ShopOrder } from "@/lib/types";

const pill = (g: InventoryGiveaway) =>
  g.rejected ? { label: "Removido", cls: "text-rose-300 bg-rose-500/10 border-rose-400/30" }
  : g.won ? { label: "Você ganhou!", cls: "text-amber-200 bg-amber-400/15 border-amber-300/50" }
  : g.status === "open" ? { label: "Inscrito", cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30" }
  : g.status === "closed" ? { label: "Aguardando sorteio", cls: "text-amber-300 bg-amber-400/10 border-amber-400/30" }
  : { label: "Não foi dessa vez", cls: "text-bone/45 bg-white/5 border-white/10" };

/** Sorteios em que o membro entrou, 6 por página. */
export default function InventoryGiveaways({ list }: { list: InventoryGiveaway[] }) {
  const pag = usePagination(list, 6);
  if (!list.length) return <p className="text-sm italic text-bone/45">Você ainda não entrou em nenhum sorteio.</p>;
  return (
    <div>
      <div className="space-y-2">
        {pag.pageItems.map((g) => {
          const p = pill(g);
          return (
            <div key={g.id} className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 ${g.won ? "border-amber-300/30 bg-amber-400/[0.06]" : "border-white/5 bg-white/[0.02]"}`}>
              {g.won ? <Trophy className="w-4 h-4 shrink-0 text-amber-300" /> : <Gift className="w-4 h-4 shrink-0 text-spirit" />}
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{g.title}</p>
                <p className="text-[11px] text-bone/45 truncate">{g.prize}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-black italic uppercase tracking-wider ${p.cls}`}>{p.label}</span>
            </div>
          );
        })}
      </div>
      <Pagination {...pag} />
    </div>
  );
}

/** Itens resgatados na lojinha esperando entrega, 5 por página. */
export function InventoryOrders({ list }: { list: ShopOrder[] }) {
  const pag = usePagination(list, 5);
  if (!list.length) return <p className="text-sm italic text-bone/45">Nenhum resgate esperando entrega.</p>;
  return (
    <div>
      <div className="space-y-2">
        {pag.pageItems.map((o) => (
          <div key={o.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
            <Package className="w-4 h-4 shrink-0 text-spirit" />
            <p className="flex-1 min-w-0 font-bold truncate">{o.item_name}</p>
            <span className="text-[11px] text-bone/40">{timeAgo(o.created_at)}</span>
          </div>
        ))}
      </div>
      <Pagination {...pag} />
    </div>
  );
}

/** Próximos grupos de dungeon do membro, 5 por página. */
export function InventoryRuns({ list }: { list: InventoryRun[] }) {
  const pag = usePagination(list, 5);
  if (!list.length) return <p className="text-sm italic text-bone/45">Você não está em nenhum grupo marcado.</p>;
  return (
    <div>
      <div className="space-y-2">
        {pag.pageItems.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
            {r.mine ? <Crown className="w-4 h-4 shrink-0 text-amber-300" /> : <Mountain className="w-4 h-4 shrink-0 text-spirit" />}
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">{r.dungeon_name}</p>
              <p className="text-[11px] text-bone/45">{fmtDateTime(r.starts_at)}{r.mine ? " · você criou" : ""}</p>
            </div>
            <span className="text-xs font-black italic text-bone/55 tabular-nums">{r.filled}/{r.slots}</span>
          </div>
        ))}
      </div>
      <Pagination {...pag} />
    </div>
  );
}
