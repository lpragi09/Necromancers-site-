"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock, CalendarRange, Check, ClipboardCheck, Crown, Dices, Eye, EyeOff, Gamepad2, Gem, Gift, Loader2,
  Lock, LockOpen, Megaphone, Mountain, Pencil, Pin, Plus, RotateCcw, Search, Sparkles, Store, Swords, Trash2, Trophy, UserCheck, Users, X,
  type LucideIcon,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useDialog } from "@/components/Dialog";
import Pagination, { usePagination } from "@/components/Pagination";
import Avatar from "@/components/Avatar";
import GhostIcon from "@/components/GhostIcon";
import GiveawayCard from "@/components/GiveawayCard";
import PostCard from "@/components/PostCard";
import { RarityBadge } from "@/components/ui";
import GiveawayDraw from "@/components/admin/GiveawayDraw";
import ShopAdmin from "@/components/admin/ShopAdmin";
import TournamentAdmin from "@/components/admin/TournamentAdmin";
import DungeonAdmin from "@/components/admin/DungeonAdmin";
import GamesAdmin from "@/components/admin/GamesAdmin";
import {
  EmptyLine, Field, FormFooter, fromLocalInput, IconBtn, ImageField, isUploading, Panel, Pill, Preview, Row, Segmented, toLocalInput, Toggle, useAction,
} from "@/components/admin/kit";
import { fmtDate, fmtDateTime, timeAgo } from "@/lib/format";
import {
  POST_KIND_LABEL, RARITY, ROLE_LABEL, ROLE_ORDER,
  type Drop, type DropItem, type Giveaway, type Member, type Post, type PostKind, type Rarity, type Season,
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
  discordEnabled?: boolean;
}

