import Link from "next/link";
import { Skull } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-spirit/10 bg-void/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Skull className="w-5 h-5 text-ecto" />
          <div>
            <p className="font-title tracking-[0.2em] text-sm text-bone">NECROMANCERS</p>
            <p className="text-xs text-bone/40">Do além, para o topo do servidor.</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-bone/50">
          <Link href="/avisos" className="hover:text-ecto">Avisos</Link>
          <Link href="/sorteios" className="hover:text-ecto">Sorteios</Link>
          <Link href="/ranking" className="hover:text-ecto">Ranking</Link>
          <Link href="/membros" className="hover:text-ecto">Membros</Link>
          <Link href="/provably-fair" className="hover:text-ecto">Sorteio comprovado</Link>
        </div>
      </div>
    </footer>
  );
}
