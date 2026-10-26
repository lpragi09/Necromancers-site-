"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, Dices, Eye, EyeOff, Gem, Gift, ImagePlus, Loader2, Lock, LockOpen, Megaphone, Pencil, Pin, Plus,
  RotateCcw, Trash2, Trophy, Users, X,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { useDialog } from "@/components/Dialog";
import Pagination, { usePagination } from "@/components/Pagination";
import Avatar from "@/components/Avatar";
import { RarityBadge } from "@/components/ui";
import GiveawayDraw from "@/components/admin/GiveawayDraw";
import { fmtDate, fmtDateTime, timeAgo } from "@/lib/format";
import {
  POST_KIND_LABEL, RARITY, ROLE_LABEL, ROLE_ORDER,
  type Drop, type DropItem, type Giveaway, type Member, type Post, type Rarity, type Season,
} from "@/lib/types";

type AdminDrop = Drop & { proof_url: string | null };
interface Overview {
  posts: Post[];
  giveaways: Giveaway[];
  seasons: Season[];
  items: DropItem[];
  members: Member[];
  pendingDrops: AdminDrop[];
  reviewedDrops: AdminDrop[];
}

type Tab = "drops" | "membros" | "avisos" | "sorteios" | "ranking";

// datetime-local <-> ISO, sempre no fuso de quem está usando o painel
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

export default function AdminPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("drops");
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setData(await adminApi<Overview>("overview"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Depois de mudar algo: recarrega o painel e as páginas públicas
  const reload = useCallback(async () => {
    await load();
    router.refresh();
  }, [load, router]);

  if (error) return <p className="crypt-card p-6 text-rose-300 text-sm">{error}</p>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-spirit animate-spin" /></div>;

  const pendingMembers = data.members.filter((m) => m.status === "pending").length;
  const tabs: { id: Tab; label: string; icon: typeof Gem; badge?: number }[] = [
    { id: "drops", label: "Drops", icon: Gem, badge: data.pendingDrops.length },
    { id: "membros", label: "Membros", icon: Users, badge: pendingMembers },
    { id: "avisos", label: "Avisos", icon: Megaphone },
    { id: "sorteios", label: "Sorteios", icon: Gift },
    { id: "ranking", label: "Temporadas & itens", icon: Trophy },
  ];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${tab === t.id ? "bg-ecto/10 border-ecto/40 text-ecto" : "border-spirit/15 text-bone/60 hover:text-bone"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
            {!!t.badge && <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] flex items-center justify-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === "drops" && <DropsTab data={data} reload={reload} />}
      {tab === "membros" && <MembersTab members={data.members} reload={reload} />}
      {tab === "avisos" && <PostsTab posts={data.posts} reload={reload} />}
      {tab === "sorteios" && <GiveawaysTab giveaways={data.giveaways} reload={reload} />}
      {tab === "ranking" && <RankingTab seasons={data.seasons} items={data.items} reload={reload} />}
    </div>
  );
}

