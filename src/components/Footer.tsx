import Link from "next/link";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/avisos", label: "Avisos" },
  { href: "/sorteios", label: "Sorteios" },
  { href: "/ranking", label: "Ranking de drops" },
  { href: "/membros", label: "Membros" },
  { href: "/loja", label: "Lojinha" },
  { href: "/perfil", label: "Meu perfil" },
  { href: "/provably-fair", label: "Provably Fair" },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-spirit bg-[#050307]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid gap-10 md:grid-cols-3 items-center">
          <Link href="/" className="flex items-center gap-3 w-fit mx-auto md:mx-0 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-160.webp" alt="" width={64} height={64} className="w-16 h-16 drop-shadow-[0_0_14px_rgba(168,85,247,0.55)] group-hover:drop-shadow-[0_0_20px_rgba(168,85,247,0.85)] transition-all" />
            <span className="font-title text-2xl bg-gradient-to-r from-[#e879f9] via-spirit to-[#818cf8] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]">Necromancers</span>
          </Link>

          <nav className="text-center md:text-left">
            <p className="font-title text-sm tracking-[0.15em] text-bone">Navegação</p>
            <ul className="mt-4 space-y-2.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex items-center gap-2.5 text-sm italic text-bone/60 hover:text-spirit transition-colors">
                    <span className="w-1 h-1 rounded-full bg-spirit" /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs italic text-bone/35">
          <p>© {new Date().getFullYear()} Necromancers. Todos os direitos reservados.</p>
          <p>Feito por <span className="font-bold text-bone/60">Luiz Ragi</span></p>
        </div>
      </div>
    </footer>
  );
}
