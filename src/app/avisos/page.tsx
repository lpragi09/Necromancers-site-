import { Megaphone } from "lucide-react";
import MembersGate from "@/components/MembersGate";
import PostCard from "@/components/PostCard";
import PageNav, { pageFrom } from "@/components/PageNav";
import { Empty, PageHeader } from "@/components/ui";
import { getPostsPage } from "@/lib/data";
import { canSeeContent, getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Avisos e novidades" };

const PAGE_SIZE = 9;

export default async function AvisosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (!canSeeContent(viewer)) return <MembersGate viewer={viewer} />;
  const page = pageFrom(params);
  const { items: posts, total } = await getPostsPage(page, PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Megaphone} eyebrow="Mural do clã" title="Avisos &" accent="novidades" text="Tudo que a liderança anunciou: regras, eventos, hunts e novidades do servidor." />
      {posts.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{posts.map((p) => <PostCard key={p.id} post={p} href={`/avisos/${p.id}`} />)}</div>
      ) : <Empty text={page > 1 ? "Não há avisos nesta página." : "O mural está vazio por enquanto."} />}
      <PageNav page={page} pageCount={pageCount} path="/avisos" params={params} />
    </div>
  );
}
