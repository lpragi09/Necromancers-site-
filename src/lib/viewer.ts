import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMIN_ROLES, isAdminId } from "@/lib/admins";
import { hasSupabase, supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Member } from "@/lib/types";

export const MEMBER_COLUMNS = "id, discord_id, discord_name, avatar_url, char_name, level, role, status, created_at";

export interface Viewer {
  discordId: string;
  name: string;
  image: string | null;
  member: Member | null;
  isAdmin: boolean;
}

/** Quem está fazendo a requisição (sessão do Discord + cadastro no clã), ou null. */
export async function getViewer(): Promise<Viewer | null> {
  // Sem NEXTAUTH_SECRET o NextAuth lança erro em produção e derrubaria todas as páginas:
  // o site segue funcionando, só sem login, até a variável ser configurada.
  if (!process.env.NEXTAUTH_SECRET) return null;
  const session = await getServerSession(authOptions).catch(() => null);
  const discordId = session?.user?.discordId;
  if (!discordId) return null;

  let member: Member | null = null;
  if (hasSupabase()) {
    const { data } = await supabaseAdmin.from("members").select(MEMBER_COLUMNS).eq("discord_id", discordId).maybeSingle();
    member = (data as Member | null) ?? null;
    // Mantém a foto do Discord em dia: se a pessoa trocou de foto, atualiza o cadastro (só grava quando mudou)
    const image = session.user.image ?? null;
    if (member && image && member.avatar_url !== image) {
      member = { ...member, avatar_url: image };
      await supabaseAdmin.from("members").update({ avatar_url: image }).eq("id", member.id);
    }
  }
  const isAdmin = isAdminId(discordId) || (member?.status === "active" && ADMIN_ROLES.includes(member.role));
  return { discordId, name: session.user.name ?? "", image: session.user.image ?? null, member, isAdmin };
}

/** Membro ativo pode se inscrever em sorteio e enviar drop. */
export const isActiveMember = (v: Viewer | null): v is Viewer & { member: Member } => v?.member?.status === "active";

/**
 * Conteúdo do site (sorteios, ranking, avisos, membros) é só para membro aprovado ou admin: o clã rival não vê nada.
 * No modo demonstração (sem Supabase, só local) libera, porque ali só existem dados de exemplo.
 */
export const canSeeContent = (v: Viewer | null): boolean => !hasSupabase() || isActiveMember(v) || !!v?.isAdmin;
