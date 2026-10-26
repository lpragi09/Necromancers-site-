/* eslint-disable @next/next/no-img-element */
import { CalendarClock, Megaphone, Pin, Sparkles } from "lucide-react";
import { POST_KIND_LABEL, type Post, type PostKind } from "@/lib/types";
import { fmtDateTime, timeAgo } from "@/lib/format";

const KIND_STYLE: Record<PostKind, { icon: typeof Megaphone; cls: string }> = {
  aviso: { icon: Megaphone, cls: "text-rose-300 bg-rose-500/10 border-rose-400/30" },
  novidade: { icon: Sparkles, cls: "text-ecto bg-ecto/10 border-ecto/30" },
  evento: { icon: CalendarClock, cls: "text-spirit bg-spirit/10 border-spirit/30" },
};

export default function PostCard({ post, full = false }: { post: Post; full?: boolean }) {
  const k = KIND_STYLE[post.kind];
  const Icon = k.icon;
  return (
    <article id={post.id} className={`crypt-card crypt-card-hover overflow-hidden flex flex-col scroll-mt-24 ${post.pinned ? "!border-rose-400/30" : ""}`}>
      {post.image_url && <img src={post.image_url} alt="" className="w-full aspect-[16/7] object-cover opacity-90" />}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${k.cls}`}>
            <Icon className="w-3 h-3" /> {POST_KIND_LABEL[post.kind]}
          </span>
          {post.pinned && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose-300"><Pin className="w-3 h-3" /> Fixado</span>}
          <span className="ml-auto text-xs text-bone/40">{timeAgo(post.created_at)}</span>
        </div>
        <h3 className="font-title text-lg font-bold mt-3 text-bone leading-snug">{post.title}</h3>
        {post.kind === "evento" && post.event_at && (
          <p className="mt-1 text-sm font-semibold text-spirit flex items-center gap-1.5"><CalendarClock className="w-4 h-4" /> {fmtDateTime(post.event_at)}</p>
        )}
        <p className={`mt-2 text-sm text-bone/65 leading-relaxed whitespace-pre-line ${full ? "" : "line-clamp-3"}`}>{post.body}</p>
      </div>
    </article>
  );
}
