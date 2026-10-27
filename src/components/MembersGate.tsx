import Link from "next/link";
import { Clock, Lock, ShieldOff, UserPlus } from "lucide-react";
import LoginPrompt from "@/components/LoginPrompt";
import type { Viewer } from "@/lib/viewer";

/**
 * Tela de área exclusiva: aparece no lugar do conteúdo para quem não é membro aprovado.
 * Explica o próximo passo conforme a situação (sem login, sem cadastro, esperando aprovação, inativo).
 */
export default function MembersGate({ viewer, compact = false }: { viewer: Viewer | null; compact?: boolean }) {
  const status = viewer?.member?.status;
  const step = !viewer
    ? { icon: Lock, title: "Área exclusiva do clã", text: "Sorteios, ranking, avisos e membros são só para quem é do Necromancers. Entre com o Discord para continuar." }
    : !viewer.member
      ? { icon: UserPlus, title: "Falta o seu cadastro", text: "Você entrou, mas ainda não pediu entrada no clã. Cadastre o seu personagem e espere a liderança aprovar." }
      : status === "pending"
        ? { icon: Clock, title: "Pedido em análise", text: "Seu pedido de entrada está com a liderança. Assim que aprovarem, todo o conteúdo do site libera para você." }
        : { icon: ShieldOff, title: "Cadastro inativo", text: "Seu cadastro no clã está inativo. Fale com a liderança no Discord para voltar a ter acesso." };

  return (
    <div className={`max-w-xl mx-auto px-4 ${compact ? "" : "pt-36 pb-10"}`}>
      <div className="crypt-card relative overflow-hidden p-8 sm:p-10 text-center !border-spirit/40">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-spirit/25 blur-[80px]" />
        <span className="relative mx-auto w-16 h-16 rounded-2xl bg-spirit/15 border border-spirit/40 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.35)]">
          <step.icon className="w-7 h-7 text-spirit" />
        </span>
        <h1 className="relative font-title text-2xl sm:text-3xl mt-6">{step.title}</h1>
        <p className="relative text-bone/60 italic mt-3">{step.text}</p>
        <div className="relative mt-7">
          {!viewer ? (
            <LoginPrompt text="" />
          ) : !viewer.member ? (
            <Link href="/perfil" className="btn-neon"><UserPlus className="w-4 h-4" /> Cadastrar meu personagem</Link>
          ) : (
            <Link href="/perfil" className="btn-ghost">Ver meu perfil</Link>
          )}
        </div>
      </div>
    </div>
  );
}
