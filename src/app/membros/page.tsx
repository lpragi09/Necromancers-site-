import { Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Empty, PageHeader } from "@/components/ui";
import { getMembers } from "@/lib/data";
import { ROLE_LABEL, ROLE_ORDER, type MemberRole } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Membros" };

const ROLE_STYLE: Record<MemberRole, string> = {
  lider: "text-amber-300 border-amber-400/40 bg-amber-400/10",
  vice: "text-ecto border-ecto/40 bg-ecto/10",
  veterano: "text-spirit border-spirit/40 bg-spirit/10",
  membro: "text-bone/70 border-white/15 bg-white/5",
  recruta: "text-bone/50 border-white/10 bg-white/[0.03]",
};

export default async function MembrosPage() {
  const members = await getMembers();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Users} eyebrow={`${members.length} almas no clã`} title="Membros" accent="do clã" text="A família Necromancers, da liderança aos recrutas." />
      {members.length === 0 && <Empty text="Nenhum membro aprovado ainda." />}
      <div className="space-y-12">
        {ROLE_ORDER.map((role) => {
          const list = members.filter((m) => m.role === role);
          if (!list.length) return null;
          return (
            <section key={role}>
              <h2 className="font-title text-lg font-bold uppercase tracking-[0.2em] text-bone/70 mb-4">{ROLE_LABEL[role]} <span className="text-bone/30">· {list.length}</span></h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {list.map((m) => (
                  <div key={m.id} className="crypt-card crypt-card-hover p-5 text-center">
                    <Avatar src={m.avatar_url} name={m.char_name} size={64} className="mx-auto ring-2 ring-spirit/20" />
                    <p className="mt-3 font-semibold text-bone truncate">{m.char_name}</p>
                    {m.level && <p className="text-xs text-bone/45">Level {m.level}</p>}
                    <span className={`mt-2 inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${ROLE_STYLE[m.role]}`}>{ROLE_LABEL[m.role]}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
