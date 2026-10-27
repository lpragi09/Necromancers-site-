"use client";

/* eslint-disable @next/next/no-img-element */
// Peças do painel da liderança, usadas por todas as abas (inclusive a da lojinha)
import { useRef, useState } from "react";
import { Eye, ImagePlus, Loader2, Trash2, type LucideIcon } from "lucide-react";
import { adminApi } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { useDialog } from "@/components/Dialog";
import GhostIcon from "@/components/GhostIcon";

// datetime-local <-> ISO, sempre no fuso de quem está usando o painel
export const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

/** Executa uma ação do painel com trava contra clique duplo e popup de erro. */
export function useAction(reload: () => Promise<void>) {
  const dialog = useDialog();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = async (action: string, payload: Record<string, unknown> = {}, confirm?: { title: string; message?: string }): Promise<false | Record<string, unknown>> => {
    if (lock.current) return false;
    if (confirm && !(await dialog.confirm({ ...confirm, tone: "danger", confirmText: "Sim" }))) return false;
    lock.current = true;
    setBusy(true);
    try {
      const res = await adminApi<Record<string, unknown>>(action, payload);
      await reload();
      return res ?? {}; // resposta do servidor (ex.: aviso de falha no Discord); vale como "deu certo"
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

// ======================= Peças do painel =======================

/** Bloco com cabeçalho: ícone, título, subtítulo e uma ação à direita */
export function Panel({ icon: Icon, title, subtitle, action, children, className = "" }: {
  icon: LucideIcon; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`crypt-card overflow-hidden ${className}`}>
      <header className="flex flex-wrap items-center gap-3 px-5 sm:px-6 py-4 border-b border-white/5 bg-gradient-to-r from-spirit/[0.07] to-transparent">
        <span className="w-9 h-9 shrink-0 rounded-lg bg-spirit/15 border border-spirit/30 flex items-center justify-center">
          <Icon className="w-4 h-4 text-spirit" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-title text-base sm:text-lg">{title}</h2>
          {subtitle && <p className="text-xs italic text-bone/45">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] italic text-bone/35">{hint}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${checked ? "border-spirit/40 bg-spirit/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
      <span className={`relative w-10 h-6 shrink-0 rounded-full transition-colors ${checked ? "bg-spirit shadow-[0_0_12px_rgba(168,85,247,0.6)]" : "bg-white/10"}`}>
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="block text-[11px] text-bone/40">{hint}</span>}
      </span>
    </button>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: LucideIcon; count?: number }[];
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-black/60 border border-white/10">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button type="button" key={o.value} onClick={() => onChange(o.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black italic uppercase tracking-wide transition-all ${on ? "bg-spirit text-white shadow-[0_0_14px_rgba(168,85,247,0.45)]" : "text-bone/55 hover:text-bone hover:bg-white/5"}`}>
            {o.icon && <o.icon className="w-3.5 h-3.5" />} {o.label}
            {o.count !== undefined && <span className={`tabular-nums ${on ? "text-white/80" : "text-bone/35"}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const PILL = {
  purple: "text-spirit border-spirit/40 bg-spirit/10",
  green: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
  amber: "text-amber-300 border-amber-400/40 bg-amber-400/10",
  red: "text-rose-300 border-rose-400/40 bg-rose-500/10",
  gray: "text-bone/50 border-white/15 bg-white/5",
};
export function Pill({ tone, children }: { tone: keyof typeof PILL; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-black italic uppercase tracking-widest whitespace-nowrap ${PILL[tone]}`}>{children}</span>;
}

export function IconBtn({ onClick, title, children, danger = false, disabled = false }: { onClick: () => void; title: string; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title} disabled={disabled}
      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border transition-all disabled:opacity-40 ${danger ? "border-rose-400/20 text-rose-300/80 hover:text-rose-200 hover:bg-rose-500/15 hover:border-rose-400/50" : "border-white/10 text-bone/60 hover:text-white hover:bg-spirit/20 hover:border-spirit/50"}`}>
      {children}
    </button>
  );
}

/** Linha das listas: cartãozinho com borda que acende no hover */
export function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl border border-white/5 bg-white/[0.015] hover:border-spirit/30 hover:bg-spirit/[0.04] transition-colors ${className}`}>{children}</div>;
}

export function EmptyLine({ text }: { text: string }) {
  return (
    <div className="py-8 text-center">
      <GhostIcon className="w-8 h-9 mx-auto text-spirit/30" />
      <p className="mt-3 text-sm italic text-bone/40">{text}</p>
    </div>
  );
}

/** Rodapé dos formulários: dica à esquerda, botões à direita */
export function FormFooter({ hint, children }: { hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-1 border-t border-white/5">
      <p className="text-[11px] italic text-bone/35">{hint}</p>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

/** Prévia ao vivo ao lado do formulário */
export function Preview({ children }: { children: React.ReactNode }) {
  return (
    <div className="xl:sticky xl:top-24">
      <p className="mb-3 flex items-center gap-2 text-[10px] font-black italic uppercase tracking-[0.25em] text-bone/45">
        <Eye className="w-3.5 h-3.5 text-spirit" /> Prévia no site
      </p>
      <div className="pointer-events-none select-none">{children}</div>
    </div>
  );
}

/** Imagem ainda subindo: a prévia usa o arquivo local (blob:) até o link definitivo chegar. Não dá pra salvar assim. */
export const isUploading = (url: string) => url.startsWith("blob:");

/** Tamanhos ideais de cada lugar onde a imagem aparece no site (largura × altura). */
export const IMAGE_SIZES = {
  post: { w: 1600, h: 700, ratio: "16:7", aspect: "aspect-[16/7]" },
  giveaway: { w: 1600, h: 900, ratio: "16:9", aspect: "aspect-[16/9]" },
  shop: { w: 1200, h: 750, ratio: "16:10", aspect: "aspect-[16/10]" },
} as const;

export function ImageField({ value, onChange, size }: { value: string; onChange: (url: string) => void; size: keyof typeof IMAGE_SIZES }) {
  const dialog = useDialog();
  const ref = useRef<HTMLInputElement>(null);
  const job = useRef(0); // trocar a imagem no meio do envio descarta o envio antigo
  const [over, setOver] = useState(false);
  const spec = IMAGE_SIZES[size];
  const busy = isUploading(value);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return dialog.error(new Error("Escolha um arquivo de imagem."), "Arquivo inválido");
    const id = ++job.current;
    const local = URL.createObjectURL(file);
    onChange(local); // aparece na hora, na prévia também
    try {
      const image = await compressImage(file, Math.max(spec.w, spec.h), 0.82);
      const { url } = await adminApi<{ url: string }>("uploadImage", { image });
      if (job.current === id) onChange(url);
    } catch (err) {
      if (job.current === id) onChange("");
      dialog.error(err, "Falha ao enviar a imagem");
    } finally {
      URL.revokeObjectURL(local);
    }
  };
  const remove = () => { job.current++; onChange(""); };

  return (
    <div>
      <label className="label">Imagem (opcional) <span className="normal-case tracking-normal text-spirit/80">· ideal {spec.w} × {spec.h} px ({spec.ratio})</span></label>
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-white/10">
          <img src={value} alt="" className={`w-full ${spec.aspect} object-cover`} />
          {busy && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center gap-2 text-sm font-black italic uppercase">
              <Loader2 className="w-5 h-5 text-spirit animate-spin" /> Enviando...
            </div>
          )}
          {!busy && (
            <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button type="button" onClick={() => ref.current?.click()} className="btn-ghost !py-2"><ImagePlus className="w-4 h-4" /> Trocar</button>
              <button type="button" onClick={remove} className="btn-ghost !py-2 !text-rose-300"><Trash2 className="w-4 h-4" /> Remover</button>
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
          className={`w-full rounded-xl border-2 border-dashed py-7 flex flex-col items-center gap-2 transition-colors ${over ? "border-spirit bg-spirit/10" : "border-white/10 bg-white/[0.02] hover:border-spirit/50 hover:bg-spirit/5"}`}>
          <span className="w-11 h-11 rounded-xl bg-spirit/15 border border-spirit/30 flex items-center justify-center"><ImagePlus className="w-5 h-5 text-spirit" /></span>
          <span className="text-sm font-bold text-bone/80">Clique ou arraste uma imagem</span>
          <span className="text-[11px] text-bone/45">Tamanho ideal: <b className="text-bone/70">{spec.w} × {spec.h} px</b> (proporção {spec.ratio})</span>
          <span className="text-[11px] text-bone/30">JPG, PNG ou WEBP · a gente comprime sozinho</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}
