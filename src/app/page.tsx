import Link from "next/link";
import { ArrowDown, ArrowRight, Gem, Gift, Megaphone, Trophy, Users } from "lucide-react";
import PostCard from "@/components/PostCard";
import GiveawayCard from "@/components/GiveawayCard";
import RankingTable, { Podium } from "@/components/RankingTable";
import { BandHeader, Empty } from "@/components/ui";
import { getGiveaways, getPosts, getRanking, getSeasons, getStats, pickSeason } from "@/lib/data";
import { getViewer, isActiveMember } from "@/lib/viewer";
import { fmtDate, fmtPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-10 text-center">
      <Link href={href} className="btn-ghost">{label} <ArrowRight className="w-4 h-4" /></Link>
    </div>
  );
}

export default async function Home() {
  const viewer = await getViewer();
  const [posts, giveaways, seasons, stats] = await Promise.all([getPosts(7), getGiveaways(viewer?.member?.id), getSeasons(), getStats()]);
  const season = pickSeason(seasons);
  const ranking = await getRanking(season?.id);
  const pinned = posts.find((p) => p.pinned && p.kind === "aviso");
  const latest = posts.filter((p) => p !== pinned).slice(0, 3);
  const activeGiveaways = giveaways.filter((g) => g.status !== "drawn").slice(0, 3);
  const canJoin = isActiveMember(viewer);

  return (
    <>
      {/* Hero: cemitério ao luar, névoa e o fantasma do clã */}
      <section className="hero-scene relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-16">
        <div className="hero-moon absolute top-[16%] right-[14%] w-16 h-16 sm:w-24 sm:h-24 rounded-full" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] hero-graves opacity-90" />
        <div className="hero-fog bottom-[6%]" />
        <div className="hero-fog bottom-[-12%] [animation-duration:65s] [animation-direction:reverse] opacity-70" />

        <div className="relative z-10 text-center px-4 rise-in">
          <div className="relative w-fit mx-auto">
            <div className="absolute inset-[12%] rounded-full bg-spirit/40 blur-[70px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Necromancers" width={600} height={600}
              className="logo-float relative w-60 h-60 sm:w-80 sm:h-80 drop-shadow-[0_0_35px_rgba(168,85,247,0.55)]" />
          </div>
          <h1 className="sr-only">Necromancers</h1>
          <p className="mt-4 inline-flex items-center gap-2 text-[11px] sm:text-xs font-black italic uppercase tracking-[0.35em] text-parchment/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blood shadow-[0_0_8px_rgba(239,68,68,0.9)]" /> Clã de PokeTibia <span className="w-1.5 h-1.5 rounded-full bg-blood shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
          </p>
          <p className="mt-4 text-base sm:text-lg italic text-bone/60 max-w-xl mx-auto">
            Onde os treinadores fantasmas se reúnem. Sorteios, ranking de drops e tudo que acontece no clã.
          </p>
          <div className="mt-9 flex flex-wrap gap-4 justify-center">
            <Link href="/sorteios" className="btn-neon"><Gift className="w-4 h-4" /> Ver sorteios</Link>
            <Link href="/ranking" className="btn-ghost"><Trophy className="w-4 h-4" /> Ranking</Link>
          </div>
        </div>

        <a href="#cla" className="scroll-cue absolute bottom-16 z-10 hidden [@media(min-height:760px)]:flex flex-col items-center gap-1 text-[10px] font-black italic uppercase tracking-[0.3em] text-bone/60 hover:text-bone">
          Ver o clã <ArrowDown className="w-4 h-4" />
        </a>
      </section>

      {/* Números do clã e aviso fixado */}
      <div id="cla" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 -mt-10 scroll-mt-20 space-y-6">
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

        {pinned && (
          <Link href={`/avisos#${pinned.id}`} className="block rounded-[0.9rem] border border-spirit/40 bg-gradient-to-r from-spirit/15 via-crypt to-crypt p-5 sm:p-6 hover:border-spirit/70 hover:shadow-[0_0_28px_rgba(168,85,247,0.2)] transition-all">
            <p className="flex items-center gap-2 text-[11px] font-black italic uppercase tracking-[0.25em] text-spirit"><Megaphone className="w-4 h-4" /> Aviso importante</p>
            <p className="font-title text-xl sm:text-2xl mt-2">{pinned.title}</p>
            <p className="text-sm text-bone/60 mt-1 line-clamp-2">{pinned.body}</p>
          </Link>
        )}
      </div>

      {/* Sorteios */}
      <section className="mt-20 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <BandHeader eyebrow="Sorteios" title="Sorteios" accent="ativos" text="Uma chance por membro ativo, com resultado que qualquer um pode conferir." />
          {activeGiveaways.length ? (
            <div className="flex flex-wrap justify-center gap-5">
              {activeGiveaways.map((g) => (
                <div key={g.id} className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)] flex">
                  <GiveawayCard giveaway={g} canJoin={canJoin} />
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Nenhum sorteio aberto agora. Fique de olho nos avisos!" />
          )}
          <SeeAll href="/sorteios" label="Todos os sorteios" />
        </div>
      </section>

      {/* Ranking da temporada */}
      <section className="py-20 border-t border-white/5 bg-gradient-to-b from-[#0c0614]/80 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <BandHeader
            eyebrow={season?.name ?? "Ranking"}
            title="Top"
            accent="da temporada"
            text={season?.ends_at ? `Termina em ${fmtDate(season.ends_at)}. O top 3 leva prêmio.` : "Cada drop raro aprovado vale pontos."}
          />
          {ranking.length ? (
            <>
              <Podium rows={ranking} prizes={season?.prizes ?? []} />
              {ranking.length > 3 && <div className="mt-8 max-w-3xl mx-auto"><RankingTable rows={ranking.slice(3, 8)} start={3} compact /></div>}
            </>
          ) : (
            <Empty text="Ninguém pontuou ainda nesta temporada." />
          )}
          <SeeAll href="/ranking" label="Ranking completo" />
        </div>
      </section>

      {/* Mural */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <BandHeader eyebrow="Mural do clã" title="Avisos &" accent="novidades" text="Regras, eventos, hunts e novidades do servidor." />
          {latest.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{latest.map((p) => <PostCard key={p.id} post={p} />)}</div>
          ) : (
            <Empty text="Nenhuma novidade por enquanto." />
          )}
          <SeeAll href="/avisos" label="Ver o mural" />
        </div>
      </section>

      {/* Chamada para registrar drop */}
      <section className="pt-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[0.9rem] border border-spirit/30 bg-gradient-to-br from-[#1a0b2e] via-crypt to-black p-8 sm:p-12 text-center">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-48 bg-spirit/25 blur-[90px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-160.webp" alt="" className="absolute -right-8 -bottom-10 w-48 h-48 opacity-[0.07] rotate-12 grayscale" />
            <p className="relative text-[11px] font-black italic uppercase tracking-[0.3em] text-spirit">Temporada valendo prêmio</p>
            <h2 className="relative font-title text-3xl sm:text-5xl mt-3">Dropou algo <span className="text-spirit text-glow">raro?</span></h2>
            <p className="relative text-bone/60 italic mt-3 max-w-lg mx-auto">Mande o print pelo site. A liderança confere, os pontos entram no ranking e o top 3 da temporada leva prêmio.</p>
            <Link href="/ranking#enviar" className="relative btn-neon mt-8"><Gem className="w-4 h-4" /> Registrar drop</Link>
          </div>
        </div>
      </section>
    </>
  );
}