/** Executa uma ação do painel com trava contra clique duplo e popup de erro. */
function useAction(reload: () => Promise<void>) {
  const dialog = useDialog();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = async (action: string, payload: Record<string, unknown> = {}, confirm?: { title: string; message?: string }) => {
    if (lock.current) return false;
    if (confirm && !(await dialog.confirm({ ...confirm, tone: "danger", confirmText: "Sim" }))) return false;
    lock.current = true;
    setBusy(true);
    try {
      await adminApi(action, payload);
      await reload();
      return true;
    } catch (err) {
      dialog.error(err);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { run, busy };
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`crypt-card p-5 sm:p-6 ${className}`}>{children}</div>;
}

function IconBtn({ onClick, title, children, danger = false, disabled = false }: { onClick: () => void; title: string; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className={`p-2 rounded-lg border transition-colors disabled:opacity-40 ${danger ? "border-rose-400/20 text-rose-300 hover:bg-rose-500/10" : "border-spirit/15 text-bone/70 hover:text-ecto hover:border-ecto/40"}`}>
      {children}
    </button>
  );
}

function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const dialog = useDialog();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const image = await compressImage(file, 1600, 0.82);
      const { url } = await adminApi<{ url: string }>("uploadImage", { image });
      onChange(url);
    } catch (err) {
      dialog.error(err, "Falha ao enviar a imagem");
    }
    setBusy(false);
  };
  return (
    <div className="flex items-center gap-3">
      {value ? <img src={value} alt="" className="w-20 h-14 rounded-lg object-cover border border-spirit/20" /> : null}
      <button type="button" onClick={() => ref.current?.click()} className="btn-ghost !py-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} {value ? "Trocar imagem" : "Imagem (opcional)"}
      </button>
      {value && <button type="button" onClick={() => onChange("")} className="text-xs text-bone/40 hover:text-rose-300">remover</button>}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

// ======================= Drops =======================
function DropsTab({ data, reload }: { data: Overview; reload: () => Promise<void> }) {
  const { run, busy } = useAction(reload);
  const [zoom, setZoom] = useState<string | null>(null);
  const names = useMemo(() => new Map(data.members.map((m) => [m.id, m.char_name])), [data.members]);
  const seasons = useMemo(() => new Map(data.seasons.map((s) => [s.id, s.name])), [data.seasons]);
  const reviewedPag = usePagination(data.reviewedDrops);

  const row = (d: AdminDrop, pending: boolean) => (
    <div key={d.id} className="flex flex-col sm:flex-row gap-4 py-4">
      <button onClick={() => d.proof_url && setZoom(d.proof_url)} className="shrink-0 w-full sm:w-36 h-28 rounded-lg overflow-hidden bg-checker border border-spirit/15">
        {d.proof_url ? <img src={d.proof_url} alt="Print" className="w-full h-full object-contain" /> : <span className="text-xs text-bone/40">sem print</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-bone">{names.get(d.member_id) ?? "membro removido"}</p>
        <p className="text-sm text-bone/75 mt-0.5 flex flex-wrap items-center gap-2">
          {d.quantity > 1 ? `${d.quantity}x ` : ""}{d.item_name} <RarityBadge rarity={d.rarity} />
          <span className="font-black text-ecto">+{(d.points * d.quantity).toLocaleString("pt-BR")} pts</span>
        </p>
        {d.note && <p className="text-xs text-bone/50 mt-1">&ldquo;{d.note}&rdquo;</p>}
        <p className="text-xs text-bone/35 mt-1">{timeAgo(d.created_at)} · {seasons.get(d.season_id) ?? ""}</p>
      </div>
      <div className="flex sm:flex-col gap-2 shrink-0">
        {pending ? (
          <>
            <button disabled={busy} onClick={() => run("reviewDrop", { id: d.id, status: "approved" })} className="btn-ecto !py-2"><Check className="w-4 h-4" /> Aprovar</button>
            <button disabled={busy} onClick={() => run("reviewDrop", { id: d.id, status: "rejected" })} className="btn-ghost !py-2 !text-rose-300"><X className="w-4 h-4" /> Recusar</button>
          </>
        ) : (
          <>
            <span className={`text-center px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${d.status === "approved" ? "text-ecto border-ecto/30 bg-ecto/10" : "text-rose-300 border-rose-400/30 bg-rose-500/10"}`}>
              {d.status === "approved" ? "Aprovado" : "Recusado"}
            </span>
            <div className="flex gap-2">
              <IconBtn title="Voltar para análise" disabled={busy} onClick={() => run("reviewDrop", { id: d.id, status: "pending" })}><RotateCcw className="w-4 h-4" /></IconBtn>
              <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteDrop", { id: d.id }, { title: "Excluir este drop?", message: "O print também é apagado." })}><Trash2 className="w-4 h-4" /></IconBtn>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-title text-lg font-bold">Esperando aprovação ({data.pendingDrops.length})</h2>
        {data.pendingDrops.length ? <div className="divide-y divide-spirit/10">{data.pendingDrops.map((d) => row(d, true))}</div> : <p className="text-sm text-bone/50 mt-2">Nada na fila. 👻</p>}
      </Card>
      <Card>
        <h2 className="font-title text-lg font-bold">Últimos conferidos</h2>
        {data.reviewedDrops.length ? <div className="divide-y divide-spirit/10">{reviewedPag.pageItems.map((d) => row(d, false))}</div> : <p className="text-sm text-bone/50 mt-2">Nenhum ainda.</p>}
        <Pagination {...reviewedPag} />
      </Card>
      {zoom && (
        <div onClick={() => setZoom(null)} className="fixed inset-0 z-[250] bg-void/95 flex items-center justify-center p-4 animate-fade-in cursor-zoom-out">
          <img src={zoom} alt="Print" className="max-w-full max-h-full rounded-xl bg-checker" />
        </div>
      )}
    </div>
  );
}

// ======================= Membros =======================
function MembersTab({ members, reload }: { members: Member[]; reload: () => Promise<void> }) {
  const { run, busy } = useAction(reload);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "inactive">("all");
  const [q, setQ] = useState("");
  const list = members.filter((m) => (filter === "all" || m.status === filter) && (!q || m.char_name.toLowerCase().includes(q.toLowerCase()) || m.discord_name.toLowerCase().includes(q.toLowerCase())));
  const pag = usePagination(list);
  const save = (m: Member, fields: Partial<Member>) => run("saveMember", { member: { id: m.id, ...fields } });

  return (
    <Card>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <h2 className="font-title text-lg font-bold flex-1">Membros ({members.length})</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="field !w-44 !py-2" />
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="field !w-40 !py-2">
          <option value="all">Todos</option>
          <option value="pending">Pedidos de entrada</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>
      {list.length === 0 && <p className="text-sm text-bone/50">Ninguém aqui.</p>}
      <div className="divide-y divide-spirit/10">
        {pag.pageItems.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 py-3">
            <Avatar src={m.avatar_url} name={m.char_name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">{m.char_name} {m.level ? <span className="text-xs text-bone/40 font-normal">lvl {m.level}</span> : null}</p>
              <p className="text-xs text-bone/40 truncate">Discord: {m.discord_name} · desde {fmtDate(m.created_at)}</p>
            </div>
            {m.status === "pending" ? (
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => save(m, { status: "active" })} className="btn-ecto !py-2"><Check className="w-4 h-4" /> Aprovar</button>
                <IconBtn title="Recusar e remover" danger disabled={busy} onClick={() => run("deleteMember", { id: m.id }, { title: `Recusar ${m.char_name}?` })}><X className="w-4 h-4" /></IconBtn>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                <select value={m.role} disabled={busy} onChange={(e) => save(m, { role: e.target.value as Member["role"] })} className="field !w-32 !py-1.5 !text-xs">
                  {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <select value={m.status} disabled={busy} onChange={(e) => save(m, { status: e.target.value as Member["status"] })} className="field !w-28 !py-1.5 !text-xs">
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
                <IconBtn title="Remover do site" danger disabled={busy} onClick={() => run("deleteMember", { id: m.id }, { title: `Remover ${m.char_name}?`, message: "Os drops e inscrições dele também são apagados." })}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            )}
          </div>
        ))}
      </div>
      <Pagination {...pag} />
    </Card>
  );
}

// ======================= Avisos =======================
const EMPTY_POST = { id: "", kind: "novidade" as Post["kind"], title: "", body: "", image_url: "", event_at: "", pinned: false, published: true };

function PostsTab({ posts, reload }: { posts: Post[]; reload: () => Promise<void> }) {
  const { run, busy } = useAction(reload);
  const [form, setForm] = useState(EMPTY_POST);
  const pag = usePagination(posts);
  const edit = (p: Post) => {
    setForm({ id: p.id, kind: p.kind, title: p.title, body: p.body, image_url: p.image_url ?? "", event_at: toLocalInput(p.event_at), pinned: p.pinned, published: p.published });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run("savePost", { post: { ...form, id: form.id || undefined, event_at: fromLocalInput(form.event_at) } })) setForm(EMPTY_POST);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-title text-lg font-bold mb-4">{form.id ? "Editar publicação" : "Nova publicação"}</h2>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid sm:grid-cols-[160px_1fr] gap-4">
            <div>
              <label className="label">Tipo</label>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Post["kind"] })} className="field">
                {Object.entries(POST_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Título</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} required className="field" />
            </div>
          </div>
          {form.kind === "evento" && (
            <div className="sm:w-64">
              <label className="label">Data do evento</label>
              <input type="datetime-local" value={form.event_at} onChange={(e) => setForm({ ...form, event_at: e.target.value })} className="field" />
            </div>
          )}
          <div>
            <label className="label">Texto</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} maxLength={5000} className="field resize-y" />
          </div>
          <ImageField value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="accent-[#6ef2c8]" /> Fixar no topo</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-[#6ef2c8]" /> Publicado</label>
          </div>
          <div className="flex gap-3">
            <button disabled={busy} className="btn-ecto">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {form.id ? "Salvar" : "Publicar"}</button>
            {form.id && <button type="button" onClick={() => setForm(EMPTY_POST)} className="btn-ghost">Cancelar</button>}
          </div>
        </form>
      </Card>
      <Card>
        <h2 className="font-title text-lg font-bold mb-2">Publicações ({posts.length})</h2>
        <div className="divide-y divide-spirit/10">
          {pag.pageItems.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate flex items-center gap-2">{p.pinned && <Pin className="w-3.5 h-3.5 text-rose-300 shrink-0" />}{p.title}</p>
                <p className="text-xs text-bone/40">{POST_KIND_LABEL[p.kind]} · {fmtDateTime(p.created_at)}{!p.published && " · rascunho"}</p>
              </div>
              <IconBtn title={p.published ? "Esconder" : "Publicar"} disabled={busy} onClick={() => run("savePost", { post: { ...p, published: !p.published } })}>
                {p.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </IconBtn>
              <IconBtn title="Editar" onClick={() => edit(p)}><Pencil className="w-4 h-4" /></IconBtn>
              <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deletePost", { id: p.id }, { title: "Excluir esta publicação?" })}><Trash2 className="w-4 h-4" /></IconBtn>
            </div>
          ))}
        </div>
        <Pagination {...pag} />
      </Card>
    </div>
  );
}

