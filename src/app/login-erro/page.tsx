import Link from "next/link";
import { Clock, Home, ShieldAlert } from "lucide-react";
import LoginPrompt from "@/components/LoginPrompt";

export const metadata = { title: "Não foi possível entrar", robots: { index: false } };

// Página de erro do login (configurada em lib/auth.ts). "AccessDenied" é o limite de contas por conexão.
export default async function LoginErroPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const limited = error === "AccessDenied";
  const Icon = limited ? Clock : ShieldAlert;

  return (
    <div className="max-w-xl mx-auto px-4 pt-36 pb-10">
      <div className="crypt-card relative overflow-hidden p-8 sm:p-10 text-center !border-spirit/40">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-spirit/25 blur-[80px]" />
        <span className="relative mx-auto w-16 h-16 rounded-2xl bg-spirit/15 border border-spirit/40 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.35)]">
          <Icon className="w-7 h-7 text-spirit" />
        </span>
        <h1 className="relative font-title text-2xl sm:text-3xl mt-6">{limited ? "Calma, fantasma!" : "Não foi possível entrar"}</h1>
        <p className="relative text-bone/60 italic mt-3">
          {limited
            ? "Muitas contas diferentes entraram por esta conexão nos últimos minutos. Por segurança, espere 15 minutos e tente de novo."
            : "Algo deu errado no login com o Discord. Tente de novo; se continuar, fale com a liderança."}
        </p>
        <div className="relative mt-7 flex flex-wrap justify-center gap-3">
          {!limited && <LoginPrompt text="" />}
          <Link href="/" className="btn-ghost"><Home className="w-4 h-4" /> Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}
