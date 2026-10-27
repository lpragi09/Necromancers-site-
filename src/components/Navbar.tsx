"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { Gift, Home, LogOut, Megaphone, Menu, Shield, Store, Trophy, User, Users, X } from "lucide-react";
import Avatar from "@/components/Avatar";

const LINKS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/avisos", label: "Avisos", icon: Megaphone },
  { href: "/sorteios", label: "Sorteios", icon: Gift },
  { href: "/loja", label: "Loja", icon: Store },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/membros", label: "Membros", icon: Users },
];

export interface NavViewer {
  name: string;
  image: string | null;
  charName: string | null;
  isAdmin: boolean;
}

export default function Navbar({ viewer }: { viewer: NavViewer | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);
  // Menu do avatar fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menu]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/85 backdrop-blur-xl border-b border-spirit/20">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-160.webp" alt="" width={44} height={44} className="w-11 h-11 drop-shadow-[0_0_10px_rgba(168,85,247,0.55)] group-hover:drop-shadow-[0_0_16px_rgba(168,85,247,0.85)] group-hover:rotate-[-6deg] transition-all duration-300" />
          <span className="font-title text-lg bg-gradient-to-r from-[#e879f9] via-spirit to-[#818cf8] bg-clip-text text-transparent">Necromancers</span>
        </Link>

        <div className="hidden xl:flex items-center">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} data-active={active(l.href)}
              className={`hover-underline flex items-center gap-1.5 px-3 py-2 text-[13px] font-black italic uppercase tracking-wide transition-colors ${active(l.href) ? "text-bone" : "text-bone/60 hover:text-bone"}`}>
              <l.icon className={`w-3.5 h-3.5 ${active(l.href) ? "text-spirit" : ""}`} /> {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {viewer?.isAdmin && (
            <Link href="/admin" data-active={active("/admin")}
              className={`hover-underline hidden xl:flex items-center gap-1.5 px-3 py-2 text-[13px] font-black italic uppercase tracking-wide transition-colors ${active("/admin") ? "text-bone" : "text-bone/60 hover:text-bone"}`}>
              <Shield className="w-3.5 h-3.5 text-spirit" /> Painel
            </Link>
          )}
          <span className="hidden xl:block w-px h-7 bg-white/10" />
          {viewer ? (
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 bg-white/5 border border-white/10 hover:border-spirit/50 transition-colors">
                <Avatar src={viewer.image} name={viewer.charName ?? viewer.name} size={30} className="ring-2 ring-spirit/50" />
                <span className="hidden sm:block text-sm font-black italic uppercase max-w-32 truncate">{viewer.charName ?? viewer.name}</span>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 crypt-card p-1.5 animate-scale-up">
                  <Link href="/perfil" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold hover:bg-white/5"><User className="w-4 h-4 text-spirit" /> Meu perfil</Link>
                  {viewer.isAdmin && (
                    <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold hover:bg-white/5"><Shield className="w-4 h-4 text-spirit" /> Painel da liderança</Link>
                  )}
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-left hover:bg-white/5 text-bone/60"><LogOut className="w-4 h-4" /> Sair</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => signIn("discord")} className="btn-neon !py-2 !px-4">
              <DiscordIcon className="w-4 h-4" /> Entrar
            </button>
          )}
          <button onClick={() => setOpen(!open)} className="xl:hidden p-2 rounded-lg text-bone/80 hover:bg-white/5" aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="xl:hidden border-t border-white/5 px-4 py-3 grid gap-1 animate-fade-in">
          {[...LINKS, ...(viewer?.isAdmin ? [{ href: "/admin", label: "Painel", icon: Shield }] : [])].map((l) => (
            <Link key={l.href} href={l.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-black italic uppercase ${active(l.href) ? "text-bone bg-spirit/15" : "text-bone/85 hover:bg-white/5"}`}>
              <l.icon className="w-4 h-4 text-spirit" /> {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export function DiscordIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.4C.6 9 -.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2a12.8 12.8 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
    </svg>
  );
}
