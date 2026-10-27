import { Clock, Gamepad2, Plus, Users, type LucideIcon } from "lucide-react";
import MembersGate from "@/components/MembersGate";
import Avatar from "@/components/Avatar";
import { AutoRefresh, RoomButton } from "@/components/Games";
import { Empty, PageHeader } from "@/components/ui";
import { getGames } from "@/lib/data";
import { canSeeContent, getViewer, isActiveMember } from "@/lib/viewer";
import { GAME_ICONS } from "@/lib/gameIcons";
import type { GameRoom } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Games" };

function RoomCard({ room, icon: Icon, me }: { room: GameRoom; icon: LucideIcon; me: string | null }) {
  const filled = room.players.length;
  const full = filled >= room.slots;
  const joined = !!me && room.players.some((p) => p.member_id === me);
  const seats = Array.from({ length: room.slots }, (_, i) => room.players[i] ?? null);

  return (
    <div className={`crypt-card p-4 flex flex-col gap-3 ${joined ? "!border-spirit/60 shadow-[0_0_24px_rgba(168,85,247,0.2)]" : filled ? "!border-spirit/30" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-title text-base truncate">{room.name}</p>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-black tabular-nums ${full ? "text-rose-200 bg-rose-500/15 border-rose-400/40" : filled ? "text-emerald-200 bg-emerald-500/15 border-emerald-400/40" : "text-bone/50 bg-white/5 border-white/10"}`}>
          <Users className="w-3 h-3" /> {filled}/{room.slots}
        </span>
      </div>

      {/* Vagas: ocupadas com a foto, livres tracejadas */}
      <div className="flex items-center gap-2">
        <span className="w-10 h-10 shrink-0 rounded-xl bg-spirit/15 border border-spirit/30 flex items-center justify-center text-spirit"><Icon className="w-5 h-5" /></span>
        {seats.map((p, i) =>
          p ? (
            <span key={p.member_id} title={p.char_name}><Avatar src={p.avatar_url} name={p.char_name} size={36} className="ring-2 ring-spirit/50" /></span>
          ) : (
            <span key={`v${i}`} className="w-9 h-9 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center text-bone/20"><Plus className="w-3.5 h-3.5" /></span>
          ),
        )}
      </div>
      <p className="min-h-4 text-[11px] text-bone/50 truncate">{filled ? room.players.map((p) => p.char_name).join(" · ") : "Ninguém na sala ainda"}</p>

      {me && <RoomButton roomId={room.id} joined={joined} full={full} />}
    </div>
  );
}

export default async function GamesPage() {
  const viewer = await getViewer();
  if (!canSeeContent(viewer)) return <MembersGate viewer={viewer} />;
  const me = isActiveMember(viewer) ? viewer.member.id : null;
  const modes = (await getGames()).filter((m) => m.rooms.length);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <AutoRefresh />
      <PageHeader icon={Gamepad2} eyebrow="Minigames do jogo" title="Games" accent="do clã" text="Entre numa sala para avisar que vai jogar. Quando lotar, é só encontrar a galera no jogo." />

      <p className="-mt-6 mb-10 flex items-center justify-center gap-1.5 text-xs italic text-bone/40">
        <Clock className="w-3.5 h-3.5 text-spirit" /> A vaga vale 1 hora e você fica em uma sala por vez. A página atualiza sozinha.
      </p>

      {modes.length ? (
        <div className="space-y-14">
          {modes.map((m) => {
            const Icon = GAME_ICONS[m.icon]?.icon ?? Gamepad2;
            const playing = m.rooms.reduce((n, r) => n + r.players.length, 0);
            return (
              <section key={m.id}>
                <div className="flex items-end justify-between gap-4 mb-5">
                  <h2 className="font-title text-2xl sm:text-[1.7rem] text-bone flex items-center gap-2.5"><Icon className="w-6 h-6 text-spirit" /> {m.name}</h2>
                  <span className="text-xs font-black italic uppercase tracking-widest text-bone/45">{playing} {playing === 1 ? "jogador" : "jogadores"} nas salas</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {m.rooms.map((r) => <RoomCard key={r.id} room={r} icon={Icon} me={me} />)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Empty text="A liderança ainda não abriu nenhuma sala." />
      )}
    </div>
  );
}
