/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Clock, Megaphone, Pin, Sparkles } from "lucide-react";
import { getPost } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { POST_KIND_LABEL, type PostKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const KIND: Record<PostKind, { icon: typeof Megaphone; cls: string }> = {
  aviso: { icon: Megaphone, cls: "text-rose-300 bg-rose-500/10 border-rose-400/30" },
  novidade: { icon: Sparkles, cls: "text-spirit bg-spirit/10 border-spirit/30" },
  evento: { icon: CalendarClock, cls: "text-sky-300 bg-sky-400/10 border-sky-400/30" },
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const post = await getPost((await params).id);
  if (!post) return { title: "Aviso não encontrado" };
  const description = post.body.slice(0, 160);
  return {
    title: post.title,
    description,
    openGraph: { title: post.title, description, ...(post.image_url ? { images: [post.image_url] } : {}) },
  };
}

export default async function AvisoPage({ params }: { params: Promise<{ id: string }> }) {
  const post = await getPost((await params).id);
  if (!post) notFound();
  const k = KIND[post.kind];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28">
      <Link href="/avisos" className="inline-flex items-center gap-2 text-xs font-black italic uppercase tracking-wide text-bone/50 hover:text-spirit transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar ao mural
      </Link>

      <article className="mt-5 crypt-card overflow-hidden rise-in">
        {post.image_url && <img src={post.image_url} alt="" className="w-full aspect-[16/7] object-cover" />}
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-black italic uppercase tracking-widest ${k.cls}`}>
              <k.icon className="w-3.5 h-3.5" /> {POST_KIND_LABEL[post.kind]}
            </span>
            {post.pinned && <span className="inline-flex items-center gap-1 text-[11px] font-black italic uppercase tracking-widest text-rose-300"><Pin className="w-3.5 h-3.5" /> Fixado</span>}
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-bone/40"><Clock className="w-3.5 h-3.5" /> {fmtDateTime(post.created_at)}</span>
          </div>
          <h1 className="font-title text-3xl sm:text-4xl mt-5 leading-tight">{post.title}</h1>
          {post.kind === "evento" && post.event_at && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-sm font-bold text-sky-300">
              <CalendarClock className="w-4 h-4" /> {fmtDateTime(post.event_at)}
            </p>
          )}
          <div className="mt-6 h-px bg-gradient-to-r from-spirit/50 via-white/10 to-transparent" />
          <p className="mt-6 text-[15px] sm:text-base text-bone/80 leading-relaxed whitespace-pre-line">{post.body}</p>
        </div>
      </article>

      <div className="mt-8 text-center">
        <Link href="/avisos" className="btn-ghost"><ArrowLeft className="w-4 h-4" /> Ver todos os avisos</Link>
      </div>
    </div>
  );
}
