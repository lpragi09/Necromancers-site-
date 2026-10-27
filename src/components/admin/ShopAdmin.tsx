"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock, Check, Coins, Eye, EyeOff, History, Loader2, Package, PackageCheck, Pencil, Plus, RotateCcw, Sparkles, Trash2, Wallet, X,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useDialog } from "@/components/Dialog";
import Pagination, { usePagination } from "@/components/Pagination";
import Avatar from "@/components/Avatar";
import { EmptyLine, Field, IconBtn, ImageField, isUploading, Panel, Pill, Row, Toggle, useAction } from "@/components/admin/kit";
import { fmtDateTime, timeAgo } from "@/lib/format";
import type { ActivityType, CoinClaim, ShopItem, ShopOrder } from "@/lib/types";

type Who = { char_name: string; avatar_url: string | null };
type AdminClaim = CoinClaim & Who & { proof_url: string | null };
type AdminOrder = ShopOrder & Who;
interface ShopData {
  epoch: number;
  lastReset: { created_at: string; created_by: string | null } | null;
  activities: ActivityType[];
  items: ShopItem[];
  pendingClaims: AdminClaim[];
  reviewedClaims: AdminClaim[];
  pendingOrders: AdminOrder[];
  recentOrders: AdminOrder[];
  balances: { member_id: string; char_name: string; avatar_url: string | null; earned: number; spent: number; balance: number }[];
}

const EMPTY_ITEM = { id: "", name: "", description: "", image_url: "", price: "", stock: "", active: true };
const EMPTY_ACTIVITY = { id: "", name: "", coins: "", active: true };

function CoinTag({ value, sign = "" }: { value: number; sign?: string }) {
  return <span className="inline-flex items-center gap-1 font-black text-amber-300 tabular-nums"><Coins className="w-4 h-4" /> {sign}{value.toLocaleString("pt-BR")}</span>;
}

