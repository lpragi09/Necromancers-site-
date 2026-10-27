"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, LogOut, Plus, Users, X } from "lucide-react";
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
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1.2fr_auto_1fr] lg:items-end">
      <div>
        <label className="label">Dungeon</label>
        <select value={dungeonId} onChange={(e) => setDungeonId(e.target.value)} className="field">
          {dungeons.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
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
      <div className="lg:col-span-3 flex flex-col sm:flex-row gap-3">
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Observação (opcional): ex. levem revive, só level 200+" className="field flex-1" />
        <button disabled={busy} className="btn-neon shrink-0">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Criar grupo</button>
      </div>
      <p className="lg:col-span-3 -mt-1 text-[11px] italic text-bone/40 flex items-center gap-1.5">
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
