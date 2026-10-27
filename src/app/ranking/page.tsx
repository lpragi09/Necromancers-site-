import Link from "next/link";
import MembersGate from "@/components/MembersGate";
import { CalendarRange, Gem, ListOrdered, Trophy } from "lucide-react";
import RankingTable, { Podium } from "@/components/RankingTable";
import DropForm from "@/components/DropForm";
import MyDrops from "@/components/MyDrops";
import { Empty, PageHeader, RarityBadge, SectionTitle } from "@/components/ui";
import { getItems, getMyDrops, getRanking, getSeasons, pickSeason } from "@/lib/data";
import { canSeeContent, getViewer, isActiveMember } from "@/lib/viewer";
import { fmtDate } from "@/lib/format";
import LoginPrompt from "@/components/LoginPrompt";
import PageNav, { pageFrom, slicePage } from "@/components/PageNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ranking de drops" };

const RANK_PAGE = 20;
const ITEMS_PAGE = 10;

export default async function RankingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const temporada = typeof params.temporada === "string" ? params.temporada : undefined;
  const viewer = await getViewer();
  if (!canSeeContent(viewer)) return <MembersGate viewer={viewer} />;
  const [seasons, items] = await Promise.all([getSeasons(), getItems()]);
  const season = pickSeason(seasons, temporada);
  const activeSeason = seasons.find((s) => s.status === "active");
  const [ranking, myDrops] = await Promise.all([
    getRanking(season?.id),
    isActiveMember(viewer) ? getMyDrops(viewer.member.id, activeSeason?.id) : Promise.resolve([]),
  ]);
  // Pódio mostra os 3 primeiros; a tabela pagina do 4º em diante
  const rest = slicePage(ranking.slice(3), pageFrom(params), RANK_PAGE);
  const itemsPage = slicePage(items, pageFrom(params, "itens"), ITEMS_PAGE);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Trophy} eyebrow="Temporada valendo prêmio" title="Ranking" accent="de drops" text="Cada drop raro aprovado vale pontos. Quem somar mais até o fim da temporada leva o prêmio." />

      {seasons.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 -mt-4 mb-10">
          {seasons.map((s) => (
            <Link key={s.id} href={`/ranking?temporada=${s.id}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${s.id === season?.id ? "border-ecto/50 bg-ecto/10 text-ecto" : "border-spirit/20 text-bone/60 hover:text-bone"}`}>
              {s.name}{s.status === "active" ? " · atual" : ""}
            </Link>
          ))}
        </div>
      )}

      {!season ? (
        <Empty text="Nenhuma temporada criada ainda." />
      ) : (
        <>
          <div className="crypt-card p-5 mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-title text-xl font-bold">{season.name}</p>
              <p className="text-sm text-bone/50 flex items-center gap-2 mt-1">
                <CalendarRange className="w-4 h-4" /> {fmtDate(season.starts_at)} {season.ends_at ? `até ${fmtDate(season.ends_at)}` : "· sem data de fim"}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${season.status === "active" ? "text-ecto border-ecto/40 bg-ecto/10" : "text-bone/50 border-white/10"}`}>
              {season.status === "active" ? "Em andamento" : "Encerrada"}
            </span>
          </div>

          {ranking.length ? (
            <>
              <Podium rows={ranking} prizes={season.prizes} />
              {ranking.length > 3 && (
                <div id="tabela" className="mt-8 scroll-mt-24">
                  <RankingTable rows={rest.items} start={3 + (rest.page - 1) * RANK_PAGE} />
                  <PageNav page={rest.page} pageCount={rest.pageCount} path="/ranking" params={params} anchor="tabela" />
                </div>
              )}
            </>
          ) : (
            <Empty text="Ninguém pontuou ainda. Seja o primeiro!" />
          )}
        </>
      )}

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 mt-16">
        <section id="enviar" className="scroll-mt-24">
          <SectionTitle title="Registrar drop" icon={Gem} />
          <div className="crypt-card p-5 sm:p-6">
            {!viewer ? (
              <LoginPrompt text="Entre com o Discord para registrar seus drops." />
            ) : !isActiveMember(viewer) ? (
              <p className="text-sm text-bone/60">Só membros aprovados registram drops. <Link href="/perfil" className="text-ecto font-semibold">Complete seu cadastro</Link>.</p>
            ) : season?.status !== "active" ? (
              <p className="text-sm text-bone/60">Nenhuma temporada aberta no momento.</p>
            ) : (
              <DropForm items={items} />
            )}
          </div>
          {isActiveMember(viewer) && (
            <div className="crypt-card p-5 sm:p-6 mt-6">
              <h3 className="font-title font-bold mb-2">Meus drops</h3>
              <MyDrops drops={myDrops} seasonName={activeSeason?.name} />
            </div>
          )}
        </section>

        <section id="pontos" className="scroll-mt-24">
          <SectionTitle title="Tabela de pontos" icon={ListOrdered} />
          {items.length ? (
            <div className="crypt-card divide-y divide-spirit/10">
              {itemsPage.items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-5 py-3">
                  <Gem className="w-4 h-4 text-spirit shrink-0" />
                  <span className="flex-1 font-semibold truncate">{i.name}</span>
                  <RarityBadge rarity={i.rarity} />
                  <span className="w-16 text-right font-black text-spirit tabular-nums">{i.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Nenhum item cadastrado ainda." />
          )}
          <PageNav page={itemsPage.page} pageCount={itemsPage.pageCount} path="/ranking" params={params} param="itens" anchor="pontos" />
        </section>
      </div>
    </div>
  );
}
