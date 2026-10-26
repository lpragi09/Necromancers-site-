import Link from "next/link";
import { ArrowDown, Gem, Gift, Megaphone, Newspaper, Trophy, Users } from "lucide-react";
import GhostIcon from "@/components/GhostIcon";
import PostCard from "@/components/PostCard";
import GiveawayCard from "@/components/GiveawayCard";
import RankingTable from "@/components/RankingTable";
import { Empty, SectionTitle } from "@/components/ui";
import { getGiveaways, getPosts, getRanking, getSeasons, getStats, pickSeason } from "@/lib/data";
import { getViewer, isActiveMember } from "@/lib/viewer";
import { fmtDate, fmtPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const viewer = await getViewer();
  const [posts, giveaways, seasons, stats] = await Promise.all([getPosts(7), getGiveaways(viewer?.member?.id), getSeasons(), getStats()]);
  const season = pickSeason(seasons);
  const ranking = await getRanking(season?.id);
  const pinned = posts.find((p) => p.pinned && p.kind === "aviso");
  const latest = posts.filter((p) => p !== pinned).slice(0, 3);
  const openGiveaway = giveaways.find((g) => g.status === "open") ?? giveaways.find((g) => g.status === "closed") ?? giveaways[0];

  return (
    <>
      {/* Hero: cemitério ao luar, névoa e o fantasma do clã */}
      <section className="hero-scene relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-16">
        <div className="hero-moon absolute top-[16%] right-[14%] w-16 h-16 sm:w-24 sm:h-24 rounded-full" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] hero-graves opacity-90" />
        <div className="hero-fog bottom-[6%]" />
        <div className="hero-fog bottom-[-12%] [animation-duration:65s] [animation-direction:reverse] opacity-70" />

        <div className="relative z-10 text-center px-4 rise-in">
          <div className="hover-haunt specter-glow w-fit mx-auto">
            <GhostIcon className="specter w-24 h-28 sm:w-32 sm:h-36 text-[#e9e2ff]" />
          </div>
          <p className="mt-6 text-[11px] sm:text-xs font-black italic uppercase tracking-[0.35em] text-spirit">Clã de PokeTibia</p>
          <h1 className="font-title text-[clamp(2.75rem,11vw,7.5rem)] leading-[0.9] mt-3 text-bone">
            Necro<span className="text-spirit text-glow flicker">mancers</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg italic text-bone/60 max-w-xl mx-auto">
            Onde os treinadores fantasmas se reúnem. Sorteios, ranking de drops e tudo que acontece no clã.
          </p>
          <div className="mt-9 flex flex-wrap gap-4 justify-center">
            <Link href="/sorteios" className="btn-neon"><Gift className="w-4 h-4" /> Ver sorteios</Link>
            <Link href="/ranking" className="btn-ghost"><Trophy className="w-4 h-4" /> Ranking</Link>
          </div>
        </div>

        <a href="#cla" className="scroll-cue absolute bottom-16 z-10 flex flex-col items-center gap-1 text-[10px] font-black italic uppercase tracking-[0.3em] text-bone/60 hover:text-bone">
          Ver o clã <ArrowDown className="w-4 h-4" />
        </a>
      </section>

      <div id="cla" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 -mt-10 scroll-mt-20">
        <div className="crypt-card grid grid-cols-3 divide-x divide-white/5">
          {[
            { icon: Users, label: "Membros ativos", value: stats.members },
            { icon: Gem, label: "Drops registrados", value: stats.drops },
            { icon: Gift, label: "Sorteios abertos", value: stats.openGiveaways },
          ].map((s) => (
            <div key={s.label} className="px-3 py-5 sm:px-8 sm:py-6 text-center sm:text-left sm:flex items-center gap-4">
              <s.icon className="hidden sm:block w-7 h-7 text-spirit shrink-0" />
              <div>
                <p className="font-title text-3xl sm:text-4xl text-bone tabular-nums">{fmtPoints(s.value)}</p>
                <p className="text-[10px] sm:text-[11px] font-black italic uppercase tracking-widest text-bone/45 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 space-y-16">
        {pinned && (
          <Link href={`/avisos#${pinned.id}`} className="group block rounded-[0.9rem] border border-spirit/40 bg-gradient-to-r from-spirit/15 via-crypt to-crypt p-5 sm:p-6 hover:border-spirit/70 hover:shadow-[0_0_28px_rgba(168,85,247,0.2)] transition-all">
            <p className="flex items-center gap-2 text-[11px] font-black italic uppercase tracking-[0.25em] text-spirit"><Megaphone className="w-4 h-4" /> Aviso importante</p>
            <p className="font-title text-xl sm:text-2xl mt-2">{pinned.title}</p>
            <p className="text-sm text-bone/60 mt-1 line-clamp-2">{pinned.body}</p>
          </Link>
        )}

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10">
          <section>
            <SectionTitle title="Novidades" icon={Newspaper} href="/avisos" />
            {latest.length ? (
              <div className="grid gap-4">{latest.map((p) => <PostCard key={p.id} post={p} />)}</div>
            ) : (
              <Empty text="Nenhuma novidade por enquanto." />
            )}
          </section>

          <div className="space-y-10">
            <section>
              <SectionTitle title="Sorteio" icon={Gift} href="/sorteios" />
              {openGiveaway ? <GiveawayCard giveaway={openGiveaway} canJoin={isActiveMember(viewer)} /> : <Empty text="Nenhum sorteio no momento." />}
            </section>

            <section>
              <SectionTitle title="Top 5" icon={Trophy} href="/ranking" linkLabel="Ranking" />
              {season && <p className="-mt-3 mb-4 text-xs italic text-bone/45">{season.name}{season.ends_at ? ` · termina em ${fmtDate(season.ends_at)}` : ""}</p>}
              {ranking.length ? <RankingTable rows={ranking.slice(0, 5)} compact /> : <Empty text="Ninguém pontuou ainda nesta temporada." />}
            </section>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[0.9rem] border border-spirit/30 bg-gradient-to-br from-[#1a0b2e] via-crypt to-black p-8 sm:p-12 text-center">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-48 bg-spirit/25 blur-[90px]" />
          <GhostIcon className="absolute -right-6 -bottom-8 w-40 h-44 text-white/[0.04] rotate-12" />
          <p className="relative text-[11px] font-black italic uppercase tracking-[0.3em] text-spirit">Temporada valendo prêmio</p>
          <h2 className="relative font-title text-3xl sm:text-5xl mt-3">Dropou algo <span className="text-spirit text-glow">raro?</span></h2>
          <p className="relative text-bone/60 italic mt-3 max-w-lg mx-auto">Mande o print pelo site. A liderança confere, os pontos entram no ranking e o top 3 da temporada leva prêmio.</p>
          <Link href="/ranking#enviar" className="relative btn-neon mt-8"><Gem className="w-4 h-4" /> Registrar drop</Link>
        </section>
      </div>
    </>
  );
}
