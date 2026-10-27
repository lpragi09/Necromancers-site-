/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CalendarCheck, ShieldCheck, Star, Trophy } from "lucide-react";
import type { Giveaway } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import GhostIcon from "@/components/GhostIcon";
import JoinButton from "@/components/JoinButton";

const STATUS = {
  open: { label: "Inscrições abertas", cls: "text-white bg-spirit/80 border-spirit" },
  closed: { label: "Aguardando sorteio", cls: "text-amber-200 bg-amber-500/25 border-amber-400/50" },
  drawn: { label: "Sorteado", cls: "text-bone/80 bg-black/60 border-white/15" },
};

export default function GiveawayCard({ giveaway: g, canJoin }: { giveaway: Giveaway; canJoin: boolean }) {
  const st = STATUS[g.status];
  const expired = g.status === "open" && g.ends_at && new Date(g.ends_at).getTime() < Date.now();
  const done = g.status === "drawn";
  return (
    <div className={`w-full crypt-card crypt-card-hover overflow-hidden flex flex-col ${g.status === "open" && !expired ? "!border-spirit/40" : ""}`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#2a0f4a] via-[#120822] to-black">
        {g.image_url ? (
          <img src={g.image_url} alt="" className={`absolute inset-0 w-full h-full object-cover ${done ? "grayscale opacity-50" : ""}`} />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(168,85,247,0.45),transparent_60%)]" />
            <GhostIcon className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-24 text-[#e9e2ff] specter-glow ${done ? "opacity-30" : "hover-haunt"}`} />
          </>
        )}
        <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md border text-[10px] font-black italic uppercase tracking-widest backdrop-blur ${st.cls}`}>{expired ? "Inscrições encerradas" : st.label}</span>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-title text-lg text-bone flex items-start gap-2">
          <Star className="w-4 h-4 mt-0.5 shrink-0 fill-spirit text-spirit" /> <span className="line-clamp-2">{g.title}</span>
        </h3>
        {g.description && <p className="mt-2 text-sm italic text-bone/55 line-clamp-2">{g.description}</p>}

        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-black italic uppercase tracking-widest text-bone/40">Prêmio</p>
            <p className="text-sm font-black italic text-spirit truncate">{g.prize}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black italic uppercase tracking-widest text-bone/40">{done ? "Participaram" : g.ends_at ? "Até" : "Inscritos"}</p>
            <p className="text-sm font-black italic text-bone tabular-nums">{done || !g.ends_at ? g.entries_count ?? 0 : fmtDateTime(g.ends_at)}</p>
          </div>
        </div>
        {!done && g.ends_at && <p className="mt-2 text-[11px] italic text-bone/40">{g.entries_count ?? 0} inscritos até agora</p>}

        <div className="mt-auto pt-5">
          {done && g.winner_name ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
              <p className="text-[10px] font-black italic uppercase tracking-widest text-amber-200/70">Vencedor</p>
              <p className="flex items-center gap-2 text-amber-200 font-black italic"><Trophy className="w-4 h-4" /> {g.winner_name}</p>
              {g.drawn_at && <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-100/60"><CalendarCheck className="w-3.5 h-3.5" /> Sorteado em {fmtDateTime(g.drawn_at)}</p>}
              {g.fair_draw_id && (
                <Link href={`/provably-fair?id=${g.fair_draw_id}`} className="mt-1 inline-flex items-center gap-1 text-[11px] font-black italic uppercase tracking-widest text-spirit hover:text-ecto">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ver prova do sorteio
                </Link>
              )}
            </div>
          ) : g.status === "open" && !expired ? (
            g.rejected ? (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-center text-xs font-black italic uppercase text-rose-200">Removido deste sorteio pela liderança</p>
          ) : (
            <JoinButton giveawayId={g.id} joined={!!g.joined} canJoin={canJoin} />
          )
          ) : (
            <p className="text-sm italic text-bone/50">A liderança vai sortear em breve. O resultado aparece aqui.</p>
          )}
        </div>
      </div>
    </div>
  );
}
