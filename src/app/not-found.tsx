import Link from "next/link";
import { Home } from "lucide-react";

export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <div className="pt-36 pb-16 text-center px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.webp" alt="" width={220} height={220} className="logo-float w-44 h-44 sm:w-56 sm:h-56 mx-auto grayscale-[40%] opacity-80 drop-shadow-[0_0_30px_rgba(168,85,247,0.45)]" />
      <p className="mt-6 font-title text-7xl sm:text-8xl text-spirit text-glow">404</p>
      <h1 className="font-title text-2xl sm:text-3xl mt-2">Essa página foi pro outro lado</h1>
      <p className="text-bone/50 italic mt-3 max-w-md mx-auto">O link pode estar errado ou a página foi removida. Volte para o clã antes que os fantasmas te peguem.</p>
      <Link href="/" className="btn-neon mt-8"><Home className="w-4 h-4" /> Voltar ao início</Link>
    </div>
  );
}
