"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { useDialog } from "@/components/Dialog";
import { RARITY, type DropItem } from "@/lib/types";

// Formulário de drop: item da lista + quantidade + print (comprimido no navegador antes de enviar)
export default function DropForm({ items }: { items: DropItem[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const item = items.find((i) => i.id === itemId);
  const qty = Math.max(1, Math.min(999, Math.floor(Number(quantity)) || 1));

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      setProof(await compressImage(file));
    } catch (err) {
      dialog.error(err, "Imagem inválida");
    }
  };

  // Print do jogo costuma estar na área de transferência: Ctrl+V em qualquer lugar da página anexa
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
    if (!proof) return dialog.alert({ title: "Falta o print", message: "Anexe um print mostrando o drop." });
    lock.current = true;
    setBusy(true);
    try {
      await api("/api/drops", { itemId, quantity: qty, note, proof });
      setProof(null);
      setNote("");
      setQuantity("1");
      await dialog.alert({ title: "Drop enviado!", message: "A liderança vai conferir o print. Assim que aprovar, os pontos entram no ranking.", tone: "success" });
      router.refresh();
    } catch (err) {
      dialog.error(err, "Não foi possível enviar");
    }
    lock.current = false;
    setBusy(false);
  };

  if (!items.length) return <p className="text-sm text-bone/50">A liderança ainda não cadastrou os itens que valem pontos.</p>;

  return (
    <form onSubmit={submit} className="grid md:grid-cols-[1fr_220px] gap-5">
      <div className="space-y-4">
        <div>
          <label className="label">Item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="field">
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name} · {RARITY[i.rarity].label} · {i.points} pts</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <div>
            <label className="label">Quantidade</label>
            <input type="number" min={1} max={999} value={quantity} onChange={(e) => setQuantity(e.target.value)} onBlur={() => setQuantity(String(qty))} className="field" />
          </div>
          <div>
            <label className="label">Observação (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ex.: hunt de Ghost Tower com o Kuroshi" className="field" />
          </div>
        </div>
        <p className="text-sm text-bone/55">Vale <b className="text-spirit">{((item?.points ?? 0) * qty).toLocaleString("pt-BR")} pontos</b> se aprovado.</p>
        <button disabled={busy} className="btn-neon">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar para aprovação
        </button>
      </div>

      <button type="button" onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
        className={`relative rounded-xl border-2 border-dashed transition-colors min-h-48 overflow-hidden flex items-center justify-center ${over ? "border-spirit bg-spirit/10" : "border-white/10 hover:border-spirit/50 hover:bg-spirit/5"}`}>
        {proof ? (
          <>
            <img src={proof} alt="Print do drop" className="absolute inset-0 w-full h-full object-contain bg-checker" />
            <span className="absolute bottom-2 inset-x-2 rounded-md bg-black/70 py-1 text-[10px] font-black italic uppercase text-bone/80">Clique para trocar</span>
          </>
        ) : (
          <span className="text-center px-4 text-bone/50 text-sm">
            <ImagePlus className="w-8 h-8 mx-auto mb-2 text-spirit" />
            <b className="block text-bone/80">Anexe o print</b>
            <span className="block text-xs mt-1">Clique, arraste ou cole com <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] not-italic font-bold">Ctrl+V</kbd></span>
          </span>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      </button>
    </form>
  );
}
