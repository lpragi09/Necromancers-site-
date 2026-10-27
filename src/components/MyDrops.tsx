import { RarityBadge } from "@/components/ui";
import type { Drop } from "@/lib/types";
import { timeAgo } from "@/lib/format";

const STATUS = {
  pending: { label: "Em análise", cls: "text-amber-300 bg-amber-400/10 border-amber-400/30" },
  approved: { label: "Aprovado", cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30" },
  rejected: { label: "Recusado", cls: "text-rose-300 bg-rose-500/10 border-rose-400/30" },
};

export default function MyDrops({ drops }: { drops: Drop[] }) {
  if (!drops.length) return <p className="text-sm text-bone/50">Você ainda não enviou nenhum drop.</p>;
  return (
    <div className="divide-y divide-spirit/10">
      {drops.map((d) => (
        <div key={d.id} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-bone truncate">{d.quantity > 1 ? `${d.quantity}x ` : ""}{d.item_name}</p>
            <p className="text-xs text-bone/40 flex items-center gap-2 mt-0.5"><RarityBadge rarity={d.rarity} /> {timeAgo(d.created_at)}</p>
          </div>
          <span className="text-sm font-bold text-spirit tabular-nums">+{(d.points * d.quantity).toLocaleString("pt-BR")}</span>
          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${STATUS[d.status].cls}`}>{STATUS[d.status].label}</span>
        </div>
      ))}
    </div>
  );
}