type Tab = "drops" | "membros" | "avisos" | "sorteios" | "ranking" | "loja" | "torneios" | "dungeons" | "games";


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

  // Chegou pedido de entrada ou drop novo? Atualiza sozinho, sem F5.
  // Confere a cada 15s (só com a aba visível) e quando a pessoa volta para a aba.
  const lastCheck = useRef<string | null>(null);
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const { signature } = await adminApi<{ signature: string }>("pendingCheck");
        if (lastCheck.current !== null && lastCheck.current !== signature) await load();
        lastCheck.current = signature;
      } catch {
        // sem internet por um instante: tenta de novo na próxima
      }
    };
    check();
    const timer = setInterval(check, 15_000);
    document.addEventListener("visibilitychange", check);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", check); };
  }, [load]);

  // Depois de mudar algo: recarrega o painel e as páginas públicas
  const reload = useCallback(async () => {
    await load();
    router.refresh();
  }, [load, router]);

  if (error) return <p className="crypt-card p-6 text-rose-300 text-sm">{error}</p>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-spirit animate-spin" /></div>;

  const pendingMembers = data.members.filter((m) => m.status === "pending").length;
  const activeMembers = data.members.filter((m) => m.status === "active").length;
  const openGiveaways = data.giveaways.filter((g) => g.status === "open").length;
  const tabs: { id: Tab; label: string; hint: string; icon: LucideIcon; badge?: number }[] = [
    { id: "avisos", label: "Avisos", hint: "Mural do clã", icon: Megaphone },
    { id: "membros", label: "Membros", hint: "Cargos e pedidos", icon: Users, badge: pendingMembers },
    { id: "torneios", label: "Torneios", hint: "Presença semanal", icon: Swords },
    { id: "dungeons", label: "Dungeons", hint: "Lista e grupos", icon: Mountain },
    { id: "games", label: "Games", hint: "Salas dos minigames", icon: Gamepad2 },
    { id: "sorteios", label: "Sorteios", hint: "Criar e sortear", icon: Gift },
    { id: "drops", label: "Drops", hint: "Aprovar prints", icon: Gem, badge: data.pendingDrops.length },
    { id: "ranking", label: "Temporadas", hint: "Prêmios e itens", icon: Trophy },
    { id: "loja", label: "Lojinha", hint: "Evaldocoins e resgates", icon: Store },
  ];
  const stats: { label: string; value: number; icon: LucideIcon; tab: Tab; alert?: boolean }[] = [
    { label: "Drops na fila", value: data.pendingDrops.length, icon: ClipboardCheck, tab: "drops", alert: data.pendingDrops.length > 0 },
    { label: "Pedidos de entrada", value: pendingMembers, icon: UserCheck, tab: "membros", alert: pendingMembers > 0 },
    { label: "Sorteios abertos", value: openGiveaways, icon: Gift, tab: "sorteios" },
    { label: "Membros ativos", value: activeMembers, icon: Users, tab: "membros" },
  ];

  return (
    <div className="space-y-6">
      {/* Resumo: o que precisa de atenção agora */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <button key={s.label} onClick={() => setTab(s.tab)}
            className={`group crypt-card crypt-card-hover text-left p-4 sm:p-5 flex items-center gap-4 ${s.alert ? "!border-blood/40" : ""}`}>
            <span className={`hidden sm:flex w-11 h-11 shrink-0 rounded-xl items-center justify-center border ${s.alert ? "bg-blood/15 border-blood/40 text-blood" : "bg-spirit/10 border-spirit/30 text-spirit"}`}>
              <s.icon className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-title text-2xl sm:text-3xl tabular-nums">{s.value}</span>
              <span className="block text-[10px] font-black italic uppercase tracking-wider sm:tracking-widest text-bone/45 leading-tight">{s.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[230px_1fr] gap-6 items-start">
        {/* Menu: lateral no computador, grade 3×3 no celular (todas as abas à vista) */}
        <nav className="lg:sticky lg:top-24 crypt-card p-2 grid grid-cols-3 lg:flex lg:flex-col gap-1">
          {tabs.map((t) => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-1 py-2 lg:px-3 lg:py-2.5 rounded-xl text-center lg:text-left transition-colors ${on ? "bg-spirit/15 text-bone" : "text-bone/55 hover:text-bone hover:bg-white/[0.04]"}`}>
                {on && <span className="hidden lg:block absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full bg-spirit shadow-[0_0_10px_rgba(168,85,247,0.9)]" />}
                <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center border ${on ? "bg-spirit border-spirit text-white shadow-[0_0_16px_rgba(168,85,247,0.5)]" : "bg-white/[0.03] border-white/10"}`}>
                  <t.icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 max-w-full lg:flex-1">
                  <span className="block truncate text-[10px] lg:text-sm font-black italic uppercase lg:tracking-wide">{t.label}</span>
                  <span className="hidden lg:block text-[11px] text-bone/40 truncate">{t.hint}</span>
                </span>
                {!!t.badge && <span className="absolute top-1 right-1 lg:static min-w-5 h-5 px-1.5 rounded-full bg-blood text-white text-[11px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.6)]">{t.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {tab === "drops" && <DropsTab data={data} reload={reload} />}
          {tab === "membros" && <MembersTab members={data.members} reload={reload} />}
          {tab === "avisos" && <PostsTab posts={data.posts} reload={reload} discordEnabled={!!data.discordEnabled} />}
          {tab === "sorteios" && <GiveawaysTab giveaways={data.giveaways} reload={reload} />}
          {tab === "ranking" && <RankingTab seasons={data.seasons} items={data.items} reload={reload} />}
          {tab === "loja" && <ShopAdmin />}
          {tab === "torneios" && <TournamentAdmin />}
          {tab === "dungeons" && <DungeonAdmin />}
          {tab === "games" && <GamesAdmin />}
        </div>
      </div>
    </div>
  );
}

// ======================= Drops =======================
function DropsTab({ data, reload }: { data: Overview; reload: () => Promise<void> }) {
  const { run, busy } = useAction(reload);
  const [zoom, setZoom] = useState<string | null>(null);
  const members = useMemo(() => new Map(data.members.map((m) => [m.id, m])), [data.members]);
  const seasons = useMemo(() => new Map(data.seasons.map((s) => [s.id, s.name])), [data.seasons]);
  const reviewedPag = usePagination(data.reviewedDrops);
  const pendingPag = usePagination(data.pendingDrops, 6);

  return (
    <div className="space-y-6">
      <Panel icon={ClipboardCheck} title={`Esperando aprovação (${data.pendingDrops.length})`} subtitle="Confira o print antes de aprovar. Os pontos entram no ranking na hora.">
        {data.pendingDrops.length ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {pendingPag.pageItems.map((d) => {
              const m = members.get(d.member_id);
              return (
                <div key={d.id} className="rounded-xl border border-white/10 bg-black/40 overflow-hidden flex flex-col">
                  <button onClick={() => d.proof_url && setZoom(d.proof_url)} className="relative aspect-video bg-checker cursor-zoom-in group">
                    {d.proof_url ? <img src={d.proof_url} alt="Print do drop" className="w-full h-full object-contain" /> : <span className="text-xs text-bone/40">sem print</span>}
                    {d.proof_url && <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 text-[10px] font-black italic uppercase opacity-0 group-hover:opacity-100 transition-opacity">Ampliar</span>}
                  </button>
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={m?.avatar_url} name={m?.char_name ?? "?"} size={30} />
                      <p className="font-black italic truncate flex-1">{m?.char_name ?? "membro removido"}</p>
                      <span className="text-[11px] text-bone/35">{timeAgo(d.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{d.quantity > 1 ? `${d.quantity}x ` : ""}{d.item_name}</span>
                      <RarityBadge rarity={d.rarity} />
                      <span className="ml-auto font-title text-lg text-spirit">+{(d.points * d.quantity).toLocaleString("pt-BR")}<span className="text-[10px] text-bone/40 ml-1">pts</span></span>
                    </div>
                    {d.note && <p className="text-xs italic text-bone/50 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">&ldquo;{d.note}&rdquo;</p>}
                    <p className="text-[11px] text-bone/30">{seasons.get(d.season_id) ?? ""}</p>
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                      <button disabled={busy} onClick={() => run("reviewDrop", { id: d.id, status: "rejected" })} className="btn-ghost !py-2 hover:!border-rose-400/60 hover:!bg-rose-500/10 !text-rose-300"><X className="w-4 h-4" /> Recusar</button>
                      <button disabled={busy} onClick={() => run("reviewDrop", { id: d.id, status: "approved" })} className="btn-neon !py-2"><Check className="w-4 h-4" /> Aprovar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyLine text="Nada na fila. Quando alguém mandar um drop, ele aparece aqui." />
        )}
        <Pagination {...pendingPag} />
      </Panel>

      <Panel icon={RotateCcw} title="Últimos conferidos" subtitle="Dá pra voltar um drop para análise ou excluir.">
        {data.reviewedDrops.length ? (
          <div className="space-y-2">
            {reviewedPag.pageItems.map((d) => (
              <Row key={d.id}>
                <button onClick={() => d.proof_url && setZoom(d.proof_url)} className="w-14 h-10 shrink-0 rounded-lg overflow-hidden bg-checker border border-white/10 cursor-zoom-in">
                  {d.proof_url && <img src={d.proof_url} alt="" className="w-full h-full object-cover" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{members.get(d.member_id)?.char_name ?? "membro removido"} <span className="text-bone/50 font-normal">· {d.quantity > 1 ? `${d.quantity}x ` : ""}{d.item_name}</span></p>
                  <p className="text-[11px] text-bone/35">{timeAgo(d.created_at)} · {seasons.get(d.season_id) ?? ""}</p>
                </div>
                <Pill tone={d.status === "approved" ? "green" : "red"}>{d.status === "approved" ? <><Check className="w-3 h-3" /> Aprovado</> : <><X className="w-3 h-3" /> Recusado</>}</Pill>
                <div className="flex gap-2">
                  <IconBtn title="Voltar para análise" disabled={busy} onClick={() => run("reviewDrop", { id: d.id, status: "pending" })}><RotateCcw className="w-4 h-4" /></IconBtn>
                  <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteDrop", { id: d.id }, { title: "Excluir este drop?", message: "O print também é apagado." })}><Trash2 className="w-4 h-4" /></IconBtn>
                </div>
              </Row>
            ))}
          </div>
        ) : (
          <EmptyLine text="Nenhum drop conferido ainda." />
        )}
        <Pagination {...reviewedPag} />
      </Panel>

      {zoom && (
        <div onClick={() => setZoom(null)} className="fixed inset-0 z-[250] bg-black/95 flex items-center justify-center p-4 animate-fade-in cursor-zoom-out">
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
  const count = (s: Member["status"]) => members.filter((m) => m.status === s).length;
  const list = members.filter((m) => (filter === "all" || m.status === filter) && (!q || m.char_name.toLowerCase().includes(q.toLowerCase()) || m.discord_name.toLowerCase().includes(q.toLowerCase())));
  const pending = members.filter((m) => m.status === "pending");
  const pag = usePagination(list);
  const pendingPag = usePagination(pending, 8);
  const save = (m: Member, fields: Partial<Member>) => run("saveMember", { member: { id: m.id, ...fields } });

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Panel icon={UserCheck} title={`Pedidos de entrada (${pending.length})`} subtitle="Quem se cadastrou no site e está esperando a liderança." className="!border-blood/30">
          <div className="space-y-2">
            {pendingPag.pageItems.map((m) => (
              <Row key={m.id}>
                <Avatar src={m.avatar_url} name={m.char_name} size={42} className="ring-2 ring-blood/40" />
                <div className="min-w-0 flex-1">
                  <p className="font-black italic truncate">{m.char_name} {m.level ? <span className="ml-1 text-[11px] not-italic font-bold text-bone/40">lvl {m.level}</span> : null}</p>
                  <p className="text-[11px] text-bone/40 truncate">Discord: {m.discord_name} · pediu {timeAgo(m.created_at)}</p>
                </div>
                <button disabled={busy} onClick={() => run("deleteMember", { id: m.id }, { title: `Recusar ${m.char_name}?` })} className="btn-ghost !py-2 !text-rose-300"><X className="w-4 h-4" /> Recusar</button>
                <button disabled={busy} onClick={() => save(m, { status: "active" })} className="btn-neon !py-2"><Check className="w-4 h-4" /> Aprovar</button>
              </Row>
            ))}
          </div>
          <Pagination {...pendingPag} />
        </Panel>
      )}

      <Panel icon={Users} title={`Membros (${members.length})`} subtitle="Mude o cargo ou deixe alguém inativo sem apagar o histórico.">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-5">
          <Segmented value={filter} onChange={setFilter} options={[
            { value: "all", label: "Todos", count: members.length },
            { value: "pending", label: "Pedidos", count: count("pending") },
            { value: "active", label: "Ativos", count: count("active") },
            { value: "inactive", label: "Inativos", count: count("inactive") },
          ]} />
          <div className="relative sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone/35" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar membro..." className="field !py-2 !pl-9" />
          </div>
        </div>
        {list.length === 0 && <EmptyLine text="Ninguém por aqui." />}
        <div className="space-y-2">
          {pag.pageItems.map((m) => (
            <Row key={m.id} className={m.status === "inactive" ? "opacity-60" : ""}>
              <Avatar src={m.avatar_url} name={m.char_name} size={42} className={m.role === "lider" ? "ring-2 ring-amber-300/60" : "ring-2 ring-spirit/25"} />
              <div className="min-w-0 flex-1">
                <p className="font-black italic truncate flex items-center gap-2">
                  {m.role === "lider" && <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />}{m.char_name}
                  {m.level ? <span className="text-[11px] not-italic font-bold text-bone/40">lvl {m.level}</span> : null}
                </p>
                <p className="text-[11px] text-bone/40 truncate">Discord: {m.discord_name} · desde {fmtDate(m.created_at)}</p>
              </div>
              {m.status === "pending" ? (
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => save(m, { status: "active" })} className="btn-neon !py-2"><Check className="w-4 h-4" /> Aprovar</button>
                  <IconBtn title="Recusar e remover" danger disabled={busy} onClick={() => run("deleteMember", { id: m.id }, { title: `Recusar ${m.char_name}?` })}><X className="w-4 h-4" /></IconBtn>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 items-center">
                  <select value={m.role} disabled={busy} onChange={(e) => save(m, { role: e.target.value as Member["role"] })} className="field !w-36 !py-2 !text-xs !font-bold" aria-label="Cargo">
                    {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                  <select value={m.status} disabled={busy} onChange={(e) => save(m, { status: e.target.value as Member["status"] })} className="field !w-28 !py-2 !text-xs !font-bold" aria-label="Situação">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                  <IconBtn title="Remover do site" danger disabled={busy} onClick={() => run("deleteMember", { id: m.id }, { title: `Remover ${m.char_name}?`, message: "Os drops e inscrições dele também são apagados." })}><Trash2 className="w-4 h-4" /></IconBtn>
                </div>
              )}
            </Row>
          ))}
        </div>
        <Pagination {...pag} />
      </Panel>
    </div>
  );
}

// ======================= Avisos =======================
const EMPTY_POST = { id: "", kind: "novidade" as PostKind, title: "", body: "", image_url: "", event_at: "", pinned: false, published: true, sendDiscord: true, mentionEveryone: false, popup: false, popup_public: false };
const KIND_ICON: Record<PostKind, LucideIcon> = { aviso: Megaphone, novidade: Sparkles, evento: CalendarClock };

function PostsTab({ posts, reload, discordEnabled }: { posts: Post[]; reload: () => Promise<void>; discordEnabled: boolean }) {
  const { run, busy } = useAction(reload);
  const dialog = useDialog();
  const [form, setForm] = useState(EMPTY_POST);
  const pag = usePagination(posts);
  const edit = (p: Post) => {
    setForm({ id: p.id, kind: p.kind, title: p.title, body: p.body, image_url: p.image_url ?? "", event_at: toLocalInput(p.event_at), pinned: p.pinned, published: p.published, sendDiscord: true, mentionEveryone: false, popup: !!p.popup, popup_public: !!p.popup_public });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run("savePost", { post: { ...form, id: form.id || undefined, event_at: fromLocalInput(form.event_at) } });
    if (!res) return;
    setForm(EMPTY_POST);
    if (typeof res.discordError === "string") {
      dialog.alert({ title: "Salvo no site, mas não no Discord", message: `O aviso foi salvo normalmente. O Discord recusou a mensagem: ${res.discordError}` });
    }
  };
  const preview: Post = {
    id: "preview", kind: form.kind, title: form.title || "Título da publicação", body: form.body || "O texto aparece aqui.",
    image_url: form.image_url || null, event_at: fromLocalInput(form.event_at), pinned: form.pinned, published: form.published, created_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-[1fr_320px] gap-6 items-start">
        <Panel icon={form.id ? Pencil : Megaphone} title={form.id ? "Editar publicação" : "Nova publicação"} subtitle="Aparece no mural e na home do site.">
          <form onSubmit={submit} className="grid gap-5">
            <Field label="Tipo">
              <Segmented value={form.kind} onChange={(kind) => setForm({ ...form, kind })}
                options={(Object.keys(POST_KIND_LABEL) as PostKind[]).map((k) => ({ value: k, label: POST_KIND_LABEL[k], icon: KIND_ICON[k] }))} />
            </Field>
            <Field label="Título">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} required placeholder="Ex.: Hunt obrigatória de sábado" className="field" />
            </Field>
            {form.kind === "evento" && (
              <Field label="Data do evento" className="sm:w-72">
                <input type="datetime-local" value={form.event_at} onChange={(e) => setForm({ ...form, event_at: e.target.value })} className="field" />
              </Field>
            )}
            <Field label="Texto" hint={`${form.body.length}/5000 · quebras de linha aparecem no site`}>
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} maxLength={5000} placeholder="Escreva o recado para o clã..." className="field resize-y" />
            </Field>
            <ImageField size="post" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Toggle checked={form.pinned} onChange={(pinned) => setForm({ ...form, pinned })} label="Fixar no topo" hint="Vira o aviso de destaque da home" />
              <Toggle checked={form.published} onChange={(published) => setForm({ ...form, published })} label="Publicado" hint="Desligado, fica como rascunho" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Toggle checked={form.popup} onChange={(popup) => setForm({ ...form, popup, popup_public: popup && form.popup_public })} label="Popup ao entrar no site" hint="Aparece toda vez que alguém entra ou dá F5 (só um aviso por vez)" />
              {form.popup && <Toggle checked={form.popup_public} onChange={(popup_public) => setForm({ ...form, popup_public })} label="Visitantes também veem" hint="Ideal para boas-vindas; senão só membros veem" />}
            </div>
            {discordEnabled ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <Toggle checked={form.sendDiscord} onChange={(sendDiscord) => setForm({ ...form, sendDiscord })} label="Enviar no Discord" hint={form.id ? "Se já foi enviado, a mensagem é editada junto" : "Posta igualzinho no canal do clã"} />
                <Toggle checked={form.mentionEveryone} onChange={(mentionEveryone) => setForm({ ...form, mentionEveryone })} label="Marcar @everyone" hint="Notifica todo mundo do servidor" />
              </div>
            ) : (
              <p className="text-[11px] italic text-bone/35">Envio para o Discord desligado: falta a variável DISCORD_WEBHOOK_URL na Vercel.</p>
            )}
            <FormFooter hint={form.published ? "Publica na hora para todo mundo." : "Salvo como rascunho, só a liderança vê."}>
              {form.id && <button type="button" onClick={() => setForm(EMPTY_POST)} className="btn-ghost">Cancelar</button>}
              <button disabled={busy || isUploading(form.image_url)} className="btn-neon">{busy || isUploading(form.image_url) ? <Loader2 className="w-4 h-4 animate-spin" /> : form.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isUploading(form.image_url) ? "Enviando imagem..." : form.id ? "Salvar" : "Publicar"}</button>
            </FormFooter>
          </form>
        </Panel>
        <Preview><PostCard post={preview} /></Preview>
      </div>

      <Panel icon={Megaphone} title={`Publicações (${posts.length})`}>
        {posts.length === 0 && <EmptyLine text="Nenhuma publicação ainda." />}
        <div className="space-y-2">
          {pag.pageItems.map((p) => {
            const Icon = KIND_ICON[p.kind];
            return (
              <Row key={p.id} className={p.published ? "" : "opacity-60"}>
                <span className="w-10 h-10 shrink-0 rounded-lg bg-spirit/10 border border-spirit/25 flex items-center justify-center overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Icon className="w-4 h-4 text-spirit" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate flex items-center gap-2">{p.pinned && <Pin className="w-3.5 h-3.5 text-blood shrink-0" />}{p.title}</p>
                  <p className="text-[11px] text-bone/40">{POST_KIND_LABEL[p.kind]} · {fmtDateTime(p.created_at)}</p>
                </div>
                {p.pinned && <Pill tone="red">Fixado</Pill>}
                {p.popup && <Pill tone="purple">Popup</Pill>}
                <Pill tone={p.published ? "green" : "gray"}>{p.published ? "No ar" : "Rascunho"}</Pill>
                <div className="flex gap-2">
                  <IconBtn title={p.published ? "Esconder" : "Publicar"} disabled={busy} onClick={() => run("savePost", { post: { ...p, published: !p.published } })}>
                    {p.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </IconBtn>
                  <IconBtn title="Editar" onClick={() => edit(p)}><Pencil className="w-4 h-4" /></IconBtn>
                  <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deletePost", { id: p.id }, { title: "Excluir esta publicação?" })}><Trash2 className="w-4 h-4" /></IconBtn>
                </div>
              </Row>
            );
          })}
        </div>
        <Pagination {...pag} />
      </Panel>
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
  type Entry = { member_id: string; name: string; avatar_url: string | null; status: "ok" | "rejected" };
  const [entries, setEntries] = useState<{ id: string; drawn: boolean; list: Entry[] } | null>(null);
  const pag = usePagination(giveaways);
  const entriesPag = usePagination(entries?.list ?? [], 40);

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
    await loadEntries(g);
  };
  const loadEntries = async (g: Giveaway) => {
    try {
      const r = await adminApi<{ entries: { member_id: string; status: Entry["status"]; members: { char_name: string; avatar_url: string | null } | null }[] }>("giveawayEntries", { id: g.id });
      setEntries({ id: g.id, drawn: g.status === "drawn", list: r.entries.map((e) => ({ member_id: e.member_id, name: e.members?.char_name ?? "?", avatar_url: e.members?.avatar_url ?? null, status: e.status ?? "ok" })) });
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
  const preview: Giveaway = {
    id: "preview", title: form.title || "Nome do sorteio", prize: form.prize || "Prêmio", description: form.description,
    image_url: form.image_url || null, status: "open", ends_at: fromLocalInput(form.ends_at),
    winner_member_id: null, winner_name: null, fair_draw_id: null, created_at: new Date().toISOString(), entries_count: 0, joined: false,
  };

  return (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-[1fr_320px] gap-6 items-start">
        <Panel icon={form.id ? Pencil : Gift} title={form.id ? "Editar sorteio" : "Novo sorteio"} subtitle="Uma chance por membro ativo. O resultado é comprovado pelo drand.">
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Título">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} required placeholder="Ex.: Sorteio da Lua Nova" className="field" />
              </Field>
              <Field label="Prêmio">
                <input value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} maxLength={200} required placeholder="Ex.: Shiny Gengar + 20kk" className="field" />
              </Field>
            </div>
            <Field label="Descrição" hint="Regras, quem pode participar, quando sai o resultado.">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={2000} className="field resize-y" />
            </Field>
            <Field label="Inscrições até" hint="Opcional. Sem data, fica aberto até você fechar." className="sm:w-72">
              <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="field" />
            </Field>
            <ImageField size="giveaway" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            <FormFooter hint="Aparece na hora em Sorteios e na home.">
              {form.id && <button type="button" onClick={() => setForm(EMPTY_GIVEAWAY)} className="btn-ghost">Cancelar</button>}
              <button disabled={busy || isUploading(form.image_url)} className="btn-neon">{busy || isUploading(form.image_url) ? <Loader2 className="w-4 h-4 animate-spin" /> : form.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isUploading(form.image_url) ? "Enviando imagem..." : form.id ? "Salvar" : "Criar sorteio"}</button>
            </FormFooter>
          </form>
        </Panel>
        <Preview><GiveawayCard giveaway={preview} canJoin /></Preview>
      </div>

      <Panel icon={Dices} title={`Sorteios (${giveaways.length})`} subtitle="Feche as inscrições, veja quem entrou e sorteie.">
        {giveaways.length === 0 && <EmptyLine text="Nenhum sorteio criado ainda." />}
        <div className="space-y-2">
          {pag.pageItems.map((g) => (
            <div key={g.id}>
              <Row>
                <span className="relative w-16 h-11 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-gradient-to-br from-[#2a0f4a] to-black flex items-center justify-center">
                  {g.image_url ? <img src={g.image_url} alt="" className="w-full h-full object-cover" /> : <GhostIcon className="w-5 h-6 text-[#e9e2ff]/80" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black italic flex items-center gap-2 min-w-0"><span className="truncate">{g.title}</span><span className="sm:hidden shrink-0"><Pill tone={g.status === "open" ? "green" : g.status === "closed" ? "amber" : "purple"}>{g.status === "open" ? "Aberto" : g.status === "closed" ? "Fechado" : "Sorteado"}</Pill></span></p>
                  <p className="text-[11px] text-bone/45 truncate flex flex-wrap items-center gap-x-3">
                    <span className="inline-flex items-center gap-1"><Gift className="w-3 h-3 text-spirit" /> {g.prize}</span>
                    <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {g.entries_count ?? 0} inscritos</span>
                    {g.ends_at && g.status !== "drawn" && <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" /> até {fmtDateTime(g.ends_at)}</span>}
                    {g.status === "drawn" && g.winner_name && <span className="inline-flex items-center gap-1 text-amber-300"><Trophy className="w-3 h-3" /> {g.winner_name}{g.drawn_at ? ` · ${fmtDateTime(g.drawn_at)}` : ""}</span>}
                  </p>
                </div>
                <span className="hidden sm:inline-flex"><Pill tone={g.status === "open" ? "green" : g.status === "closed" ? "amber" : "purple"}>
                  {g.status === "open" ? "Aberto" : g.status === "closed" ? "Fechado" : "Sorteado"}
                </Pill></span>
                <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
                  <IconBtn title="Ver inscritos" onClick={() => showEntries(g)}><Users className="w-4 h-4" /></IconBtn>
                  {g.status !== "drawn" && (
                    <>
                      <IconBtn title={g.status === "open" ? "Fechar inscrições" : "Reabrir inscrições"} disabled={busy}
                        onClick={() => run("setGiveawayStatus", { id: g.id, status: g.status === "open" ? "closed" : "open" })}>
                        {g.status === "open" ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                      </IconBtn>
                      <IconBtn title="Editar" onClick={() => edit(g)}><Pencil className="w-4 h-4" /></IconBtn>
                    </>
                  )}
                  <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteGiveaway", { id: g.id }, { title: "Excluir este sorteio?" })}><Trash2 className="w-4 h-4" /></IconBtn>
                  {g.status !== "drawn" && (
                    <button onClick={() => startDraw(g)} disabled={busy || !g.entries_count} title={g.entries_count ? "Sortear agora" : "Precisa de pelo menos 1 inscrito"} className="btn-neon !py-2 max-sm:flex-1"><Dices className="w-4 h-4" /> Sortear</button>
                  )}
                </div>
              </Row>
              {entries?.id === g.id && (
                <div className="mx-3 -mt-1 rounded-b-xl border border-t-0 border-white/5 bg-black/40 px-4 py-3">
                  <p className="text-[10px] font-black italic uppercase tracking-widest text-bone/40 mb-2">
                    Inscritos ({entries.list.filter((e) => e.status === "ok").length})
                    {entries.list.some((e) => e.status === "rejected") && <span className="text-rose-300/80"> · {entries.list.filter((e) => e.status === "rejected").length} removidos</span>}
                  </p>
                  {entries.list.length ? (
                    <>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {entriesPag.pageItems.map((e) => {
                          const out = e.status === "rejected";
                          const set = async (status: Entry["status"]) => {
                            if (status === "rejected" && !(await dialog.confirm({ title: `Rejeitar ${e.name}?`, message: "Ele sai da roleta e não consegue entrar de novo sozinho. Dá pra aprovar de volta depois.", tone: "danger", confirmText: "Rejeitar" }))) return;
                            if (await run("setEntryStatus", { giveawayId: g.id, memberId: e.member_id, status })) await loadEntries(g);
                          };
                          return (
                            <div key={e.member_id} className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 ${out ? "bg-rose-500/[0.06] border-rose-400/25" : "bg-white/[0.03] border-white/10"}`}>
                              <Avatar src={e.avatar_url} name={e.name} size={30} className={out ? "grayscale opacity-60" : ""} />
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-bold truncate ${out ? "text-bone/45 line-through" : ""}`}>{e.name}</p>
                                <p className={`text-[10px] font-black italic uppercase tracking-widest ${out ? "text-rose-300/80" : "text-emerald-300/80"}`}>{out ? "Rejeitado" : "Aprovado"}</p>
                              </div>
                              {!entries.drawn && (out ? (
                                <button type="button" onClick={() => set("ok")} disabled={busy} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-emerald-400/40 bg-emerald-400/10 text-emerald-200 text-[11px] font-black italic uppercase hover:bg-emerald-400/20 transition-colors"><Check className="w-3.5 h-3.5" /> Aprovar</button>
                              ) : (
                                <button type="button" onClick={() => set("rejected")} disabled={busy} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rose-400/40 bg-rose-500/10 text-rose-200 text-[11px] font-black italic uppercase hover:bg-rose-500/20 transition-colors"><X className="w-3.5 h-3.5" /> Rejeitar</button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                      <Pagination {...entriesPag} />
                    </>
                  ) : <p className="text-xs italic text-bone/40">Ninguém inscrito ainda.</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        <Pagination {...pag} />
      </Panel>

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
const PLACE = [
  { text: "text-amber-300", ring: "border-amber-300/40 bg-amber-300/[0.07]" },
  { text: "text-zinc-200", ring: "border-zinc-300/30 bg-zinc-300/[0.05]" },
  { text: "text-orange-300", ring: "border-orange-300/35 bg-orange-300/[0.06]" },
];
// "1º lugar: 100kk" vira "100kk" (a posição já aparece no selo)
const prizeText = (p: string) => p.replace(/^\s*\d+\s*[º°o]?\s*(lugar)?\s*[:\-–]\s*/i, "").trim() || p;

function RankingTab({ seasons, items, reload }: { seasons: Season[]; items: DropItem[]; reload: () => Promise<void> }) {
  const { run, busy } = useAction(reload);
  const [season, setSeason] = useState<typeof EMPTY_SEASON | null>(null);
  const [item, setItem] = useState<typeof EMPTY_ITEM | null>(null);
  const seasonsPag = usePagination(seasons, 5);
  const itemsPag = usePagination(items, 10);

  const saveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!season) return;
    const payload = {
      id: season.id || undefined,
      name: season.name,
      starts_at: fromLocalInput(season.starts_at),
      ends_at: fromLocalInput(season.ends_at),
      prizes: season.prizes.split("\n").map((p) => p.trim()).filter(Boolean),
    };
    if (await run("saveSeason", { season: payload })) setSeason(null);
  };
  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (await run("saveItem", { item: { ...item, id: item.id || undefined, points: Number(item.points) } })) setItem(null);
  };
  const toggleItem = (i: DropItem) => run("saveItem", { item: { id: i.id, name: i.name, points: i.points, rarity: i.rarity, image_url: i.image_url ?? "", active: !i.active } });
  const editSeason = (s: Season) => setSeason({ id: s.id, name: s.name, starts_at: toLocalInput(s.starts_at), ends_at: toLocalInput(s.ends_at), prizes: s.prizes.join("\n") });

  return (
    <div className="space-y-6">
      <Panel icon={Trophy} title="Temporadas" subtitle="Só a temporada atual recebe drops."
        action={!season && <button onClick={() => setSeason(EMPTY_SEASON)} className="btn-neon !py-2 !px-4 !text-xs"><Plus className="w-4 h-4" /> Nova temporada</button>}>
        {season && (
          <form onSubmit={saveSeason} className="mb-6 rounded-xl border border-spirit/30 bg-spirit/[0.05] p-4 sm:p-5 grid gap-4 animate-fade-in">
            <p className="font-title text-sm">{season.id ? "Editar temporada" : "Nova temporada"}</p>
            <div className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-4">
              <Field label="Nome">
                <input value={season.name} onChange={(e) => setSeason({ ...season, name: e.target.value })} maxLength={80} required autoFocus placeholder="Temporada 2 · Halloween" className="field" />
              </Field>
              <Field label="Início">
                <input type="datetime-local" value={season.starts_at} onChange={(e) => setSeason({ ...season, starts_at: e.target.value })} className="field" />
              </Field>
              <Field label="Fim (opcional)">
                <input type="datetime-local" value={season.ends_at} onChange={(e) => setSeason({ ...season, ends_at: e.target.value })} className="field" />
              </Field>
            </div>
            <Field label="Prêmios · um por linha (1º, 2º, 3º...)">
              <textarea value={season.prizes} onChange={(e) => setSeason({ ...season, prizes: e.target.value })} rows={3} className="field resize-y" placeholder={"100kk + Shiny Gengar\n50kk\n25kk"} />
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setSeason(null)} className="btn-ghost !py-2">Cancelar</button>
              <button disabled={busy} className="btn-neon !py-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {season.id ? "Salvar" : "Criar"}</button>
            </div>
          </form>
        )}

        {seasons.length === 0 && !season && <EmptyLine text="Nenhuma temporada ainda." />}
        <div className="space-y-3">
          {seasonsPag.pageItems.map((s) => {
            const active = s.status === "active";
            return (
              <div key={s.id} className={`rounded-xl border p-4 sm:p-5 ${active ? "border-spirit/50 bg-gradient-to-r from-spirit/[0.1] to-transparent shadow-[0_0_24px_rgba(168,85,247,0.12)]" : "border-white/5 bg-white/[0.015]"}`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[11rem] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-title text-lg">{s.name}</p>
                      {active ? <Pill tone="purple"><span className="w-1.5 h-1.5 rounded-full bg-spirit animate-pulse" /> Atual</Pill> : <Pill tone="gray">Encerrada</Pill>}
                    </div>
                    <p className="mt-1 text-xs text-bone/45 flex items-center gap-1.5 whitespace-nowrap">
                      <CalendarRange className="w-3.5 h-3.5 shrink-0" /> {fmtDate(s.starts_at)} → {s.ends_at ? fmtDate(s.ends_at) : "sem fim"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button disabled={busy} onClick={() => run("setSeasonStatus", { id: s.id, status: active ? "closed" : "active" })} className={`${active ? "btn-ghost" : "btn-neon"} !py-2 !px-3.5 !text-xs`}>
                      {active ? "Encerrar" : "Ativar"}
                    </button>
                    <IconBtn title="Editar" onClick={() => editSeason(s)}><Pencil className="w-4 h-4" /></IconBtn>
                    <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteSeason", { id: s.id }, { title: `Excluir ${s.name}?`, message: "Todos os drops dessa temporada são apagados." })}><Trash2 className="w-4 h-4" /></IconBtn>
                  </div>
                </div>
                {s.prizes.length > 0 ? (
                  <div className="mt-4 grid sm:grid-cols-3 gap-2">
                    {s.prizes.slice(0, 3).map((p, i) => (
                      <div key={i} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${PLACE[i].ring}`}>
                        <Trophy className={`w-4 h-4 shrink-0 ${PLACE[i].text}`} />
                        <span className={`font-title text-sm ${PLACE[i].text}`}>{i + 1}º</span>
                        <span className="text-sm text-bone/80 truncate">{prizeText(p)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => editSeason(s)} className="mt-3 text-xs font-bold italic text-spirit hover:text-white">+ Definir prêmios</button>
                )}
              </div>
            );
          })}
        </div>
        <Pagination {...seasonsPag} />
      </Panel>

      <Panel icon={Gem} title={`Itens que pontuam (${items.length})`} subtitle="O que os membros escolhem ao registrar um drop."
        action={!item && <button onClick={() => setItem(EMPTY_ITEM)} className="btn-neon !py-2 !px-4 !text-xs"><Plus className="w-4 h-4" /> Novo item</button>}>
        {item && (
          <form onSubmit={saveItem} className="mb-6 rounded-xl border border-spirit/30 bg-spirit/[0.05] p-4 sm:p-5 grid gap-4 animate-fade-in">
            <p className="font-title text-sm">{item.id ? "Editar item" : "Novo item"}</p>
            <div className="grid sm:grid-cols-[1fr_130px] gap-4">
              <Field label="Item">
                <input value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} maxLength={80} required autoFocus placeholder="Reaper Cloth" className="field" />
              </Field>
              <Field label="Pontos">
                <div className="relative">
                  <input type="number" min={1} value={item.points} onChange={(e) => setItem({ ...item, points: e.target.value })} required placeholder="100" className="field !pr-10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black italic uppercase text-bone/35">pts</span>
                </div>
              </Field>
            </div>
            <Field label="Raridade">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(RARITY) as Rarity[]).map((r) => {
                  const on = item.rarity === r;
                  return (
                    <button type="button" key={r} onClick={() => setItem({ ...item, rarity: r })}
                      className={`px-3.5 py-2 rounded-lg border text-[11px] font-black italic uppercase tracking-widest transition-all ${RARITY[r].text} ${RARITY[r].border} ${RARITY[r].bg} ${on ? `${RARITY[r].glow} ring-1 ring-white/30` : "opacity-40 hover:opacity-90"}`}>
                      {RARITY[r].label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Toggle checked={item.active} onChange={(active) => setItem({ ...item, active })} label="Disponível no formulário" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setItem(null)} className="btn-ghost !py-2">Cancelar</button>
                <button disabled={busy} className="btn-neon !py-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {item.id ? "Salvar" : "Adicionar"}</button>
              </div>
            </div>
          </form>
        )}

        {items.length === 0 && !item && <EmptyLine text="Cadastre os itens para a galera conseguir registrar drops." />}
        <div className="space-y-2">
          {itemsPag.pageItems.map((i) => (
            <Row key={i.id} className={i.active ? "" : "opacity-50"}>
              <span className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center ${RARITY[i.rarity].border} ${RARITY[i.rarity].bg}`}>
                <Gem className={`w-4 h-4 ${RARITY[i.rarity].text}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{i.name}</p>
                <p className={`text-[10px] font-black italic uppercase tracking-widest ${RARITY[i.rarity].text}`}>{RARITY[i.rarity].label}{!i.active && <span className="text-bone/40"> · oculto</span>}</p>
              </div>
              <span className="font-title text-xl text-spirit tabular-nums">{i.points}<span className="text-[10px] text-bone/35 ml-1">pts</span></span>
              <div className="flex gap-2">
                <IconBtn title={i.active ? "Esconder do formulário" : "Mostrar no formulário"} disabled={busy} onClick={() => toggleItem(i)}>
                  {i.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </IconBtn>
                <IconBtn title="Editar" onClick={() => setItem({ id: i.id, name: i.name, points: String(i.points), rarity: i.rarity, image_url: i.image_url ?? "", active: i.active })}><Pencil className="w-4 h-4" /></IconBtn>
                <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteItem", { id: i.id }, { title: `Excluir ${i.name}?`, message: "Drops já enviados continuam valendo." })}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            </Row>
          ))}
        </div>
        <Pagination {...itemsPag} />
      </Panel>
    </div>
  );
}
