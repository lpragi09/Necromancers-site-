"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Megaphone, X } from "lucide-react";
import { DiscordIcon } from "@/components/Navbar";
import type { Post } from "@/lib/types";

// Só o primeiro parágrafo, curtinho: o aviso completo fica na página dele
const shortText = (body: string) => {
  const first = body.split(/\n\s*\n/)[0]?.trim() ?? "";
  return first.length > 220 ? `${first.slice(0, 220).trimEnd()}…` : first;
};

/** Popup de destaque: aparece toda vez que alguém entra ou recarrega o site. */
export default function AnnouncementPopup({ post, isMember }: { post: Post; isMember: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Não atrapalha o painel, nem a página do próprio aviso
  if (!open || pathname?.startsWith("/admin") || pathname === `/avisos/${post.id}`) return null;

  return (
    <div onClick={() => setOpen(false)} className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="popup-title"
        className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border border-spirit/40 bg-[#0b0910] shadow-[0_0_60px_rgba(168,85,247,0.25)] animate-scale-up">
        <button onClick={() => setOpen(false)} aria-label="Fechar" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/15 flex items-center justify-center text-bone/80 hover:text-white hover:border-spirit/60 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {post.image_url ? (
          <img src={post.image_url} alt="" className="w-full aspect-[16/7] object-cover" />
        ) : (
          <div className="w-full aspect-[16/9] bg-gradient-to-br from-[#2a0f4a] to-black flex items-center justify-center">
            <img src="/logo-160.webp" alt="" className="w-28 h-28 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
          </div>
        )}

        <div className="p-6 sm:p-7">
          <p className="flex items-center gap-1.5 text-[10px] font-black italic uppercase tracking-[0.25em] text-spirit"><Megaphone className="w-3.5 h-3.5" /> Aviso do clã</p>
          <h2 id="popup-title" className="font-title text-3xl mt-2 leading-tight">{post.title}</h2>
          <p className="mt-3 text-sm italic text-bone/65 leading-relaxed">{shortText(post.body)}</p>

          <div className="mt-6">
            {isMember ? (
              <Link href={`/avisos/${post.id}`} onClick={() => setOpen(false)} className="btn-neon w-full">Ver aviso completo <ArrowRight className="w-4 h-4" /></Link>
            ) : (
              <button onClick={() => signIn("discord")} className="btn-neon w-full"><DiscordIcon className="w-4 h-4" /> Entrar com Discord</button>
            )}
            <button onClick={() => setOpen(false)} className="mt-2 w-full py-2 text-[11px] font-black italic uppercase tracking-widest text-bone/40 hover:text-bone/70">Fechar</button>
          </div>

          <p className="mt-4 pt-4 border-t border-white/5 text-center text-[11px] italic text-bone/40">
            Produzido por <b className="not-italic text-bone/70">Luiz Ragi</b> com muito carinho para a comunidade da <b className="not-italic text-spirit">Necromancers</b> 💜
          </p>
        </div>
      </div>
    </div>
  );
}