export default function ShopAdmin() {
  const router = useRouter();
  const dialog = useDialog();
  const [data, setData] = useState<ShopData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [item, setItem] = useState<typeof EMPTY_ITEM | null>(null);
  const [activity, setActivity] = useState<typeof EMPTY_ACTIVITY | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await adminApi<ShopData>("shopOverview"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const reload = useCallback(async () => { await load(); router.refresh(); }, [load, router]);
  const { run, busy } = useAction(reload);

  const claimsPag = usePagination(data?.pendingClaims ?? [], 6);
  const ordersPag = usePagination(data?.pendingOrders ?? [], 8);
  const balancesPag = usePagination(data?.balances ?? [], 10);
  const itemsPag = usePagination(data?.items ?? [], 8);
  const historyPag = usePagination(data?.reviewedClaims ?? [], 8);
  const orderHistoryPag = usePagination(data?.recentOrders ?? [], 8);
  const activitiesPag = usePagination(data?.activities ?? [], 10);

  if (error) return <p className="crypt-card p-6 text-rose-300 text-sm">{error}</p>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-spirit animate-spin" /></div>;

  const resetCoins = async () => {
    const ok1 = await dialog.confirm({
      title: "Zerar as moedas de todo mundo?",
      message: "O saldo de todos os membros volta a zero e os pedidos de moedas que ainda não foram conferidos expiram. O histórico continua guardado. Resgates já feitos continuam na fila de entrega.",
      tone: "danger", confirmText: "Zerar moedas",
    });
    if (ok1) run("resetCoins");
  };
  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (await run("saveShopItem", { item: { ...item, id: item.id || undefined, price: Number(item.price), stock: item.stock === "" ? null : Number(item.stock) } })) setItem(null);
  };
  const saveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;
    if (await run("saveActivity", { activity: { ...activity, id: activity.id || undefined, coins: Number(activity.coins) } })) setActivity(null);
  };

  return (
    <div className="space-y-6">
      {/* Moedas para aprovar */}
      <Panel icon={Coins} title={`Moedas para aprovar (${data.pendingClaims.length})`} subtitle="Confira o print com o dia e a hora da atividade.">
        {data.pendingClaims.length ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {claimsPag.pageItems.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-black/40 overflow-hidden flex flex-col">
                <button onClick={() => c.proof_url && setZoom(c.proof_url)} className="relative aspect-video bg-checker cursor-zoom-in">
                  {c.proof_url ? <img src={c.proof_url} alt="Print da atividade" className="w-full h-full object-contain" /> : <span className="text-xs text-bone/40">sem print</span>}
                </button>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={c.avatar_url} name={c.char_name} size={30} />
                    <p className="font-black italic truncate flex-1">{c.char_name}</p>
                    <span className="text-[11px] text-bone/35">{timeAgo(c.created_at)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{c.activity_name}</span>
                    <span className="ml-auto"><CoinTag value={c.coins} sign="+" /></span>
                  </div>
                  <p className="text-xs text-bone/55 flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5 text-spirit" /> {fmtDateTime(c.happened_at)}</p>
                  {c.note && <p className="text-xs italic text-bone/50 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">&ldquo;{c.note}&rdquo;</p>}
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                    <button disabled={busy} onClick={() => run("reviewClaim", { id: c.id, status: "rejected" })} className="btn-ghost !py-2 !text-rose-300"><X className="w-4 h-4" /> Recusar</button>
                    <button disabled={busy} onClick={() => run("reviewClaim", { id: c.id, status: "approved" })} className="btn-neon !py-2"><Check className="w-4 h-4" /> Aprovar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyLine text="Nenhum pedido de moedas esperando." />}
        <Pagination {...claimsPag} />
      </Panel>

      {/* Resgates para entregar */}
      <Panel icon={PackageCheck} title={`Resgates para entregar (${data.pendingOrders.length})`} subtitle="Entregue o item no jogo e marque como entregue. Cancelar devolve as moedas.">
        {data.pendingOrders.length ? (
          <div className="space-y-2">
            {ordersPag.pageItems.map((o) => (
              <Row key={o.id}>
                <Avatar src={o.avatar_url} name={o.char_name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="font-black italic truncate">{o.char_name} <span className="not-italic font-bold text-bone/60">· {o.item_name}</span></p>
                  <p className="text-[11px] text-bone/40">{timeAgo(o.created_at)}</p>
                </div>
                <CoinTag value={o.price} sign="−" />
                <button disabled={busy} onClick={() => run("setOrderStatus", { id: o.id, status: "cancelled" }, { title: `Cancelar o resgate de ${o.char_name}?`, message: "As moedas voltam para o saldo dele e o item volta ao estoque." })} className="btn-ghost !py-2 !text-rose-300"><X className="w-4 h-4" /> Cancelar</button>
                <button disabled={busy} onClick={() => run("setOrderStatus", { id: o.id, status: "delivered" })} className="btn-neon !py-2"><Check className="w-4 h-4" /> Entregue</button>
              </Row>
            ))}
          </div>
        ) : <EmptyLine text="Nenhum resgate esperando entrega." />}
        <Pagination {...ordersPag} />
      </Panel>

      {/* Saldos */}
      <Panel icon={Wallet} title="Saldos do clã"
        subtitle={data.lastReset ? `Zerado em ${fmtDateTime(data.lastReset.created_at)}${data.lastReset.created_by ? ` por ${data.lastReset.created_by}` : ""}.` : "As moedas nunca foram zeradas."}
        action={<button disabled={busy} onClick={resetCoins} className="btn-ghost !py-2 !px-4 !text-xs !text-rose-300 hover:!border-rose-400/60 hover:!bg-rose-500/10"><RotateCcw className="w-4 h-4" /> Zerar moedas</button>}>
        {data.balances.length ? (
          <div className="space-y-2">
            {balancesPag.pageItems.map((b, i) => (
              <Row key={b.member_id}>
                <span className="w-6 text-center font-title text-bone/40 tabular-nums">{(balancesPag.page - 1) * 10 + i + 1}</span>
                <Avatar src={b.avatar_url} name={b.char_name} size={36} />
                <p className="flex-1 min-w-0 font-black italic truncate">{b.char_name}</p>
                <span className="hidden sm:block text-[11px] text-bone/40 tabular-nums">ganhou {b.earned} · gastou {b.spent}</span>
                <span className="font-title text-xl text-amber-200 tabular-nums inline-flex items-center gap-1.5"><Coins className="w-4 h-4 text-amber-300" /> {b.balance}</span>
              </Row>
            ))}
          </div>
        ) : <EmptyLine text="Ninguém tem moedas neste ciclo ainda." />}
        <Pagination {...balancesPag} />
      </Panel>

      {/* Itens da loja */}
      <Panel icon={Package} title={`Itens da loja (${data.items.length})`} subtitle="O que os membros trocam pelas moedas."
        action={!item && <button onClick={() => setItem(EMPTY_ITEM)} className="btn-neon !py-2 !px-4 !text-xs"><Plus className="w-4 h-4" /> Novo item</button>}>
        {item && (
          <form onSubmit={saveItem} className="mb-6 rounded-xl border border-spirit/30 bg-spirit/[0.05] p-4 sm:p-5 grid gap-4 animate-fade-in">
            <p className="font-title text-sm">{item.id ? "Editar item" : "Novo item"}</p>
            <div className="grid sm:grid-cols-[1fr_130px_130px] gap-4">
              <Field label="Item">
                <input value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} maxLength={80} required autoFocus placeholder="Dusk Stone" className="field" />
              </Field>
              <Field label="Preço">
                <div className="relative">
                  <input type="number" min={1} value={item.price} onChange={(e) => setItem({ ...item, price: e.target.value })} required placeholder="80" className="field !pr-9" />
                  <Coins className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-300" />
                </div>
              </Field>
              <Field label="Estoque">
                <input type="number" min={0} value={item.stock} onChange={(e) => setItem({ ...item, stock: e.target.value })} placeholder="Ilimitado" className="field" />
              </Field>
            </div>
            <Field label="Descrição (opcional)">
              <input value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} maxLength={300} placeholder="Ex.: entregue no depósito do clã" className="field" />
            </Field>
            <ImageField size="shop" value={item.image_url} onChange={(url) => setItem({ ...item, image_url: url })} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Toggle checked={item.active} onChange={(active) => setItem({ ...item, active })} label="Aparece na loja" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setItem(null)} className="btn-ghost !py-2">Cancelar</button>
                <button disabled={busy || isUploading(item.image_url)} className="btn-neon !py-2">{busy || isUploading(item.image_url) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {isUploading(item.image_url) ? "Enviando imagem..." : item.id ? "Salvar" : "Adicionar"}</button>
              </div>
            </div>
          </form>
        )}
        {data.items.length === 0 && !item && <EmptyLine text="A loja está vazia. Adicione o primeiro item." />}
        <div className="space-y-2">
          {itemsPag.pageItems.map((it) => (
            <Row key={it.id} className={it.active ? "" : "opacity-50"}>
              <span className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-gradient-to-br from-[#2a0f4a] to-black flex items-center justify-center">
                {it.image_url ? <img src={it.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-spirit" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{it.name}</p>
                <p className="text-[11px] text-bone/40">{it.stock === null ? "Estoque ilimitado" : it.stock === 0 ? "Esgotado" : `${it.stock} em estoque`}{!it.active && " · oculto"}</p>
              </div>
              <CoinTag value={it.price} />
              <div className="flex gap-2">
                <IconBtn title={it.active ? "Esconder da loja" : "Mostrar na loja"} disabled={busy} onClick={() => run("saveShopItem", { item: { ...it, active: !it.active } })}>
                  {it.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </IconBtn>
                <IconBtn title="Editar" onClick={() => setItem({ id: it.id, name: it.name, description: it.description, image_url: it.image_url ?? "", price: String(it.price), stock: it.stock === null ? "" : String(it.stock), active: it.active })}><Pencil className="w-4 h-4" /></IconBtn>
                <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteShopItem", { id: it.id }, { title: `Excluir ${it.name}?`, message: "Resgates já feitos continuam no histórico." })}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            </Row>
          ))}
        </div>
        <Pagination {...itemsPag} />
      </Panel>

      {/* Atividades */}
      <Panel icon={Sparkles} title={`Atividades (${data.activities.length})`} subtitle="Quanto cada atividade do clã vale em moedas."
        action={!activity && <button onClick={() => setActivity(EMPTY_ACTIVITY)} className="btn-neon !py-2 !px-4 !text-xs"><Plus className="w-4 h-4" /> Nova atividade</button>}>
        {activity && (
          <form onSubmit={saveActivity} className="mb-6 rounded-xl border border-spirit/30 bg-spirit/[0.05] p-4 sm:p-5 grid gap-4 animate-fade-in">
            <p className="font-title text-sm">{activity.id ? "Editar atividade" : "Nova atividade"}</p>
            <div className="grid sm:grid-cols-[1fr_140px] gap-4">
              <Field label="Atividade">
                <input value={activity.name} onChange={(e) => setActivity({ ...activity, name: e.target.value })} maxLength={80} required autoFocus placeholder="Castle" className="field" />
              </Field>
              <Field label="Moedas">
                <div className="relative">
                  <input type="number" min={1} value={activity.coins} onChange={(e) => setActivity({ ...activity, coins: e.target.value })} required placeholder="30" className="field !pr-9" />
                  <Coins className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-300" />
                </div>
              </Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Toggle checked={activity.active} onChange={(active) => setActivity({ ...activity, active })} label="Disponível para pedir" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setActivity(null)} className="btn-ghost !py-2">Cancelar</button>
                <button disabled={busy} className="btn-neon !py-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {activity.id ? "Salvar" : "Adicionar"}</button>
              </div>
            </div>
          </form>
        )}
        {data.activities.length === 0 && !activity && <EmptyLine text="Cadastre as atividades que valem moedas." />}
        <div className="space-y-2">
          {activitiesPag.pageItems.map((a) => (
            <Row key={a.id} className={a.active ? "" : "opacity-50"}>
              <Sparkles className="w-4 h-4 shrink-0 text-spirit" />
              <p className="flex-1 min-w-0 font-bold truncate">{a.name}{!a.active && <span className="text-bone/40 font-normal"> · oculta</span>}</p>
              <CoinTag value={a.coins} />
              <div className="flex gap-2">
                <IconBtn title={a.active ? "Esconder" : "Mostrar"} disabled={busy} onClick={() => run("saveActivity", { activity: { ...a, active: !a.active } })}>
                  {a.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </IconBtn>
                <IconBtn title="Editar" onClick={() => setActivity({ id: a.id, name: a.name, coins: String(a.coins), active: a.active })}><Pencil className="w-4 h-4" /></IconBtn>
                <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteActivity", { id: a.id }, { title: `Excluir ${a.name}?`, message: "Pedidos já feitos continuam valendo." })}><Trash2 className="w-4 h-4" /></IconBtn>
              </div>
            </Row>
          ))}
        </div>
        <Pagination {...activitiesPag} />
      </Panel>

      {/* Histórico */}
      <Panel icon={History} title="Histórico" subtitle="Últimos pedidos de moedas conferidos e resgates resolvidos.">
        <div className="grid xl:grid-cols-2 gap-6">
          <div>
            <p className="label">Moedas conferidas</p>
            {data.reviewedClaims.length === 0 && <EmptyLine text="Nada ainda." />}
            <div className="space-y-2">
              {historyPag.pageItems.map((c) => (
                <Row key={c.id}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{c.char_name} <span className="font-normal text-bone/50">· {c.activity_name}</span></p>
                    <p className="text-[11px] text-bone/35">{fmtDateTime(c.happened_at)}</p>
                  </div>
                  <Pill tone={c.status === "approved" ? "green" : c.status === "rejected" ? "red" : "gray"}>{c.status === "approved" ? `+${c.coins}` : c.status === "rejected" ? "Recusado" : "Expirado"}</Pill>
                  {c.status !== "expired" && <IconBtn title="Voltar para análise" disabled={busy} onClick={() => run("reviewClaim", { id: c.id, status: "pending" })}><RotateCcw className="w-4 h-4" /></IconBtn>}
                  <IconBtn title="Excluir" danger disabled={busy} onClick={() => run("deleteClaim", { id: c.id }, { title: "Excluir este pedido de moedas?", message: "O print também é apagado." })}><Trash2 className="w-4 h-4" /></IconBtn>
                </Row>
              ))}
            </div>
            <Pagination {...historyPag} />
          </div>
          <div>
            <p className="label">Resgates resolvidos</p>
            {data.recentOrders.length === 0 && <EmptyLine text="Nada ainda." />}
            <div className="space-y-2">
              {orderHistoryPag.pageItems.map((o) => (
                <Row key={o.id}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{o.char_name} <span className="font-normal text-bone/50">· {o.item_name}</span></p>
                    <p className="text-[11px] text-bone/35">{o.delivered_at ? `entregue ${timeAgo(o.delivered_at)}` : timeAgo(o.created_at)}</p>
                  </div>
                  <Pill tone={o.status === "delivered" ? "green" : "red"}>{o.status === "delivered" ? "Entregue" : "Cancelado"}</Pill>
                </Row>
              ))}
            </div>
            <Pagination {...orderHistoryPag} />
          </div>
        </div>
      </Panel>

      {zoom && (
        <div onClick={() => setZoom(null)} className="fixed inset-0 z-[250] bg-black/95 flex items-center justify-center p-4 animate-fade-in cursor-zoom-out">
          <img src={zoom} alt="Print" className="max-w-full max-h-full rounded-xl bg-checker" />
        </div>
      )}
    </div>
  );
}
