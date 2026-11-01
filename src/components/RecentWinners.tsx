/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Clock, Trophy } from "lucide-react";
import Avatar from "@/components/Avatar";
import GhostIcon from "@/components/GhostIcon";
import type { GiveawayWinner } from "@/lib/data";

const fmtDay = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }) : "—";

function WinnerCard({ w }: { w: GiveawayWinner }) {
  const body = (
    <>
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#2a0f4a] via-[#120822] to-black">
        {w.image_url ? (
          <img src={w.image_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(168,85,247,0.45),transparent_60%)]" />
            <GhostIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-20 text-[#e9e2ff] specter-glow" />
          </>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <p className="font-title text-base text-bone truncate">{w.prize}</p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar src={w.avatar_url} name={w.winner_name} size={36} className="shrink-0 ring-2 ring-spirit/40" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black italic uppercase tracking-widest text-bone/40">Vencedor</p>
            <p className="text-sm font-bold italic text-ecto truncate">{w.winner_name}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-black italic uppercase tracking-widest text-bone/40">Sorteado</p>
            <p className="inline-flex items-center gap-1 text-xs italic text-bone/80 tabular-nums"><Clock className="w-3.5 h-3.5 text-spirit" /> {fmtDay(w.drawn_at)}</p>
          </div>
        </div>
      </div>
    </>
  );
  const cls = "snap-start shrink-0 w-[85%] sm:w-[330px] crypt-card crypt-card-hover overflow-hidden block";
  // O card inteiro leva à prova do sorteio
  return w.fair_draw_id
    ? <Link href={`/provably-fair?id=${w.fair_draw_id}`} title="Ver prova do sorteio" className={cls}>{body}</Link>
    : <div className={cls}>{body}</div>;
}

/** Quem ganhou os últimos sorteios e em que dia, em uma fileira que rola para o lado. */
export default function RecentWinners({ winners }: { winners: GiveawayWinner[] }) {
  if (!winners.length) return null;
  return (
    <div className="mt-12">
      <h3 className="mb-4 flex items-center gap-2 font-title text-xl text-bone"><Trophy className="w-5 h-5 text-amber-300" /> Últimos ganhadores</h3>
      <div className="flex gap-4 overflow-x-auto snap-x pb-4 [scrollbar-width:thin] [scrollbar-color:#a855f7_transparent]">
        {winners.map((w) => <WinnerCard key={w.id} w={w} />)}
      </div>
    </div>
  );
}
