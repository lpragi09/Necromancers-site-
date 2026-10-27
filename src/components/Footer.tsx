import Link from "next/link";

// Três colunas curtas por assunto, em vez de uma fila comprida
const GROUPS = [
  {
    title: "Clã",
    links: [
      { href: "/", label: "Início" },
      { href: "/avisos", label: "Avisos" },
      { href: "/membros", label: "Membros" },
      { href: "/perfil", label: "Meu perfil" },
      { href: "/inventario", label: "Meu inventário" },
    ],
  },
  {
    title: "Eventos",
    links: [
      { href: "/sorteios", label: "Sorteios" },
      { href: "/torneios", label: "Torneios" },
      { href: "/dungeons", label: "Dungeons" },
    ],
  },
  {
    title: "Recompensas",
    links: [
      { href: "/loja", label: "Lojinha" },
      { href: "/ranking", label: "Ranking de drops" },
      { href: "/provably-fair", label: "Provably Fair" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-spirit bg-[#050307]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:items-start">
          <div className="text-center md:text-left">
            <Link href="/" className="inline-flex items-center gap-3 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-160.webp" alt="" width={56} height={56} className="w-14 h-14 drop-shadow-[0_0_14px_rgba(168,85,247,0.55)] group-hover:drop-shadow-[0_0_20px_rgba(168,85,247,0.85)] transition-all" />
              <span className="font-title text-2xl bg-gradient-to-r from-[#e879f9] via-spirit to-[#818cf8] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]">Necromancers</span>
            </Link>
            <p className="mt-4 max-w-xs mx-auto md:mx-0 text-sm italic text-bone/45 leading-relaxed">
              Portal oficial do clã. Avisos, eventos e recompensas num lugar só.
            </p>
          </div>

          <nav className="grid grid-cols-3 gap-4 sm:gap-8">
            {GROUPS.map((g) => (
              <div key={g.title}>
                <p className="font-title text-xs sm:text-sm tracking-[0.15em] text-bone">{g.title}</p>
                <span className="block mt-2 w-6 h-0.5 rounded-full bg-spirit" />
                <ul className="mt-4 space-y-2">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-xs sm:text-sm italic text-bone/55 hover:text-spirit transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs italic text-bone/35">
          <p>© {new Date().getFullYear()} Necromancers. Todos os direitos reservados.</p>
          <p>Feito por <span className="font-bold text-bone/60">Luiz Ragi</span></p>
        </div>
      </div>
    </footer>
  );
}
