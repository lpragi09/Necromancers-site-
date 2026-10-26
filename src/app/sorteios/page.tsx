import Link from "next/link";
import { Flame, Gift, ShieldCheck, Trophy } from "lucide-react";
import GiveawayCard from "@/components/GiveawayCard";
import { Empty, PageHeader, SectionTitle } from "@/components/ui";
import { getGiveaways } from "@/lib/data";
import { getViewer, isActiveMember } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sorteios" };

export default async function SorteiosPage() {
  const viewer = await getViewer();
  const giveaways = await getGiveaways(viewer?.member?.id);
  const current = giveaways.filter((g) => g.status !== "drawn");
  const past = giveaways.filter((g) => g.status === "drawn");
  const canJoin = isActiveMember(viewer);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Gift} eyebrow="Provably fair" title="Sorteios" accent="do clã" text="Uma chance por membro ativo. O ganhador sai de um número público que ninguém conhece antes, nem a liderança." />

      <div className="crypt-card p-4 sm:p-5 mb-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-center sm:text-left">
        <ShieldCheck className="w-8 h-8 text-ecto shrink-0" />
        <p className="text-sm text-bone/65 flex-1">Todo sorteio é <b className="text-bone">provably fair</b>: a lista de inscritos é congelada antes do número aleatório existir, e qualquer um pode refazer a conta.</p>
        <Link href="/provably-fair" className="btn-ghost shrink-0">Como funciona</Link>
      </div>

      <SectionTitle title="Em andamento" icon={Flame} />
      {current.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{current.map((g) => <GiveawayCard key={g.id} giveaway={g} canJoin={canJoin} />)}</div>
      ) : (
        <Empty text="Nenhum sorteio aberto agora. Fique de olho nos avisos!" />
      )}

      {past.length > 0 && (
        <div className="mt-16">
          <SectionTitle title="Já sorteados" icon={Trophy} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{past.map((g) => <GiveawayCard key={g.id} giveaway={g} canJoin={false} />)}</div>
        </div>
      )}
    </div>
  );
}
