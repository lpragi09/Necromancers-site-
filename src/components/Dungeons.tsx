"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, LogOut, Mountain, Plus, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import { useDialog } from "@/components/Dialog";
import type { Dungeon } from "@/lib/types";

// datetime-local no fuso de quem está usando: começa daqui a 1 hora, em hora cheia
const nextHour = () => {
  const d = new Date(Date.now() + 3600_000);
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const nowLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/** Criar grupo: dungeon + quantos jogadores (1 a 4, contando você) + dia e hora. */
export function DungeonForm({ dungeons }: { dungeons: Dungeon[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const [dungeonId, setDungeonId] = useState(dungeons[0]?.id ?? "");
  const [slots, setSlots] = useState(4);
  const [startsAt, setStartsAt] = useState(nextHour);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await api("/api/dungeons", { action: "create", dungeonId, slots, startsAt: new Date(startsAt).toISOString(), note });
      setNote("");
      setStartsAt(nextHour());
      router.refresh();
    } catch (err) {
      dialog.error(err, "Não foi possível criar o grupo");
    }
    lock.current = false;
    setBusy(false);
  };

  if (!dungeons.length) return <p className="text-sm italic text-bone/50">A liderança ainda não cadastrou as dungeons.</p>;

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
      <div className="sm:col-span-2">
        <label className="label">Dungeon</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {dungeons.map((d) => {
            const on = d.id === dungeonId;
            return (
              <button type="button" key={d.id} onClick={() => setDungeonId(d.id)} aria-pressed={on}
                className={`group relative aspect-[6/5] rounded-xl overflow-hidden border-2 transition-all ${on ? "border-spirit shadow-[0_0_18px_rgba(168,85,247,0.5)]" : "border-white/10 opacity-60 hover:opacity-100 hover:border-spirit/50"}`}>
                {d.image_url ? <img src={d.image_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  : <span className="absolute inset-0 bg-gradient-to-br from-[#2a0f4a] to-black flex items-center justify-center"><Mountain className="w-8 h-8 text-spirit" /></span>}
                <span className="absolute inset-x-0 bottom-0 px-2 pt-6 pb-2 bg-gradient-to-t from-black/95 to-transparent text-center text-xs sm:text-sm font-black italic uppercase text-bone">{d.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="label">Jogadores</label>
        <div className="inline-flex gap-1 p-1 rounded-xl bg-black/60 border border-white/10">
          {[1, 2, 3, 4].map((n) => (
            <button type="button" key={n} onClick={() => setSlots(n)}
              className={`w-11 h-9 rounded-lg text-sm font-black italic transition-all ${slots === n ? "bg-spirit text-white shadow-[0_0_14px_rgba(168,85,247,0.45)]" : "text-bone/55 hover:text-bone hover:bg-white/5"}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Dia e hora</label>
        <input type="datetime-local" value={startsAt} min={nowLocal()} onChange={(e) => setStartsAt(e.target.value)} required className="field" />
      </div>
      <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Observação (opcional): ex. levem revive, só level 200+" className="field flex-1" />
        <button disabled={busy} className="btn-neon shrink-0">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Criar grupo</button>
      </div>
      <p className="sm:col-span-2 -mt-1 text-[11px] italic text-bone/40 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-spirit" />
        {slots === 1 ? "Grupo solo: só você." : `Você ocupa 1 vaga e sobram ${slots - 1} para a galera entrar.`}
      </p>
    </form>
  );
}

/** Botão do card: Entrar, Sair ou Cancelar (quem criou). */
export function RunButton({ runId, mode }: { runId: string; mode: "join" | "leave" | "cancel" }) {
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  const go = async () => {
    if (lock.current) return;
    if (mode === "cancel") {
      const ok = await dialog.confirm({ title: "Cancelar este grupo?", message: "Ele some da lista para todo mundo.", tone: "danger", confirmText: "Cancelar grupo" });
      if (!ok) return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await api("/api/dungeons", { action: mode, runId });
      router.refresh();
    } catch (err) {
      dialog.error(err, "Não foi possível");
      router.refresh();
    }
    lock.current = false;
    setBusy(false);
  };

  if (mode === "join") {
    return <button onClick={go} disabled={busy} className="btn-neon w-full !py-2.5">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Entrar no grupo</button>;
  }
  if (mode === "leave") {
    return <button onClick={go} disabled={busy} className="btn-ghost w-full !py-2.5">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Sair do grupo</button>;
  }
  return <button onClick={go} disabled={busy} className="btn-ghost w-full !py-2.5 !text-rose-300 hover:!border-rose-400/60 hover:!bg-rose-500/10">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Cancelar grupo</button>;
}
