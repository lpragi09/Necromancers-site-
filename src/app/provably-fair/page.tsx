import ProvablyFair from "@/components/ProvablyFair";
import MembersGate from "@/components/MembersGate";
import { canSeeContent, getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sorteio comprovado" };

export default async function ProvablyFairPage({ searchParams }: { searchParams: Promise<{ id?: string; target?: string }> }) {
  const viewer = await getViewer();
  if (!canSeeContent(viewer)) return <MembersGate viewer={viewer} />;
  const { id, target } = await searchParams;
  return <ProvablyFair id={id ?? null} target={target ?? null} />;
}
