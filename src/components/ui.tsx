import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import GhostIcon from "@/components/GhostIcon";
import { RARITY, type Rarity } from "@/lib/types";

/** Cabeçalho das páginas internas: selo pequeno, título branco e a palavra de destaque em roxo */
export function PageHeader({ eyebrow, title, accent, text, icon: Icon }: { eyebrow: string; title: string; accent?: string; text?: string; icon: LucideIcon }) {
  return (
    <div className="pt-32 pb-12 text-center rise-in">
      <span className="inline-flex items-center gap-2 text-[11px] font-black italic uppercase tracking-[0.25em] text-bone/55">
        <Icon className="w-3.5 h-3.5 text-spirit" /> {eyebrow}
      </span>
      <h1 className="font-title text-4xl sm:text-6xl mt-4 text-bone">
        {title} {accent && <span className="text-spirit text-glow">{accent}</span>}
      </h1>
      {text && <p className="text-bone/55 italic mt-4 max-w-2xl mx-auto">{text}</p>}
    </div>
  );
}

/** Título de seção: ícone roxo, título em caixa alta e um link "ver todos" opcional */
export function SectionTitle({ title, icon: Icon, href, linkLabel = "Ver todos" }: { title: string; icon?: LucideIcon; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <h2 className="font-title text-2xl sm:text-[1.7rem] text-bone flex items-center gap-2.5">
        {Icon ? <Icon className="w-6 h-6 text-spirit" /> : <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-spirit to-hex" />}
        {title}
      </h2>
      {href && (
        <Link href={href} className="shrink-0 flex items-center gap-1 text-xs font-bold italic text-bone/55 hover:text-spirit transition-colors">
          {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-[0.9rem] border border-dashed border-white/10 bg-white/[0.015] p-10 text-center">
      <GhostIcon className="w-10 h-11 mx-auto text-spirit/40 hover-haunt" />
      <p className="text-bone/45 italic mt-4 text-sm">{text}</p>
    </div>
  );
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const r = RARITY[rarity];
  return <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-black italic uppercase tracking-widest ${r.text} ${r.border} ${r.bg}`}>{r.label}</span>;
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
