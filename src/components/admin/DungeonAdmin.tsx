"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Eye, EyeOff, Loader2, Mountain, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import Pagination, { usePagination } from "@/components/Pagination";
import { EmptyLine, Field, IconBtn, Panel, Pill, Row, Toggle, useAction } from "@/components/admin/kit";
import { fmtDateTime } from "@/lib/format";
import type { Dungeon } from "@/lib/types";

type AdminRun = { id: string; dungeon_name: string; slots: number; starts_at: string; note: string | null; filled: number; creator_name: string };
interface Data { dungeons: Dungeon[]; runs: AdminRun[] }

const EMPTY = { id: "", name: "", active: true };

export default function DungeonAdmin() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await adminApi<Data>("dungeonsOverview"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const reload = useCallback(async () => { await load(); router.refresh(); }, [load, router]);
  const { run, busy } = useAction(reload);
  const dungeonsPag = usePagination(data?.dungeons ?? [], 10);
  const runsPag = usePagination(data?.runs ?? [], 10);

  if (error) return <p className="crypt-card p-6 text-rose-300 text-sm">{error}</p>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-spirit animate-spin" /></div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form && (await run("saveDungeon", { dungeon: { ...form, id: form.id || undefined } }))) setForm(null);
  };

  return (
    <div className="space-y-6">
      <Panel icon={Mountain} title={`Dungeons (${data.dungeons.length})`} subtitle="A lista que os membros escolhem ao montar um grupo."
        action={!form && <button onClick={() => setForm(EMPTY)} className="btn-neon !py-2 !px-4 !text-xs"><Plus className="w-4 h-4" /> Nova dungeon</button>}>
        {form && (
          <form onSubmit={save} className="mb-6 rounded-xl border border-spirit/30 bg-spirit/[0.05] p-4 sm:p-5 grid gap-4 animate-fade-in">
            <Field label="Nome da dungeon">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} required autoFocus placeholder="Ex.: Magma" className="field" />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Toggle checked={form.active} onChange={(active) => setForm({ ...form, active })} label="Aparece para escolher" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setForm(null)} className="btn-ghost !py-2">Cancelar</button>
                <button disabled={busy} className="btn-neon !py-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {form.id ? "Salvar" : "Adicionar"}</button>
              </div>
            </div>
          </form>
        )}
        {data.dungeons.length === 0 && !form && <EmptyLine text="Cadastre as dungeons do jogo." />}
        <div className="space-y-2">
          {dungeonsPag.pageItems.map((d) => (
            <Row key={d.id} className={d.active ? "" : "opacity-50"}>
              <Mountain className="w-4 h-4 shrink-0 text-spirit" />
              <p className="flex-1 min-w-0 font-bold truncate">{d.name}{!d.active && <span className="font-normal text-bone/40"> · oculta</span>}</p>
              <div className="flex gap-2">
                <IconBtn title={d.active ? "Esconder" : "Mostrar"} disabled={busy} onClick={() => run("saveDungeon", { dungeon: { ...d, active: !d.active } })}>
                  {d.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </IconBtn>
                <IconBtn title="Editar" onClick={() => setForm({ id: d.id, name: d.name, active: d.active })}><Pencil className="w-4 h-4" /></IconBtn>
                <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteDungeon", { id: d.id }, { title: `Excluir ${d.name}?`, message: "Grupos já marcados continuam na lista." })}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            </Row>
          ))}
        </div>
        <Pagination {...dungeonsPag} />
      </Panel>

      <Panel icon={Users} title={`Grupos marcados (${data.runs.length})`} subtitle="Somem sozinhos 2 horas depois do horário.">
        {data.runs.length === 0 && <EmptyLine text="Nenhum grupo marcado agora." />}
        <div className="space-y-2">
          {runsPag.pageItems.map((r) => (
            <Row key={r.id}>
              <div className="min-w-0 flex-1">
                <p className="font-black italic truncate">{r.dungeon_name} <span className="not-italic font-bold text-bone/50">· criado por {r.creator_name}</span></p>
                <p className="text-[11px] text-bone/45 flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDateTime(r.starts_at)}{r.note ? ` · ${r.note}` : ""}</p>
              </div>
              <Pill tone={r.filled >= r.slots ? "red" : "green"}>{r.filled}/{r.slots}</Pill>
              <IconBtn title="Cancelar grupo" danger disabled={busy} onClick={() => run("cancelDungeonRun", { id: r.id }, { title: `Cancelar o grupo de ${r.creator_name}?`, message: "Ele some da lista para todo mundo." })}><X className="w-4 h-4" /></IconBtn>
            </Row>
          ))}
        </div>
        <Pagination {...runsPag} />
      </Panel>
    </div>
  );
}
