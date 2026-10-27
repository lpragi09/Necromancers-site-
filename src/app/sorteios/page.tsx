import Link from "next/link";
import MembersGate from "@/components/MembersGate";
import { Flame, Gift, ShieldCheck, Trophy } from "lucide-react";
import GiveawayCard from "@/components/GiveawayCard";
import PageNav, { pageFrom } from "@/components/PageNav";
import { Empty, PageHeader, SectionTitle } from "@/components/ui";
import { getGiveawaysPage } from "@/lib/data";
import { canSeeContent, getViewer, isActiveMember } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sorteios" };

const PAGE_SIZE = 9;

export default async function SorteiosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (!canSeeContent(viewer)) return <MembersGate viewer={viewer} />;
  const memberId = viewer?.member?.id;
  // Cada lista tem a sua página: ?pagina= (em andamento) e ?sorteados= (já sorteados)
  const page = pageFrom(params);
  const pastPage = pageFrom(params, "sorteados");
  const [current, past] = await Promise.all([
    getGiveawaysPage("active", page, PAGE_SIZE, memberId),
    getGiveawaysPage("drawn", pastPage, PAGE_SIZE, memberId),
  ]);
  const canJoin = isActiveMember(viewer);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Gift} eyebrow="Provably fair" title="Sorteios" accent="do clã" text="Uma chance por membro ativo. O ganhador sai de um número público que ninguém conhece antes, nem a liderança." />

      <div className="crypt-card p-4 sm:p-5 mb-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-center sm:text-left">
        <ShieldCheck className="w-8 h-8 text-spirit shrink-0" />
        <p className="text-sm text-bone/65 flex-1">Todo sorteio é <b className="text-bone">provably fair</b>: a lista de inscritos é congelada antes do número aleatório existir, e qualquer um pode refazer a conta.</p>
        <Link href="/provably-fair" className="btn-ghost shrink-0">Como funciona</Link>
      </div>

      <section id="andamento" className="scroll-mt-24">
        <SectionTitle title="Em andamento" icon={Flame} />
        {current.items.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{current.items.map((g) => <GiveawayCard key={g.id} giveaway={g} canJoin={canJoin} />)}</div>
        ) : (
          <Empty text="Nenhum sorteio aberto agora. Fique de olho nos avisos!" />
        )}
        <PageNav page={page} pageCount={Math.ceil(current.total / PAGE_SIZE)} path="/sorteios" params={params} />
      </section>

      {past.total > 0 && (
        <section id="sorteados" className="mt-16 scroll-mt-24">
          <SectionTitle title="Já sorteados" icon={Trophy} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{past.items.map((g) => <GiveawayCard key={g.id} giveaway={g} canJoin={false} />)}</div>
          <PageNav page={pastPage} pageCount={Math.ceil(past.total / PAGE_SIZE)} path="/sorteios" params={params} param="sorteados" />
        </section>
      )}
    </div>
  );
}
