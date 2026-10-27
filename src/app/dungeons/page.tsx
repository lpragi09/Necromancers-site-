/* eslint-disable @next/next/no-img-element */
import { Clock, Crown, Mountain, Plus, StickyNote, Users } from "lucide-react";
import MembersGate from "@/components/MembersGate";
import Avatar from "@/components/Avatar";
import PageNav, { pageFrom } from "@/components/PageNav";
import { DungeonForm, RunButton } from "@/components/Dungeons";
import { Empty, PageHeader, SectionTitle } from "@/components/ui";
import { getDungeonRuns, getDungeons } from "@/lib/data";
import { canSeeContent, getViewer, isActiveMember } from "@/lib/viewer";
import type { DungeonRun } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dungeons" };

const PAGE_SIZE = 9;
const TZ = "America/Sao_Paulo";

// "Hoje · 21:00", "Amanhã · 14:30" ou "sáb., 01/11 · 21:00" (sempre no horário de Brasília)
function whenLabel(iso: string) {
  const d = new Date(iso);
  const day = (x: Date) => x.toLocaleDateString("pt-BR", { timeZone: TZ });
  const time = d.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  if (day(d) === day(new Date())) return `Hoje · ${time}`;
  if (day(d) === day(new Date(Date.now() + 86_400_000))) return `Amanhã · ${time}`;
  return `${d.toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" })} · ${time}`;
}

// "em 3h", "em 25 min", "começou há 10 min"
function relative(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.round(Math.abs(diff) / 60_000);
  const text = mins < 60 ? `${mins} min` : mins < 48 * 60 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)} dias`;
  return diff >= 0 ? `em ${text}` : `começou há ${text}`;
}

function RunCard({ run, image, me, canAct, isAdmin }: { run: DungeonRun; image: string | null; me: string | null; canAct: boolean; isAdmin: boolean }) {
  const filled = run.players.length;
  const full = filled >= run.slots;
  const joined = !!me && run.players.some((p) => p.member_id === me);
  const mine = run.creator_id === me;
  const started = new Date(run.starts_at).getTime() < Date.now();
  const seats = Array.from({ length: run.slots }, (_, i) => run.players[i] ?? null);

  return (
    <div className={`crypt-card crypt-card-hover flex flex-col overflow-hidden ${joined ? "!border-spirit/50" : ""}`}>
      <div className="relative px-5 pt-5 pb-4 min-h-[136px] overflow-hidden bg-gradient-to-br from-[#2a0f4a]/70 via-transparent to-transparent">
        {/* Boss da dungeon do lado direito, sumindo para a esquerda */}
        {image && <img src={image} alt="" className="absolute right-0 top-0 h-full w-[58%] object-cover [mask-image:linear-gradient(to_right,transparent,black_40%)]" />}
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 max-w-[62%]">
            <p className="flex items-center gap-1.5 text-[10px] font-black italic uppercase tracking-[0.25em] text-spirit"><Mountain className="w-3.5 h-3.5" /> Dungeon</p>
            <h3 className="font-title text-xl mt-1 leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{run.dungeon_name}</h3>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-md border backdrop-blur text-[10px] font-black italic uppercase tracking-widest ${full ? "text-rose-200 bg-rose-500/20 border-rose-400/40" : "text-emerald-200 bg-emerald-500/15 border-emerald-400/40"}`}>
            {full ? "Lotado" : `${run.slots - filled} ${run.slots - filled === 1 ? "vaga" : "vagas"}`}
          </span>
        </div>
        <p className="relative mt-3 flex flex-wrap items-center gap-x-2 font-black italic text-bone drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          <Clock className="w-4 h-4 text-spirit" /> {whenLabel(run.starts_at)}
          <span className={`text-xs font-bold not-italic ${started ? "text-amber-300" : "text-bone/45"}`}>· {relative(run.starts_at)}</span>
        </p>
      </div>

      <div className="px-5 pb-5 flex-1 flex flex-col">
        {/* Vagas: ocupadas com a foto, livres tracejadas */}
        <div className="flex items-center gap-2.5">
          {seats.map((p, i) =>
            p ? (
              <div key={p.member_id} className="relative" title={p.char_name}>
                <Avatar src={p.avatar_url} name={p.char_name} size={46} className={`ring-2 ${p.member_id === run.creator_id ? "ring-amber-300/70" : "ring-spirit/50"}`} />
                {p.member_id === run.creator_id && <Crown className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />}
              </div>
            ) : (
              <span key={`v${i}`} className="w-[46px] h-[46px] rounded-full border-2 border-dashed border-white/15 flex items-center justify-center text-bone/25"><Plus className="w-4 h-4" /></span>
            ),
          )}
          <span className="ml-auto text-xs font-black italic text-bone/50 tabular-nums flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {filled}/{run.slots}</span>
        </div>
        <p className="mt-3 text-xs text-bone/55 line-clamp-2">{run.players.map((p) => p.char_name).join(" · ")}</p>
        {run.note && <p className="mt-2 text-xs italic text-bone/55 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2 flex gap-1.5"><StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5 text-spirit" /> {run.note}</p>}

        <div className="mt-auto pt-4 space-y-2">
          {canAct && (mine ? <RunButton runId={run.id} mode="cancel" /> : joined ? <RunButton runId={run.id} mode="leave" /> : !full && <RunButton runId={run.id} mode="join" />)}
          {canAct && !mine && !joined && full && <p className="text-center text-xs italic text-bone/40">Grupo completo. Fique de olho nos próximos!</p>}
          {isAdmin && !mine && <RunButton runId={run.id} mode="cancel" />}
        </div>
      </div>
    </div>
  );
}

export default async function DungeonsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (!canSeeContent(viewer)) return <MembersGate viewer={viewer} />;
  const member = isActiveMember(viewer) ? viewer.member : null;
  const page = pageFrom(params);
  const [dungeons, runs] = await Promise.all([getDungeons(false), getDungeonRuns(page, PAGE_SIZE)]);
  // Imagem do boss de cada grupo (pelo id; grupos antigos sem id, pelo nome)
  const imageOf = (r: DungeonRun) => (dungeons.find((d) => d.id === r.dungeon_id) ?? dungeons.find((d) => d.name === r.dungeon_name))?.image_url ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <PageHeader icon={Mountain} eyebrow="Grupos de 1 a 4 jogadores" title="Dungeons" accent="do clã" text="Marque um horário, escolha quantos jogadores e a galera vai ocupando as vagas." />

      {member && (
        <section className="mb-14">
          <SectionTitle title="Montar grupo" icon={Plus} />
          <div className="crypt-card p-5 sm:p-6"><DungeonForm dungeons={dungeons.filter((d) => d.active)} /></div>
        </section>
      )}

      <section id="grupos" className="scroll-mt-24">
        <SectionTitle title="Próximos grupos" icon={Users} />
        {runs.items.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {runs.items.map((r) => <RunCard key={r.id} run={r} image={imageOf(r)} me={member?.id ?? null} canAct={!!member} isAdmin={!!viewer?.isAdmin} />)}
          </div>
        ) : (
          <Empty text="Nenhum grupo marcado. Que tal montar o primeiro?" />
        )}
        <PageNav page={page} pageCount={Math.ceil(runs.total / PAGE_SIZE)} path="/dungeons" params={params} anchor="grupos" />
      </section>
    </div>
  );
}
