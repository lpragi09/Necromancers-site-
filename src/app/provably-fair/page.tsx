import ProvablyFair from "@/components/ProvablyFair";

export const metadata = { title: "Sorteio comprovado" };

export default async function ProvablyFairPage({ searchParams }: { searchParams: Promise<{ id?: string; target?: string }> }) {
  const { id, target } = await searchParams;
  return <ProvablyFair id={id ?? null} target={target ?? null} />;
}
