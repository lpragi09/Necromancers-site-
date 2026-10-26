"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { LogOut, Menu, Shield, Skull, User, X } from "lucide-react";
import Avatar from "@/components/Avatar";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/avisos", label: "Avisos" },
  { href: "/sorteios", label: "Sorteios" },
  { href: "/ranking", label: "Ranking" },
  { href: "/membros", label: "Membros" },
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled || open ? "bg-void/85 backdrop-blur-xl border-b border-spirit/10" : "bg-transparent"}`}>
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative w-9 h-9 rounded-xl bg-tomb border border-spirit/30 flex items-center justify-center shadow-[0_0_20px_rgba(167,139,250,0.25)] group-hover:shadow-[0_0_24px_rgba(110,242,200,0.4)] transition-shadow">
            <Skull className="w-5 h-5 text-ecto" />
          </span>
          <span className="font-title text-lg font-bold tracking-[0.18em] text-bone">NECROMANCERS</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${active(l.href) ? "text-ecto bg-ecto/10" : "text-bone/70 hover:text-bone hover:bg-white/5"}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {viewer ? (
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 bg-white/5 border border-spirit/20 hover:border-spirit/40 transition-colors">
                <Avatar src={viewer.image} name={viewer.charName ?? viewer.name} size={30} />
                <span className="hidden sm:block text-sm font-semibold max-w-32 truncate">{viewer.charName ?? viewer.name}</span>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 crypt-card p-1.5 animate-scale-up">
                  <Link href="/perfil" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5"><User className="w-4 h-4 text-spirit" /> Meu perfil</Link>
                  {viewer.isAdmin && (
                    <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5"><Shield className="w-4 h-4 text-ecto" /> Painel da liderança</Link>
                  )}
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-white/5 text-bone/70"><LogOut className="w-4 h-4" /> Sair</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => signIn("discord")} className="btn-ghost !py-2 !px-3.5">
              <DiscordIcon className="w-4 h-4" /> <span className="hidden sm:inline">Entrar</span>
            </button>
          )}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-bone/80 hover:bg-white/5" aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-spirit/10 px-4 py-3 grid gap-1 animate-fade-in">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-2.5 rounded-lg text-sm font-semibold ${active(l.href) ? "text-ecto bg-ecto/10" : "text-bone/80"}`}>
              {l.label}
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
