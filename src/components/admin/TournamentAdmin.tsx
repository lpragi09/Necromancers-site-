"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Minus, Plus, Swords, Trash2, UserPlus } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useDialog } from "@/components/Dialog";
import Pagination, { usePagination } from "@/components/Pagination";
import { EmptyLine, IconBtn, Panel, Segmented } from "@/components/admin/kit";
import type { TournamentMonth, TournamentScore } from "@/lib/types";

interface Data { months: TournamentMonth[]; monthId: string; scores: TournamentScore[]; names: string[] }

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const currentWeek = () => Math.min(4, Math.ceil(new Date().getDate() / 7));

// Sugere o mês seguinte ao mais recente ("Outubro 2026" -> "Novembro 2026"); sem nenhum, o mês de hoje
function nextMonthName(latest?: string) {
  const m = latest?.match(/^(\S+)\s+(\d{4})$/);
  const idx = m ? MONTHS.indexOf(m[1]) : -1;
  if (m && idx >= 0) return idx === 11 ? `Janeiro ${Number(m[2]) + 1}` : `${MONTHS[idx + 1]} ${m[2]}`;
  const now = new Date();
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export default function TournamentAdmin() {
  const router = useRouter();
  const dialog = useDialog();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState(currentWeek());
  const [name, setName] = useState("");
  const [newMonth, setNewMonth] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (monthId?: string) => {
    try {
      setData(await adminApi<Data>("tournamentOverview", { monthId }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Ordem alfabética: ninguém muda de lugar enquanto a liderança clica no "+"
  const rows = useMemo(
    () => (data?.scores ?? []).filter((s) => s.week === week).sort((a, b) => a.player_name.localeCompare(b.player_name)),
    [data, week],
  );
  const pag = usePagination(rows, 15);
  const weekTotal = rows.reduce((s, r) => s + r.count, 0);

  if (error) return <p className="crypt-card p-6 text-rose-300 text-sm">{error}</p>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-spirit animate-spin" /></div>;
  const month = data.months.find((m) => m.id === data.monthId);

  const setCount = (id: string, count: number) =>
    setData((d) => d && { ...d, scores: d.scores.map((s) => (s.id === id ? { ...s, count } : s)) });

  // "+" e "−" mudam na hora e confirmam no servidor; se falhar, volta o número
  const bump = async (row: TournamentScore, delta: 1 | -1) => {
    if (delta < 0 && row.count <= 0) return;
    setCount(row.id, row.count + delta);
    try {
      const r = await adminApi<{ count: number }>("tournamentBump", { id: row.id, delta });
      setCount(row.id, r.count);
      router.refresh();
    } catch (err) {
      setCount(row.id, row.count);
      dialog.error(err);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      await adminApi("tournamentAdd", { monthId: data.monthId, week, name: n });
      setName("");
      await load(data.monthId);
      router.refresh();
    } catch (err) {
      dialog.error(err);
    }
    setBusy(false);
  };

  const remove = async (row: TournamentScore) => {
    const ok = await dialog.confirm({ title: `Tirar ${row.player_name} da semana ${row.week}?`, tone: "danger", confirmText: "Tirar" });
    if (!ok) return;
    try {
      await adminApi("tournamentRemove", { id: row.id });
      await load(data.monthId);
      router.refresh();
    } catch (err) {
      dialog.error(err);
    }
  };

  const createMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonth?.trim()) return;
    try {
      const r = await adminApi<{ id: string }>("createTournamentMonth", { name: newMonth });
      setNewMonth(null);
      setWeek(1);
      await load(r.id);
      router.refresh();
    } catch (err) {
      dialog.error(err);
    }
  };

  const deleteMonth = async () => {
    if (!month) return;
    const ok = await dialog.confirm({ title: `Apagar ${month.name}?`, message: "Todas as presenças das 4 semanas desse mês são apagadas.", tone: "danger", confirmText: "Apagar mês" });
    if (!ok) return;
    try {
      await adminApi("deleteTournamentMonth", { id: month.id });
      await load();
      router.refresh();
    } catch (err) {
      dialog.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <Panel icon={Swords} title="Torneios" subtitle="Escolha a semana, digite quem foi e vá clicando em + a cada torneio."
        action={!newMonth && <button onClick={() => setNewMonth(nextMonthName(data.months[0]?.name))} className="btn-neon !py-2 !px-4 !text-xs"><CalendarPlus className="w-4 h-4" /> Novo mês</button>}>
        {newMonth !== null && (
          <form onSubmit={createMonth} className="mb-6 rounded-xl border border-spirit/30 bg-spirit/[0.05] p-4 flex flex-wrap items-end gap-3 animate-fade-in">
            <div className="flex-1 min-w-48">
              <label className="label">Nome do mês</label>
              <input value={newMonth} onChange={(e) => setNewMonth(e.target.value)} maxLength={60} autoFocus className="field" />
            </div>
            <button type="button" onClick={() => setNewMonth(null)} className="btn-ghost !py-2.5">Cancelar</button>
            <button className="btn-neon !py-2.5"><Plus className="w-4 h-4" /> Criar</button>
          </form>
        )}

        {!month ? (
          <EmptyLine text="Crie o primeiro mês de torneios." />
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <select value={data.monthId} onChange={(e) => load(e.target.value)} className="field !w-48 !py-2 !text-sm !font-black" aria-label="Mês">
                  {data.months.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <IconBtn title="Apagar este mês" danger onClick={deleteMonth}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
              <Segmented value={String(week)} onChange={(v) => setWeek(Number(v))}
                options={[1, 2, 3, 4].map((w) => ({ value: String(w), label: `Semana ${w}`, count: (data.scores ?? []).filter((s) => s.week === w).length }))} />
            </div>

            {/* Adicionar quem foi */}
            <form onSubmit={add} className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-spirit" />
                <input value={name} onChange={(e) => setName(e.target.value)} list="tournament-names" maxLength={40}
                  placeholder={`Quem foi no torneio da semana ${week}? (Enter adiciona)`} className="field !pl-9" />
                <datalist id="tournament-names">{data.names.map((n) => <option key={n} value={n} />)}</datalist>
              </div>
              <button disabled={busy || !name.trim()} className="btn-neon">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Adicionar</button>
            </form>
            <p className="mt-2 text-[11px] italic text-bone/35">Se a pessoa já está na semana, adicionar de novo soma +1.</p>

            {/* Quem foi na semana */}
            <div className="mt-6 flex items-center justify-between">
              <p className="label !mb-0">{month.name} · Semana {week}</p>
              <p className="text-xs text-bone/45">{rows.length} {rows.length === 1 ? "pessoa" : "pessoas"} · {weekTotal} presenças</p>
            </div>
            {rows.length === 0 && <EmptyLine text={`Ninguém na semana ${week} ainda.`} />}
            <div className="mt-2 space-y-2">
              {pag.pageItems.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-white/5 bg-white/[0.015] hover:border-spirit/30 transition-colors">
                  <p className="flex-1 min-w-0 font-black italic truncate pl-1">{r.player_name}</p>
                  <button type="button" onClick={() => bump(r, -1)} disabled={r.count <= 0} aria-label={`Tirar 1 de ${r.player_name}`}
                    className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-bone/70 hover:text-white hover:border-rose-400/50 hover:bg-rose-500/10 disabled:opacity-30 transition-colors">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center font-title text-2xl text-spirit tabular-nums">{r.count}</span>
                  <button type="button" onClick={() => bump(r, 1)} aria-label={`Somar 1 para ${r.player_name}`}
                    className="w-10 h-10 rounded-xl border border-spirit/50 bg-spirit/20 flex items-center justify-center text-white hover:bg-spirit/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                  <IconBtn title="Tirar da semana" danger onClick={() => remove(r)}><Trash2 className="w-4 h-4" /></IconBtn>
                </div>
              ))}
            </div>
            <Pagination {...pag} />
          </>
        )}
      </Panel>
    </div>
  );
}
