import Link from "next/link";
import { ArrowRight, Backpack, Clock, ShieldCheck, User } from "lucide-react";
import Avatar from "@/components/Avatar";
import ProfileForm from "@/components/ProfileForm";
import LoginPrompt from "@/components/LoginPrompt";
import { PageHeader } from "@/components/ui";
import { getViewer } from "@/lib/viewer";
import { ROLE_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const viewer = await getViewer();
  const member = viewer?.member ?? null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <PageHeader icon={User} eyebrow="Sua alma no clã" title="Meu" accent="perfil" />
      {!viewer ? (
        <div className="crypt-card p-6"><LoginPrompt text="Entre com o Discord para ver seu perfil e pedir entrada no clã." /></div>
      ) : (
        <div className="space-y-6">
          <div className="crypt-card p-6 flex items-center gap-4">
            <Avatar src={viewer.image} name={member?.char_name ?? viewer.name} size={64} className="ring-2 ring-spirit/30" />
            <div className="min-w-0 flex-1">
              <p className="font-title text-xl font-bold truncate">{member?.char_name ?? viewer.name}</p>
              <p className="text-sm text-bone/45">Discord: {viewer.name}</p>
            </div>
            {member?.status === "active" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-spirit/40 bg-spirit/10 text-spirit text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> {ROLE_LABEL[member.role]}
              </span>
            )}
          </div>

          {member?.status === "pending" && (
            <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" /> Seu pedido de entrada está esperando a liderança aprovar.
            </p>
          )}
          {member?.status === "inactive" && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">Seu cadastro está inativo. Fale com a liderança no Discord.</p>
          )}

          <div className="crypt-card p-6">
            <h2 className="font-title font-bold mb-1">{member ? "Personagem" : "Entrar no clã"}</h2>
            {!member && <p className="text-sm text-bone/55 mb-4">Informe seu personagem. A liderança aprova e você passa a participar dos sorteios e do ranking.</p>}
            <div className={member ? "mt-4" : ""}>
              <ProfileForm charName={member?.char_name ?? ""} level={member?.level ?? null} isNew={!member} />
            </div>
          </div>

          {member?.status === "active" && (
            <Link href="/inventario" className="crypt-card crypt-card-hover p-5 flex items-center gap-4 group">
              <span className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center bg-spirit/10 border border-spirit/30 text-spirit"><Backpack className="w-5 h-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-title">Meu inventário</span>
                <span className="block text-sm text-bone/50">Evaldocoins, sorteios, torneios, dungeons e seus drops.</span>
              </span>
              <ArrowRight className="w-5 h-5 text-spirit group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
