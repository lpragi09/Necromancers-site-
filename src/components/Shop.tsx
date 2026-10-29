"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Send, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/image";
import Coin from "@/components/Coin";
import { useDialog } from "@/components/Dialog";
import Pagination, { usePagination } from "@/components/Pagination";
import { fmtDateTime, timeAgo } from "@/lib/format";
import type { ActivityType, CoinClaim, ShopItem, ShopOrder } from "@/lib/types";

// datetime-local no fuso de quem está usando, começando em "agora"
const nowLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/** Pedido de Evaldocoins: atividade + dia e hora + print (clicar, arrastar ou Ctrl+V). */
export function ClaimForm({ activities }: { activities: ActivityType[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const [activityId, setActivityId] = useState(activities[0]?.id ?? "");
  const [happenedAt, setHappenedAt] = useState(nowLocal);
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const lock = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const activity = activities.find((a) => a.id === activityId);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      setProof(await compressImage(file));
    } catch (err) {
      dialog.error(err, "Imagem inválida");
    }
  };
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) { e.preventDefault(); pick(file); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lock.current) return;
    if (!proof) return dialog.alert({ title: "Falta o print", message: "Anexe um print mostrando a atividade, com o dia e a hora aparecendo." });
    lock.current = true;
    setBusy(true);
    try {
      await api("/api/loja", { action: "claim", activityId, happenedAt: new Date(happenedAt).toISOString(), note, proof });
      setProof(null);
      setNote("");
      await dialog.alert({ title: "Pedido enviado!", message: "A liderança vai conferir o print. Assim que aprovar, as Evaldocoins caem no seu saldo.", tone: "success" });
      router.refresh();
    } catch (err) {
      dialog.error(err, "Não foi possível enviar");
    }
    lock.current = false;
    setBusy(false);
  };

  if (!activities.length) return <p className="text-sm italic text-bone/50">A liderança ainda não cadastrou as atividades que valem Evaldocoins.</p>;

  return (
    <form onSubmit={submit} className="grid md:grid-cols-[1fr_220px] gap-5">
      <div className="space-y-4">
        <div>
          <label className="label">Atividade</label>
          <select value={activityId} onChange={(e) => setActivityId(e.target.value)} className="field">
            {activities.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.coins} Evaldocoins</option>)}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Dia e hora da atividade</label>
            <input type="datetime-local" value={happenedAt} max={nowLocal()} onChange={(e) => setHappenedAt(e.target.value)} required className="field" />
          </div>
          <div>
            <label className="label">Observação (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ex.: castle de sábado" className="field" />
          </div>
        </div>
        <p className="text-sm text-bone/55 flex items-center gap-1.5">Vale <b className="text-amber-300 inline-flex items-center gap-1"><Coin className="w-5 h-5" /> {activity?.coins ?? 0} Evaldocoins</b> se aprovado.</p>
        <button disabled={busy} className="btn-neon">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar para aprovação</button>
      </div>

      <button type="button" onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
        className={`relative rounded-xl border-2 border-dashed transition-colors min-h-48 overflow-hidden flex items-center justify-center ${over ? "border-spirit bg-spirit/10" : "border-white/10 hover:border-spirit/50 hover:bg-spirit/5"}`}>
        {proof ? (
          <>
            <img src={proof} alt="Print da atividade" className="absolute inset-0 w-full h-full object-contain bg-checker" />
            <span className="absolute bottom-2 inset-x-2 rounded-md bg-black/70 py-1 text-[10px] font-black italic uppercase text-bone/80">Clique para trocar</span>
          </>
        ) : (
          <span className="text-center px-4 text-bone/50 text-sm">
            <ImagePlus className="w-8 h-8 mx-auto mb-2 text-spirit" />
            <b className="block text-bone/80">Print com dia e hora</b>
            <span className="block text-xs mt-1">Clique, arraste ou cole com <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-bold">Ctrl+V</kbd></span>
          </span>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      </button>
    </form>
  );
}

/** Botão de resgate de um item, com confirmação. */
export function BuyButton({ item, balance, canBuy }: { item: ShopItem; balance: number; canBuy: boolean }) {
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const soldOut = item.stock !== null && item.stock <= 0;
  const missing = item.price - balance;

  const buy = async () => {
    if (lock.current) return;
    const confirmed = await dialog.confirm({
      title: `Resgatar ${item.name}?`,
      message: `Vão sair ${item.price} Evaldocoins do seu saldo. A liderança entrega o item no jogo e marca como entregue.`,
      confirmText: "Resgatar",
    });
    if (!confirmed) return;
    lock.current = true;
    setBusy(true);
    try {
      await api("/api/loja", { action: "buy", itemId: item.id });
      await dialog.alert({ title: "Resgate feito!", message: "Seu pedido foi para a liderança. Acompanhe em \"Meus resgates\".", tone: "success" });
      router.refresh();
    } catch (err) {
      dialog.error(err, "Não foi possível resgatar");
    }
    lock.current = false;
    setBusy(false);
  };

  if (soldOut) return <span className="btn-ghost w-full !opacity-50 !cursor-not-allowed">Esgotado</span>;
  if (!canBuy) return <span className="btn-ghost w-full !opacity-60 !cursor-not-allowed">Só membros resgatam</span>;
  if (missing > 0) return <span className="btn-ghost w-full !opacity-70 !cursor-not-allowed"><Coin className="w-5 h-5 text-amber-300" /> Faltam {missing}</span>;
  return (
    <button onClick={buy} disabled={busy} className="btn-neon w-full">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />} Resgatar
    </button>
  );
}

