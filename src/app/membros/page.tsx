import { Crown, Shield, Skull, Sparkles, Star, Users } from "lucide-react";
import MembersGate from "@/components/MembersGate";
import Avatar from "@/components/Avatar";
import { Empty, PageHeader } from "@/components/ui";
import PageNav, { pageFrom, slicePage } from "@/components/PageNav";
import { getMembers } from "@/lib/data";
import { ROLE_LABEL, ROLE_ORDER, type MemberRole } from "@/lib/types";
import { canSeeContent, getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Membros" };

// Cada cargo com a sua cor: anel do avatar, brilho no hover e o selo
const ROLE_STYLE: Record<MemberRole, { icon: typeof Crown; badge: string; ring: string; glow: string; text: string }> = {
  lider: { icon: Crown, badge: "text-amber-300 border-amber-400/40 bg-amber-400/10", ring: "ring-amber-300/70", glow: "hover:shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:!border-amber-300/50", text: "text-amber-300" },
  vice: { icon: Shield, badge: "text-spirit border-spirit/40 bg-spirit/10", ring: "ring-spirit/70", glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]", text: "text-spirit" },
  veterano: { icon: Star, badge: "text-sky-300 border-sky-400/40 bg-sky-400/10", ring: "ring-sky-300/50", glow: "hover:shadow-[0_0_30px_rgba(56,189,248,0.18)] hover:!border-sky-300/50", text: "text-sky-300" },
  membro: { icon: Skull, badge: "text-bone/70 border-white/15 bg-white/5", ring: "ring-white/15", glow: "", text: "text-bone/70" },
  recruta: { icon: Sparkles, badge: "text-bone/50 border-white/10 bg-white/[0.03]", ring: "ring-white/10", glow: "", text: "text-bone/50" },
};

const PAGE_SIZE = 30;

export default async function MembrosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (!canSeeContent(viewer)) return <MembersGate viewer={viewer} />;
  const members = await getMembers();
  // Ordem: cargo, depois level. Pagina a lista inteira e agrupa por cargo só o que caiu na página.
  const sorted = [...members].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || (b.level ?? 0) - (a.level ?? 0));
  const pageData = slicePage(sorted, pageFrom(params), PAGE_SIZE);
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Users} eyebrow={`${members.length} almas no clã`} title="Membros" accent="do clã" text="A família Necromancers, da liderança aos recrutas." />
      {members.length === 0 && <Empty text="Nenhum membro aprovado ainda." />}
      <div className="space-y-14">
        {ROLE_ORDER.map((role) => {
          const list = pageData.items.filter((m) => m.role === role);
          const roleTotal = members.filter((m) => m.role === role).length;
          if (!list.length) return null;
          const st = ROLE_STYLE[role];
          return (
            <section key={role}>
              <div className="flex items-center gap-3 mb-5">
                <st.icon className={`w-5 h-5 ${st.text}`} />
                <h2 className="font-title text-xl sm:text-2xl">{ROLE_LABEL[role]}</h2>
                <span className="text-sm font-black italic text-bone/30">{roleTotal}</span>
                <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {list.map((m) => (
                  <div key={m.id} className={`crypt-card crypt-card-hover p-5 text-center ${st.glow}`}>
                    <Avatar src={m.avatar_url} name={m.char_name} size={72} className={`mx-auto ring-2 ring-offset-4 ring-offset-black ${st.ring}`} />
                    <p className="mt-4 font-black italic text-bone truncate">{m.char_name}</p>
                    {m.level ? <p className="text-xs text-bone/45 tabular-nums">Level {m.level}</p> : <p className="text-xs text-bone/25">&nbsp;</p>}
                    <span className={`mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-black italic uppercase tracking-widest ${st.badge}`}>
                      <st.icon className="w-3 h-3" /> {ROLE_LABEL[m.role]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <PageNav page={pageData.page} pageCount={pageData.pageCount} path="/membros" params={params} />
    </div>
  );
}
