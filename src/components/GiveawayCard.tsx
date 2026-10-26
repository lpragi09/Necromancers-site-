/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Clock, Gift, ShieldCheck, Trophy, Users } from "lucide-react";
import type { Giveaway } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import GhostIcon from "@/components/GhostIcon";
import JoinButton from "@/components/JoinButton";

const STATUS = {
  open: { label: "Inscrições abertas", cls: "text-ecto bg-ecto/10 border-ecto/30" },
  closed: { label: "Aguardando sorteio", cls: "text-amber-300 bg-amber-400/10 border-amber-400/30" },
  drawn: { label: "Sorteado", cls: "text-spirit bg-spirit/10 border-spirit/30" },
};

export default function GiveawayCard({ giveaway: g, canJoin }: { giveaway: Giveaway; canJoin: boolean }) {
  const st = STATUS[g.status];
  const expired = g.status === "open" && g.ends_at && new Date(g.ends_at).getTime() < Date.now();
  return (
    <div className="crypt-card crypt-card-hover overflow-hidden flex flex-col">
      <div className="relative aspect-[16/8] bg-gradient-to-br from-tomb via-crypt to-void flex items-center justify-center overflow-hidden">
        {g.image_url ? (
          <img src={g.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
        ) : (
          <GhostIcon className="w-20 h-22 text-spirit/25 hover-haunt" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-crypt via-transparent" />
        <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest backdrop-blur ${st.cls}`}>{expired ? "Inscrições encerradas" : st.label}</span>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-title text-xl font-bold text-bone">{g.title}</h3>
        <p className="mt-2 flex items-center gap-2 text-ecto font-semibold"><Gift className="w-4 h-4 shrink-0" /> {g.prize}</p>
        {g.description && <p className="mt-2 text-sm text-bone/60 line-clamp-3">{g.description}</p>}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-bone/50">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {g.entries_count ?? 0} inscritos</span>
          {g.ends_at && g.status !== "drawn" && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> até {fmtDateTime(g.ends_at)}</span>}
        </div>

        <div className="mt-auto pt-5">
          {g.status === "drawn" && g.winner_name ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
              <p className="flex items-center gap-2 text-amber-200 font-bold"><Trophy className="w-4 h-4" /> {g.winner_name}</p>
              {g.fair_draw_id && (
                <Link href={`/provably-fair?id=${g.fair_draw_id}`} className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-spirit hover:text-ecto">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ver prova do sorteio
                </Link>
              )}
            </div>
          ) : g.status === "open" && !expired ? (
            <JoinButton giveawayId={g.id} joined={!!g.joined} canJoin={canJoin} />
          ) : (
            <p className="text-sm text-bone/50">A liderança vai sortear em breve. O resultado aparece aqui.</p>
          )}
        </div>
      </div>
    </div>
  );
}