// ======================= Sorteios =======================
const EMPTY_GIVEAWAY = { id: "", title: "", prize: "", description: "", image_url: "", ends_at: "" };

function GiveawaysTab({ giveaways, reload }: { giveaways: Giveaway[]; reload: () => Promise<void> }) {
  const { run, busy } = useAction(reload);
  const dialog = useDialog();
  const [form, setForm] = useState(EMPTY_GIVEAWAY);
  const [drawing, setDrawing] = useState<Giveaway | null>(null);
  const [entries, setEntries] = useState<{ id: string; names: string[] } | null>(null);
  const pag = usePagination(giveaways);

  const edit = (g: Giveaway) => {
    setForm({ id: g.id, title: g.title, prize: g.prize, description: g.description, image_url: g.image_url ?? "", ends_at: toLocalInput(g.ends_at) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run("saveGiveaway", { giveaway: { ...form, id: form.id || undefined, ends_at: fromLocalInput(form.ends_at) } })) setForm(EMPTY_GIVEAWAY);
  };
  const showEntries = async (g: Giveaway) => {
    if (entries?.id === g.id) return setEntries(null);
    try {
      const r = await adminApi<{ entries: { members: { char_name: string } | null }[] }>("giveawayEntries", { id: g.id });
      setEntries({ id: g.id, names: r.entries.map((e) => e.members?.char_name ?? "?") });
    } catch (err) {
      dialog.error(err);
    }
  };
  const startDraw = async (g: Giveaway) => {
    const ok = await dialog.confirm({
      title: `Sortear "${g.title}"?`,
      message: `As inscrições fecham e a lista de ${g.entries_count ?? 0} inscritos é congelada antes do número público sair.`,
      confirmText: "Sortear",
    });
    if (ok) setDrawing(g);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-title text-lg font-bold mb-4">{form.id ? "Editar sorteio" : "Novo sorteio"}</h2>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Título</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} required className="field" />
            </div>
            <div>
              <label className="label">Prêmio</label>
              <input value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} maxLength={200} required placeholder="Ex.: Shiny Gengar + 20kk" className="field" />
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={2000} className="field resize-y" />
          </div>
          <div className="sm:w-64">
            <label className="label">Inscrições até (opcional)</label>
            <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="field" />
          </div>
          <ImageField value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
          <div className="flex gap-3">
            <button disabled={busy} className="btn-ecto"><Plus className="w-4 h-4" /> {form.id ? "Salvar" : "Criar sorteio"}</button>
            {form.id && <button type="button" onClick={() => setForm(EMPTY_GIVEAWAY)} className="btn-ghost">Cancelar</button>}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-title text-lg font-bold mb-2">Sorteios ({giveaways.length})</h2>
        <div className="divide-y divide-spirit/10">
          {pag.pageItems.map((g) => (
            <div key={g.id} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{g.title}</p>
                  <p className="text-xs text-bone/45">
                    {g.prize} · {g.entries_count ?? 0} inscritos ·{" "}
                    {g.status === "open" ? "aberto" : g.status === "closed" ? "inscrições fechadas" : `ganhador: ${g.winner_name}`}
                  </p>
                </div>
                <IconBtn title="Ver inscritos" onClick={() => showEntries(g)}><Users className="w-4 h-4" /></IconBtn>
                {g.status !== "drawn" && (
                  <>
                    <IconBtn title={g.status === "open" ? "Fechar inscrições" : "Reabrir inscrições"} disabled={busy}
                      onClick={() => run("setGiveawayStatus", { id: g.id, status: g.status === "open" ? "closed" : "open" })}>
                      {g.status === "open" ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                    </IconBtn>
                    <IconBtn title="Editar" onClick={() => edit(g)}><Pencil className="w-4 h-4" /></IconBtn>
                    <button onClick={() => startDraw(g)} disabled={busy || !g.entries_count} className="btn-ecto !py-2"><Dices className="w-4 h-4" /> Sortear</button>
                  </>
                )}
                <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteGiveaway", { id: g.id }, { title: "Excluir este sorteio?" })}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
              {entries?.id === g.id && (
                <p className="mt-2 text-xs text-bone/60 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                  {entries.names.length ? entries.names.join(" · ") : "Ninguém inscrito ainda."}
                </p>
              )}
            </div>
          ))}
        </div>
        <Pagination {...pag} />
      </Card>

      {drawing && (
        <GiveawayDraw
          giveaway={drawing}
          onClose={() => { setDrawing(null); reload(); }}
          onConfirmed={() => { setDrawing(null); reload(); }}
        />
      )}
    </div>
  );
}

// ======================= Temporadas & itens =======================
const EMPTY_SEASON = { id: "", name: "", starts_at: "", ends_at: "", prizes: "" };
const EMPTY_ITEM = { id: "", name: "", points: "", rarity: "raro" as Rarity, image_url: "", active: true };

function RankingTab({ seasons, items, reload }: { seasons: Season[]; items: DropItem[]; reload: () => Promise<void> }) {
  const { run, busy } = useAction(reload);
  const [season, setSeason] = useState(EMPTY_SEASON);
  const [item, setItem] = useState(EMPTY_ITEM);

  const saveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: season.id || undefined,
      name: season.name,
      starts_at: fromLocalInput(season.starts_at),
      ends_at: fromLocalInput(season.ends_at),
      prizes: season.prizes.split("\n").map((p) => p.trim()).filter(Boolean),
    };
    if (await run("saveSeason", { season: payload })) setSeason(EMPTY_SEASON);
  };
  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run("saveItem", { item: { ...item, id: item.id || undefined, points: Number(item.points) } })) setItem(EMPTY_ITEM);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-6">
        <Card>
          <h2 className="font-title text-lg font-bold mb-4">{season.id ? "Editar temporada" : "Nova temporada"}</h2>
          <form onSubmit={saveSeason} className="grid gap-4">
            <div>
              <label className="label">Nome</label>
              <input value={season.name} onChange={(e) => setSeason({ ...season, name: e.target.value })} maxLength={80} required placeholder="Ex.: Temporada 2 · Halloween" className="field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Início</label>
                <input type="datetime-local" value={season.starts_at} onChange={(e) => setSeason({ ...season, starts_at: e.target.value })} className="field" />
              </div>
              <div>
                <label className="label">Fim</label>
                <input type="datetime-local" value={season.ends_at} onChange={(e) => setSeason({ ...season, ends_at: e.target.value })} className="field" />
              </div>
            </div>
            <div>
              <label className="label">Prêmios (um por linha, na ordem: 1º, 2º, 3º...)</label>
              <textarea value={season.prizes} onChange={(e) => setSeason({ ...season, prizes: e.target.value })} rows={3} className="field resize-y" placeholder={"1º lugar: 100kk\n2º lugar: 50kk\n3º lugar: 25kk"} />
            </div>
            <div className="flex gap-3">
              <button disabled={busy} className="btn-ecto"><Plus className="w-4 h-4" /> {season.id ? "Salvar" : "Criar"}</button>
              {season.id && <button type="button" onClick={() => setSeason(EMPTY_SEASON)} className="btn-ghost">Cancelar</button>}
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="font-title text-lg font-bold mb-1">Temporadas</h2>
          <p className="text-xs text-bone/45 mb-3">Só a temporada &quot;atual&quot; recebe drops. Ativar uma encerra as outras.</p>
          <div className="divide-y divide-spirit/10">
            {seasons.map((s) => (
              <div key={s.id} className="flex items-center gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{s.name} {s.status === "active" && <span className="text-[10px] text-ecto uppercase tracking-widest ml-1">atual</span>}</p>
                  <p className="text-xs text-bone/40">{fmtDate(s.starts_at)}{s.ends_at ? ` → ${fmtDate(s.ends_at)}` : ""}</p>
                </div>
                <button disabled={busy} onClick={() => run("setSeasonStatus", { id: s.id, status: s.status === "active" ? "closed" : "active" })} className="btn-ghost !py-1.5 !px-3 !text-xs">
                  {s.status === "active" ? "Encerrar" : "Ativar"}
                </button>
                <IconBtn title="Editar" onClick={() => setSeason({ id: s.id, name: s.name, starts_at: toLocalInput(s.starts_at), ends_at: toLocalInput(s.ends_at), prizes: s.prizes.join("\n") })}><Pencil className="w-4 h-4" /></IconBtn>
                <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteSeason", { id: s.id }, { title: `Excluir ${s.name}?`, message: "Todos os drops dessa temporada são apagados." })}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="font-title text-lg font-bold mb-4">{item.id ? "Editar item" : "Novo item que pontua"}</h2>
          <form onSubmit={saveItem} className="grid gap-4">
            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div>
                <label className="label">Item</label>
                <input value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} maxLength={80} required className="field" />
              </div>
              <div>
                <label className="label">Pontos</label>
                <input type="number" min={1} value={item.points} onChange={(e) => setItem({ ...item, points: e.target.value })} required className="field" />
              </div>
            </div>
            <div>
              <label className="label">Raridade</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(RARITY) as Rarity[]).map((r) => (
                  <button type="button" key={r} onClick={() => setItem({ ...item, rarity: r })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-opacity ${RARITY[r].text} ${RARITY[r].border} ${RARITY[r].bg} ${item.rarity === r ? "ring-2 ring-ecto/60" : "opacity-50 hover:opacity-90"}`}>
                    {RARITY[r].label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.active} onChange={(e) => setItem({ ...item, active: e.target.checked })} className="accent-[#6ef2c8]" /> Aparece no formulário de drops</label>
            <div className="flex gap-3">
              <button disabled={busy} className="btn-ecto"><Plus className="w-4 h-4" /> {item.id ? "Salvar" : "Adicionar"}</button>
              {item.id && <button type="button" onClick={() => setItem(EMPTY_ITEM)} className="btn-ghost">Cancelar</button>}
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="font-title text-lg font-bold mb-2">Itens ({items.length})</h2>
          <div className="divide-y divide-spirit/10">
            {items.map((i) => (
              <div key={i.id} className={`flex items-center gap-3 py-2.5 ${i.active ? "" : "opacity-50"}`}>
                <span className="flex-1 font-semibold truncate">{i.name}</span>
                <RarityBadge rarity={i.rarity} />
                <span className="w-14 text-right font-black text-ecto tabular-nums">{i.points}</span>
                <IconBtn title="Editar" onClick={() => setItem({ id: i.id, name: i.name, points: String(i.points), rarity: i.rarity, image_url: i.image_url ?? "", active: i.active })}><Pencil className="w-4 h-4" /></IconBtn>
                <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteItem", { id: i.id }, { title: `Excluir ${i.name}?`, message: "Drops já enviados continuam valendo." })}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
