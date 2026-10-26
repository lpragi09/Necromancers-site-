import Link from "next/link";
import { ArrowRight, Gem, Gift, Megaphone, Skull, Trophy, Users } from "lucide-react";
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
      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div className="rise-in text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ecto/10 border border-ecto/25 text-ecto text-[11px] font-bold uppercase tracking-[0.25em]">
              <Skull className="w-3.5 h-3.5" /> Clã de PokeTibia
            </span>
            <h1 className="font-title font-black text-5xl sm:text-7xl mt-6 leading-[0.95] tracking-wide">
              <span className="ecto-text flicker">NECRO</span>
              <br />
              <span className="ecto-text">MANCERS</span>
            </h1>
            <p className="mt-6 text-lg text-bone/65 max-w-xl mx-auto lg:mx-0">
              Onde os treinadores fantasmas se reúnem. Acompanhe os sorteios, suba no ranking de drops e fique por dentro de tudo que acontece no clã.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link href="/ranking" className="btn-ecto"><Trophy className="w-4 h-4" /> Ver ranking</Link>
              <Link href="/sorteios" className="btn-ghost"><Gift className="w-4 h-4" /> Sorteios</Link>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute w-72 h-72 rounded-full bg-spirit/20 blur-[90px]" />
            <div className="absolute w-48 h-48 rounded-full bg-ecto/20 blur-[70px] translate-x-10 translate-y-10" />
            <div className="hover-haunt specter-glow"><GhostIcon className="specter relative w-48 h-56 sm:w-60 sm:h-68 text-[#dcd3ff]" /></div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-14 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: Users, label: "Membros ativos", value: stats.members },
            { icon: Gem, label: "Drops registrados", value: stats.drops },
            { icon: Gift, label: "Sorteios abertos", value: stats.openGiveaways },
          ].map((s) => (
            <div key={s.label} className="crypt-card px-4 py-4 sm:px-6 sm:py-5 text-center sm:text-left sm:flex items-center gap-4">
              <span className="hidden sm:flex w-11 h-11 rounded-xl bg-spirit/10 border border-spirit/20 items-center justify-center"><s.icon className="w-5 h-5 text-spirit" /></span>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-bone tabular-nums">{fmtPoints(s.value)}</p>
                <p className="text-[11px] sm:text-xs uppercase tracking-widest text-bone/45 font-semibold">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
        {pinned && (
          <Link href={`/avisos#${pinned.id}`} className="block rounded-2xl border border-rose-400/30 bg-gradient-to-r from-rose-500/10 via-crypt to-crypt p-5 sm:p-6 hover:border-rose-400/50 transition-colors">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-rose-300"><Megaphone className="w-4 h-4" /> Aviso importante</p>
            <p className="font-title text-xl sm:text-2xl font-bold mt-2">{pinned.title}</p>
            <p className="text-sm text-bone/60 mt-1 line-clamp-2">{pinned.body}</p>
          </Link>
        )}

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10">
          <section>
            <SectionTitle title="Novidades" action={<Link href="/avisos" className="text-sm font-semibold text-spirit hover:text-ecto flex items-center gap-1">Ver tudo <ArrowRight className="w-4 h-4" /></Link>} />
            {latest.length ? (
              <div className="grid gap-4">{latest.map((p) => <PostCard key={p.id} post={p} />)}</div>
            ) : (
              <Empty text="Nenhuma novidade por enquanto." />
            )}
          </section>

          <div className="space-y-10">
            <section>
              <SectionTitle title="Sorteio" action={<Link href="/sorteios" className="text-sm font-semibold text-spirit hover:text-ecto flex items-center gap-1">Todos <ArrowRight className="w-4 h-4" /></Link>} />
              {openGiveaway ? <GiveawayCard giveaway={openGiveaway} canJoin={isActiveMember(viewer)} /> : <Empty text="Nenhum sorteio no momento." />}
            </section>

            <section>
              <SectionTitle title="Top 5" action={<Link href="/ranking" className="text-sm font-semibold text-spirit hover:text-ecto flex items-center gap-1">Ranking <ArrowRight className="w-4 h-4" /></Link>} />
              {season && <p className="-mt-3 mb-4 text-xs text-bone/45">{season.name}{season.ends_at ? ` · termina em ${fmtDate(season.ends_at)}` : ""}</p>}
              {ranking.length ? <RankingTable rows={ranking.slice(0, 5)} compact /> : <Empty text="Ninguém pontuou ainda nesta temporada." />}
            </section>
          </div>
        </div>

        <section className="crypt-card relative overflow-hidden p-8 sm:p-10 text-center">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-ecto/15 blur-[80px]" />
          <Gem className="relative w-9 h-9 mx-auto text-ecto" />
          <h2 className="relative font-title text-2xl sm:text-3xl font-bold mt-4">Dropou algo raro?</h2>
          <p className="relative text-bone/60 mt-2 max-w-lg mx-auto">Mande o print pelo site. A liderança confere, os pontos entram no ranking e o top 3 da temporada leva prêmio.</p>
          <Link href="/ranking#enviar" className="relative btn-ecto mt-6">Registrar drop</Link>
        </section>
      </div>
    </>
  );
}
