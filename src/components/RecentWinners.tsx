import Link from "next/link";
import { CalendarCheck, ShieldCheck, Trophy } from "lucide-react";
import Avatar from "@/components/Avatar";
import { fmtDate } from "@/lib/format";
import type { GiveawayWinner } from "@/lib/data";

/** Quem ganhou os últimos sorteios e em que dia. */
export default function RecentWinners({ winners }: { winners: GiveawayWinner[] }) {
  if (!winners.length) return null;
  return (
    <div className="mt-12">
      <h3 className="mb-4 flex items-center gap-2 font-title text-xl text-bone"><Trophy className="w-5 h-5 text-amber-300" /> Últimos ganhadores</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {winners.map((w) => (
          <div key={w.id} className="crypt-card !border-amber-300/20 p-4 flex items-center gap-3">
            <Avatar src={w.avatar_url} name={w.winner_name} size={44} className="ring-2 ring-amber-300/40" />
            <div className="min-w-0 flex-1">
              <p className="font-black italic truncate text-amber-100">{w.winner_name}</p>
              <p className="text-xs text-bone/55 truncate">{w.prize}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-bone/45">
                {w.drawn_at && <span className="inline-flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> {fmtDate(w.drawn_at)}</span>}
                {w.fair_draw_id && <Link href={`/provably-fair?id=${w.fair_draw_id}`} className="inline-flex items-center gap-1 font-black italic uppercase text-spirit hover:text-ecto"><ShieldCheck className="w-3 h-3" /> Prova</Link>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
