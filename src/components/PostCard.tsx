/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, CalendarClock, Megaphone, Pin, Sparkles } from "lucide-react";
import { POST_KIND_LABEL, type Post, type PostKind } from "@/lib/types";
import { fmtDateTime, timeAgo } from "@/lib/format";

const KIND_STYLE: Record<PostKind, { icon: typeof Megaphone; cls: string }> = {
  aviso: { icon: Megaphone, cls: "text-rose-300 bg-rose-500/10 border-rose-400/30" },
  novidade: { icon: Sparkles, cls: "text-spirit bg-spirit/10 border-spirit/30" },
  evento: { icon: CalendarClock, cls: "text-sky-300 bg-sky-400/10 border-sky-400/30" },
};

/** Card de aviso. Com `href`, o card inteiro vira link para o aviso completo. */
export default function PostCard({ post, full = false, href }: { post: Post; full?: boolean; href?: string }) {
  const k = KIND_STYLE[post.kind];
  const Icon = k.icon;
  const body = (
    <>
      {post.image_url && (
        <div className="overflow-hidden">
          <img src={post.image_url} alt="" className={`w-full aspect-[16/7] object-cover ${href ? "group-hover:scale-[1.03] transition-transform duration-500" : ""}`} />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-black italic uppercase tracking-widest ${k.cls}`}>
            <Icon className="w-3 h-3" /> {POST_KIND_LABEL[post.kind]}
          </span>
          {post.pinned && <span className="inline-flex items-center gap-1 text-[10px] font-black italic uppercase tracking-widest text-rose-300"><Pin className="w-3 h-3" /> Fixado</span>}
          <span className="ml-auto text-xs text-bone/40">{timeAgo(post.created_at)}</span>
        </div>
        <h3 className="font-title text-lg mt-3 text-bone leading-snug">{post.title}</h3>
        {post.kind === "evento" && post.event_at && (
          <p className="mt-1 text-sm font-semibold text-sky-300 flex items-center gap-1.5"><CalendarClock className="w-4 h-4" /> {fmtDateTime(post.event_at)}</p>
        )}
        <p className={`mt-2 text-sm text-bone/65 leading-relaxed whitespace-pre-line ${full ? "" : "line-clamp-3"}`}>{post.body}</p>
        {href && (
          <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-black italic uppercase tracking-wide text-spirit group-hover:text-white transition-colors">
            Ler aviso completo <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </div>
    </>
  );
  const cls = `w-full crypt-card crypt-card-hover overflow-hidden flex flex-col scroll-mt-24 ${post.pinned ? "!border-rose-400/30" : ""}`;
  return href ? (
    <Link id={post.id} href={href} className={`group ${cls}`}>{body}</Link>
  ) : (
    <article id={post.id} className={cls}>{body}</article>
  );
}