const CLAIM_STATUS: Record<CoinClaim["status"], { label: string; cls: string }> = {
  pending: { label: "Em análise", cls: "text-amber-300 bg-amber-400/10 border-amber-400/30" },
  approved: { label: "Aprovado", cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30" },
  rejected: { label: "Recusado", cls: "text-rose-300 bg-rose-500/10 border-rose-400/30" },
  expired: { label: "Expirado", cls: "text-bone/50 bg-white/5 border-white/15" },
};
const ORDER_STATUS: Record<ShopOrder["status"], { label: string; cls: string }> = {
  pending: { label: "A entregar", cls: "text-amber-300 bg-amber-400/10 border-amber-400/30" },
  delivered: { label: "Entregue", cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30" },
  cancelled: { label: "Cancelado", cls: "text-rose-300 bg-rose-500/10 border-rose-400/30" },
};
const pill = "px-2 py-0.5 rounded-md border text-[10px] font-black italic uppercase tracking-widest whitespace-nowrap";

/** Histórico do membro no ciclo atual: pedidos de Evaldocoins e resgates. */
export function ShopHistory({ claims, orders }: { claims: CoinClaim[]; orders: ShopOrder[] }) {
  const claimsPag = usePagination(claims, 8);
  const ordersPag = usePagination(orders, 8);
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="crypt-card p-5 sm:p-6">
        <h3 className="font-title text-lg mb-3">Meus pedidos de Evaldocoins</h3>
        {claims.length === 0 ? <p className="text-sm italic text-bone/45">Nenhum pedido ainda.</p> : (
          <div className="divide-y divide-white/5">
            {claimsPag.pageItems.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{c.activity_name}</p>
                  <p className="text-xs text-bone/40">{fmtDateTime(c.happened_at)}</p>
                </div>
                <span className="text-sm font-black text-amber-300 tabular-nums inline-flex items-center gap-1"><Coin className="w-4 h-4" /> +{c.coins}</span>
                <span className={`${pill} ${CLAIM_STATUS[c.status].cls}`}>{CLAIM_STATUS[c.status].label}</span>
              </div>
            ))}
          </div>
        )}
        <Pagination {...claimsPag} />
      </div>
      <div className="crypt-card p-5 sm:p-6">
        <h3 className="font-title text-lg mb-3">Meus resgates</h3>
        {orders.length === 0 ? <p className="text-sm italic text-bone/45">Nenhum resgate ainda.</p> : (
          <div className="divide-y divide-white/5">
            {ordersPag.pageItems.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{o.item_name}</p>
                  <p className="text-xs text-bone/40">{timeAgo(o.created_at)}</p>
                </div>
                <span className="text-sm font-black text-bone/70 tabular-nums inline-flex items-center gap-1"><Coin className="w-4 h-4 text-amber-300" /> −{o.price}</span>
                <span className={`${pill} ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span>
              </div>
            ))}
          </div>
        )}
        <Pagination {...ordersPag} />
      </div>
    </div>
  );
}
