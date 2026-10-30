import Link from "next/link";
import { Crown, ShieldCheck, Swords, Trophy } from "lucide-react";
import MembersGate from "@/components/MembersGate";
import Avatar from "@/components/Avatar";
import PageNav, { pageFrom, slicePage } from "@/components/PageNav";
import { Empty, PageHeader } from "@/components/ui";
import { getTournamentDraws, getTournamentMonths, getTournamentRanking } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { inTournamentDraw, MIN_PRESENCE_PERCENT, tournamentsIn, TOURNAMENTS_PER_WEEK } from "@/lib/tournament";
import { canSeeContent, getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Torneios" };

const PAGE_SIZE = 20;
const WEEKS = [1, 2, 3, 4] as const;

// Semana do mês de hoje (no horário de Brasília): dia 1–7 = 1, 8–14 = 2, 15–21 = 3, 22 em diante = 4
const currentWeek = () => {
  const day = Number(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo", day: "numeric" }));
  return Math.min(4, Math.ceil(day / 7));
};

const PODIUM = [
  { text: "text-amber-300", ring: "ring-amber-300/70", border: "!border-amber-300/40", glow: "shadow-[0_0_40px_rgba(251,191,36,0.2)]", h: "sm:pt-0" },
  { text: "text-zinc-200", ring: "ring-zinc-300/60", border: "!border-zinc-300/25", glow: "", h: "sm:pt-8" },
  { text: "text-orange-300", ring: "ring-orange-400/60", border: "!border-orange-400/30", glow: "", h: "sm:pt-12" },
];

export default async function TorneiosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (!canSeeContent(viewer)) return <MembersGate viewer={viewer} />;

  const months = await getTournamentMonths();
  const month = months.find((m) => m.id === params.mes) ?? months[0];
  const isNewest = month?.id === months[0]?.id;
  const rawWeek = typeof params.semana === "string" ? params.semana : undefined;
  // Sem filtro: mês atual abre na semana de hoje; meses antigos abrem no total do mês
  const week: number | null = rawWeek === "todo" ? null : rawWeek && /^[1-4]$/.test(rawWeek) ? Number(rawWeek) : isNewest ? currentWeek() : null;
  const [ranking, draws] = month ? await Promise.all([getTournamentRanking(month.id, week), getTournamentDraws(month.id)]) : [[], []];
  const rest = slicePage(ranking.slice(3), pageFrom(params), PAGE_SIZE);
  const top = ranking.slice(0, 3);

  const href = (w: number | null, m = month?.id) => {
    const q = new URLSearchParams();
    if (m && m !== months[0]?.id) q.set("mes", m);
    q.set("semana", w === null ? "todo" : String(w));
    return `/torneios?${q.toString()}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Swords} eyebrow="Presença nos torneios" title="Ranking dos" accent="torneios" text={`São ${TOURNAMENTS_PER_WEEK} torneios por semana. Quem tiver ${MIN_PRESENCE_PERCENT}% de presença entra no sorteio do torneio; quem não tiver fica de fora.`} />

      {!month ? (
        <Empty text="Nenhum mês de torneios criado ainda." />
      ) : (
        <>
          {months.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 -mt-4 mb-6">
              {months.slice(0, 12).map((m) => (
                <Link key={m.id} href={href(null, m.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black italic uppercase tracking-wide border transition-colors ${m.id === month.id ? "border-spirit/60 bg-spirit/15 text-bone" : "border-white/10 text-bone/50 hover:text-bone"}`}>
                  {m.name}
                </Link>
              ))}
            </div>
          )}

          {/* Filtro de semanas */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex flex-wrap justify-center gap-1 p-1 rounded-xl bg-black/60 border border-white/10">
              {[...WEEKS, null].map((w) => {
                const on = w === week;
                return (
                  <Link key={w ?? "todo"} href={href(w)} scroll={false}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-black italic uppercase tracking-wide transition-all ${on ? "bg-spirit text-white shadow-[0_0_14px_rgba(168,85,247,0.45)]" : "text-bone/55 hover:text-bone hover:bg-white/5"}`}>
                    {w === null ? "Mês todo" : `Semana ${w}`}
                    {isNewest && w === currentWeek() && !on && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blood align-middle" title="Semana atual" />}
                  </Link>
                );
              })}
            </div>
          </div>

          {draws.length > 0 && (
            <div className="mb-10 rounded-[0.9rem] border border-amber-300/30 bg-gradient-to-r from-amber-400/[0.08] via-crypt to-crypt p-5">
              <p className="flex items-center gap-2 text-[11px] font-black italic uppercase tracking-[0.25em] text-amber-200/80"><Trophy className="w-4 h-4 text-amber-300" /> Sorteios deste mês</p>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {draws.map((d) => (
                  <Link key={d.id} href={`/provably-fair?id=${d.id}`} className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/30 px-3.5 py-2.5 hover:border-amber-300/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-black italic truncate text-amber-100">{d.winner_label}</p>
                      <p className="text-[11px] text-bone/45 truncate">{d.title.replace(/^Torneio · /, "")}{d.drawn_at ? ` · ${fmtDateTime(d.drawn_at)}` : ""}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black italic uppercase text-spirit"><ShieldCheck className="w-3.5 h-3.5" /> Prova</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <p className="text-center -mt-6 mb-8 text-xs italic text-bone/40">
            {month.name} · {week === null ? "total do mês" : `semana ${week}`}{isNewest && week === currentWeek() ? " (semana atual)" : ""}
          </p>

          {ranking.length === 0 ? (
            <Empty text={week === null ? "Ninguém registrado neste mês ainda." : `Ninguém registrado na semana ${week} ainda.`} />
          ) : (
            <>
              {/* Pódio: 2º, 1º, 3º */}
              <div className="grid sm:grid-cols-3 gap-4 items-start">
                {[1, 0, 2].filter((i) => top[i]).map((i) => {
                  const r = top[i];
                  const p = PODIUM[i];
                  return (
                    <div key={r.player_name} className={`${p.h} ${i === 0 ? "order-first sm:order-none" : ""}`}>
                      <div className={`crypt-card p-6 text-center ${p.border} ${p.glow}`}>
                        <div className="relative w-fit mx-auto">
                          {i === 0 && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-7 h-7 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />}
                          <Avatar src={r.avatar_url} name={r.player_name} size={i === 0 ? 84 : 68} className={`ring-4 ${p.ring}`} />
                        </div>
                        <p className={`mt-3 font-title text-sm uppercase tracking-[0.2em] ${p.text}`}>{i + 1}º lugar</p>
                        <p className="font-title text-xl truncate">{r.player_name}</p>
                        <p className="mt-1 font-title text-3xl text-spirit tabular-nums">{r.count}<span className="ml-1.5 text-xs text-bone/40 not-italic">{r.count === 1 ? "torneio" : "torneios"}</span></p>
                        <p className={`mt-1 text-xs font-bold tabular-nums ${inTournamentDraw(r.count, week) ? "text-emerald-300" : "text-bone/40"}`}>{r.count}/{tournamentsIn(week)} · {inTournamentDraw(r.count, week) ? "no sorteio" : "fora do sorteio"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {ranking.length > 3 && (
                <div id="tabela" className="mt-8 scroll-mt-24 crypt-card divide-y divide-white/5 overflow-hidden">
                  {rest.items.map((r, idx) => {
                    const pos = 4 + (rest.page - 1) * PAGE_SIZE + idx;
                    return (
                      <div key={r.player_name} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-white/[0.02] transition-colors">
                        <span className="w-8 text-center font-title text-bone/40 tabular-nums">{pos}º</span>
                        <Avatar src={r.avatar_url} name={r.player_name} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{r.player_name}</p>
                          <p className={`text-[11px] font-bold tabular-nums ${inTournamentDraw(r.count, week) ? "text-emerald-300" : "text-bone/40"}`}>{r.count}/{tournamentsIn(week)} · {inTournamentDraw(r.count, week) ? "no sorteio" : "fora do sorteio"}</p>
                        </div>
                        <span className="font-black text-spirit tabular-nums">{r.count}<span className="ml-1 text-[10px] text-bone/40">{r.count === 1 ? "torneio" : "torneios"}</span></span>
                      </div>
                    );
                  })}
                </div>
              )}
              <PageNav page={rest.page} pageCount={rest.pageCount} path="/torneios" params={params} anchor="tabela" />
            </>
          )}
        </>
      )}
    </div>
  );
}
