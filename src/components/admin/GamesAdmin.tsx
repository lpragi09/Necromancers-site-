"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eraser, Eye, EyeOff, Gamepad2, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { adminApi } from "@/lib/api";
import { EmptyLine, Field, IconBtn, Panel, Pill, Row, Segmented, Toggle, useAction } from "@/components/admin/kit";
import { GAME_ICONS } from "@/lib/gameIcons";
import type { GameIcon, GameMode, GameRoom } from "@/lib/types";

const EMPTY_MODE = { id: "", name: "", icon: "gamepad" as GameIcon, sort: "", active: true };
const EMPTY_ROOM = { id: "", mode_id: "", name: "", slots: 4, sort: "", active: true };

export default function GamesAdmin() {
  const router = useRouter();
  const [modes, setModes] = useState<GameMode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<typeof EMPTY_MODE | null>(null);
  const [room, setRoom] = useState<typeof EMPTY_ROOM | null>(null);

  const load = useCallback(async () => {
    try {
      setModes((await adminApi<{ modes: GameMode[] }>("gamesOverview")).modes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const reload = useCallback(async () => { await load(); router.refresh(); }, [load, router]);
  const { run, busy } = useAction(reload);

  if (error) return <p className="crypt-card p-6 text-rose-300 text-sm">{error}</p>;
  if (!modes) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-spirit animate-spin" /></div>;

  const saveMode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode && (await run("saveGameMode", { mode: { ...mode, id: mode.id || undefined } }))) setMode(null);
  };
  const saveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (room && (await run("saveGameRoom", { room: { ...room, id: room.id || undefined } }))) setRoom(null);
  };
  const editRoom = (r: GameRoom) => setRoom({ id: r.id, mode_id: r.mode_id, name: r.name, slots: r.slots, sort: String(r.sort), active: r.active });

  const roomForm = room && (
    <form onSubmit={saveRoom} className="mt-3 rounded-xl border border-spirit/30 bg-spirit/[0.05] p-4 grid gap-4 animate-fade-in">
      <p className="font-title text-sm">{room.id ? "Editar sala" : "Nova sala"}</p>
      <div className="grid sm:grid-cols-[1fr_110px] gap-4">
        <Field label="Nome da sala">
          <input value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} maxLength={60} required autoFocus placeholder="Ex.: Ice Arena" className="field" />
        </Field>
        <Field label="Ordem" hint="Menor aparece antes">
          <input type="number" value={room.sort} onChange={(e) => setRoom({ ...room, sort: e.target.value })} placeholder="1" className="field" />
        </Field>
      </div>
      <div>
        <label className="label">Vagas</label>
        <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-black/60 border border-white/10">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button type="button" key={n} onClick={() => setRoom({ ...room, slots: n })}
              className={`w-9 h-8 rounded-lg text-sm font-black italic transition-all ${room.slots === n ? "bg-spirit text-white shadow-[0_0_14px_rgba(168,85,247,0.45)]" : "text-bone/55 hover:text-bone hover:bg-white/5"}`}>{n}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle checked={room.active} onChange={(active) => setRoom({ ...room, active })} label="Aparece no site" />
        <div className="flex gap-3">
          <button type="button" onClick={() => setRoom(null)} className="btn-ghost !py-2">Cancelar</button>
          <button disabled={busy} className="btn-neon !py-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {room.id ? "Salvar" : "Adicionar"}</button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <Panel icon={Gamepad2} title={`Games (${modes.length})`} subtitle="Os minigames do jogo e as salas de cada um."
        action={!mode && <button onClick={() => setMode(EMPTY_MODE)} className="btn-neon !py-2 !px-4 !text-xs"><Plus className="w-4 h-4" /> Novo jogo</button>}>
        {mode && (
          <form onSubmit={saveMode} className="mb-6 rounded-xl border border-spirit/30 bg-spirit/[0.05] p-4 sm:p-5 grid gap-4 animate-fade-in">
            <p className="font-title text-sm">{mode.id ? "Editar jogo" : "Novo jogo"}</p>
            <div className="grid sm:grid-cols-[1fr_110px] gap-4">
              <Field label="Nome do jogo">
                <input value={mode.name} onChange={(e) => setMode({ ...mode, name: e.target.value })} maxLength={60} required autoFocus placeholder="Ex.: Bomberman" className="field" />
              </Field>
              <Field label="Ordem" hint="Menor aparece antes">
                <input type="number" value={mode.sort} onChange={(e) => setMode({ ...mode, sort: e.target.value })} placeholder="1" className="field" />
              </Field>
            </div>
            <div>
              <label className="label">Ícone</label>
              <Segmented value={mode.icon} onChange={(icon) => setMode({ ...mode, icon })}
                options={(Object.keys(GAME_ICONS) as GameIcon[]).map((k) => ({ value: k, label: GAME_ICONS[k].label, icon: GAME_ICONS[k].icon }))} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Toggle checked={mode.active} onChange={(active) => setMode({ ...mode, active })} label="Aparece no site" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setMode(null)} className="btn-ghost !py-2">Cancelar</button>
                <button disabled={busy} className="btn-neon !py-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {mode.id ? "Salvar" : "Adicionar"}</button>
              </div>
            </div>
          </form>
        )}

        {modes.length === 0 && !mode && <EmptyLine text="Cadastre o primeiro jogo, por exemplo Bomberman." />}

        <div className="space-y-6">
          {modes.map((m) => {
            const Icon = GAME_ICONS[m.icon]?.icon ?? Gamepad2;
            return (
              <div key={m.id} className={`rounded-xl border border-white/10 p-3 sm:p-4 ${m.active ? "" : "opacity-60"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-spirit/15 border border-spirit/30 flex items-center justify-center text-spirit"><Icon className="w-5 h-5" /></span>
                  <div className="min-w-[9rem] flex-1">
                    <p className="font-title text-lg truncate">{m.name}</p>
                    <p className="text-[11px] text-bone/45">{m.rooms.length} {m.rooms.length === 1 ? "sala" : "salas"}{!m.active && " · oculto"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <IconBtn title={m.active ? "Esconder do site" : "Mostrar no site"} disabled={busy} onClick={() => run("saveGameMode", { mode: { ...m, active: !m.active } })}>
                      {m.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </IconBtn>
                    <IconBtn title="Editar" onClick={() => setMode({ id: m.id, name: m.name, icon: m.icon, sort: String(m.sort), active: m.active })}><Pencil className="w-4 h-4" /></IconBtn>
                    <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteGameMode", { id: m.id }, { title: `Excluir ${m.name}?`, message: "Todas as salas desse jogo são apagadas junto." })}><Trash2 className="w-4 h-4" /></IconBtn>
                    <button onClick={() => setRoom({ ...EMPTY_ROOM, mode_id: m.id })} className="btn-ghost !py-2 !px-3 !text-xs"><Plus className="w-4 h-4" /> Sala</button>
                  </div>
                </div>

                {room && room.mode_id === m.id && !room.id && roomForm}

                <div className="mt-3 space-y-2">
                  {m.rooms.map((r) => (
                    <div key={r.id}>
                      <Row className={r.active ? "" : "opacity-50"}>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate">{r.name}{!r.active && <span className="font-normal text-bone/40"> · oculta</span>}</p>
                          <p className="text-[11px] text-bone/45 truncate">{r.players.length ? r.players.map((p) => p.char_name).join(" · ") : "Vazia"}</p>
                        </div>
                        <Pill tone={r.players.length >= r.slots ? "red" : r.players.length ? "green" : "gray"}><Users className="w-3 h-3" /> {r.players.length}/{r.slots}</Pill>
                        <div className="flex gap-2">
                          <IconBtn title="Esvaziar a sala" disabled={busy || !r.players.length} onClick={() => run("clearGameRoom", { id: r.id }, { title: `Esvaziar ${r.name}?`, message: "Todo mundo sai da sala." })}><Eraser className="w-4 h-4" /></IconBtn>
                          <IconBtn title={r.active ? "Esconder" : "Mostrar"} disabled={busy} onClick={() => run("saveGameRoom", { room: { ...r, active: !r.active } })}>
                            {r.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </IconBtn>
                          <IconBtn title="Editar" onClick={() => editRoom(r)}><Pencil className="w-4 h-4" /></IconBtn>
                          <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteGameRoom", { id: r.id }, { title: `Excluir ${r.name}?` })}><Trash2 className="w-4 h-4" /></IconBtn>
                        </div>
                      </Row>
                      {room && room.id === r.id && roomForm}
                    </div>
                  ))}
                  {m.rooms.length === 0 && <p className="text-sm italic text-bone/40 px-1">Nenhuma sala. Clique em &ldquo;+ Sala&rdquo;.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
