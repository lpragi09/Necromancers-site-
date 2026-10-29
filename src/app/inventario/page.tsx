import { Backpack } from "lucide-react";
import MembersGate from "@/components/MembersGate";
import InventoryView from "@/components/InventoryView";
import { PageHeader } from "@/components/ui";
import { getInventory } from "@/lib/data";
import { getViewer, isActiveMember } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meu inventário" };

export default async function InventarioPage() {
  const viewer = await getViewer();
  // Só membro aprovado tem inventário (moedas, drops, sorteios...)
  if (!isActiveMember(viewer)) return <MembersGate viewer={viewer} />;
  const inv = await getInventory(viewer.member.id, viewer.member.char_name);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Backpack} eyebrow="Tudo seu no clã" title="Meu" accent="inventário" text="Suas Evaldocoins, sorteios, torneios, dungeons e drops num lugar só." />
      <InventoryView inv={inv} />
    </div>
  );
}
