import type { LucideIcon } from "lucide-react";
import GhostIcon from "@/components/GhostIcon";
import { RARITY, type Rarity } from "@/lib/types";

/** Cabeçalho das páginas internas */
export function PageHeader({ eyebrow, title, text, icon: Icon }: { eyebrow: string; title: string; text?: string; icon: LucideIcon }) {
  return (
    <div className="pt-28 pb-10 text-center rise-in">
      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spirit/10 border border-spirit/25 text-spirit text-[11px] font-bold uppercase tracking-[0.25em]">
        <Icon className="w-3.5 h-3.5" /> {eyebrow}
      </span>
      <h1 className="font-title text-4xl sm:text-5xl font-bold mt-5 ecto-text">{title}</h1>
      {text && <p className="text-bone/60 mt-4 max-w-2xl mx-auto">{text}</p>}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <h2 className="font-title text-2xl font-bold text-bone flex items-center gap-3">
        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-ecto to-spirit" />
        {title}
      </h2>
      {action}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="crypt-card p-10 text-center">
      <GhostIcon className="w-10 h-11 mx-auto text-spirit/40 hover-haunt" />
      <p className="text-bone/50 mt-4 text-sm">{text}</p>
    </div>
  );
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const r = RARITY[rarity];
  return <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${r.text} ${r.border} ${r.bg}`}>{r.label}</span>;
}

export function DemoBanner() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <p className="mt-20 -mb-16 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-200 text-center">
        Modo demonstração: dados de exemplo. Configure o Supabase (veja o README) para o site salvar de verdade.
      </p>
    </div>
  );
}
