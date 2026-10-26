import Link from "next/link";
import GhostIcon from "@/components/GhostIcon";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-spirit/15 bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <GhostIcon className="w-6 h-7 text-spirit" />
          <div>
            <p className="font-title text-base bg-gradient-to-r from-[#e879f9] via-spirit to-[#818cf8] bg-clip-text text-transparent w-fit">Necromancers</p>
            <p className="text-xs italic text-bone/40">Do além, para o topo do servidor.</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-black italic uppercase tracking-wide text-bone/50">
          <Link href="/avisos" className="hover:text-spirit transition-colors">Avisos</Link>
          <Link href="/sorteios" className="hover:text-spirit transition-colors">Sorteios</Link>
          <Link href="/ranking" className="hover:text-spirit transition-colors">Ranking</Link>
          <Link href="/membros" className="hover:text-spirit transition-colors">Membros</Link>
          <Link href="/provably-fair" className="hover:text-spirit transition-colors">Sorteio comprovado</Link>
        </div>
      </div>
    </footer>
  );
}
