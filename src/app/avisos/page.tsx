import { Megaphone } from "lucide-react";
import PostCard from "@/components/PostCard";
import { Empty, PageHeader } from "@/components/ui";
import { getPosts } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Avisos e novidades" };

export default async function AvisosPage() {
  const posts = await getPosts(100);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Megaphone} eyebrow="Mural do clã" title="Avisos &" accent="novidades" text="Tudo que a liderança anunciou: regras, eventos, hunts e novidades do servidor." />
      {posts.length ? <div className="grid gap-5">{posts.map((p) => <PostCard key={p.id} post={p} full />)}</div> : <Empty text="O mural está vazio por enquanto." />}
    </div>
  );
}
