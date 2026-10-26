"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, ShieldCheck, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { FairDraw } from "@/lib/fair";
import { useDialog } from "@/components/Dialog";
import { useSounds } from "@/lib/useSounds";
import DrawCountdown from "@/components/DrawCountdown";
import Avatar from "@/components/Avatar";

const ITEM_W = 160;
const ITEM_STEP = ITEM_W + 16;
const REEL_SIZE = 50;
const WINNER_INDEX = 40;
const SPIN_MS = 9000;

type Phase = "countdown" | "spinning" | "result";

// Sorteio entre os membros inscritos. Quem ganha sai do servidor (provably fair);
// a roleta só mostra. Confirmar grava o ganhador no sorteio.
export default function GiveawayDraw({ giveaway, onClose, onConfirmed }: {
  giveaway: { id: string; title: string; prize: string };
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("countdown");
  const [until, setUntil] = useState<Promise<FairDraw> | null>(null);
  const [draw, setDraw] = useState<FairDraw | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const reelRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spinId = useRef(0);
  const sounds = useSounds();
  const dialog = useDialog();

  const start = () => {
    sounds.unlock();
    const p = adminApi<{ data: FairDraw }>("fairDraw", { targetId: giveaway.id }).then((r) => r.data);
    p.catch(() => {}); // mostrado depois da contagem
    setDraw(null);
    setUntil(p);
    setPhase("countdown");
  };

  const started = useRef(false); // o modo de desenvolvimento do React roda o efeito duas vezes
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      start();
    }
    return () => { spinId.current++; timers.current.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = (d: FairDraw) => {
    const labels = d.entries.map((e) => e.label);
    const reel = Array.from({ length: REEL_SIZE }, () => labels[Math.floor(Math.random() * labels.length)]);
    reel[WINNER_INDEX] = d.winner_label ?? "";
    setItems(reel);
    setDraw(d);
    setPhase("spinning");

    // Quadro a quadro (funciona com "efeitos de animação" do sistema desligados); o resultado é garantido pelo relógio
    const id = ++spinId.current;
    const target = WINNER_INDEX * ITEM_STEP;
    let startedAt = 0;
    let lastIndex = -1;
    const frame = (now: number) => {
      const el = reelRef.current;
      if (spinId.current !== id || !el) return;
      if (!startedAt) startedAt = now;
      const t = Math.min(1, (now - startedAt) / SPIN_MS);
      const x = target * (1 - Math.pow(1 - t, 4));
      el.style.transform = `translateX(${-x}px)`;
      const index = Math.round(x / ITEM_STEP);
      if (index !== lastIndex) {
        lastIndex = index;
        sounds.tick(t);
      }
      if (t < 1) requestAnimationFrame(frame);
    };
    timers.current = [
      setTimeout(() => requestAnimationFrame(frame), 100),
      setTimeout(() => {
        spinId.current++;
        if (reelRef.current) reelRef.current.style.transform = `translateX(${-target}px)`;
        sounds.win();
        setPhase("result");
      }, SPIN_MS + 100),
    ];
  };

  const afterCountdown = () => {
    until?.then(spin, (err) => {
      dialog.error(err, "Não foi possível sortear");
      onClose();
    });
  };

  const discardAndRedraw = () => {
    if (draw) adminApi("fairStatus", { id: draw.id, status: "skipped" }).catch(() => {});
    start();
  };

  const confirm = async () => {
    if (!draw) return;
    setBusy(true);
    try {
      await adminApi("confirmGiveawayWinner", { drawId: draw.id });
      onConfirmed();
    } catch (err) {
      dialog.error(err, "Não foi possível salvar o ganhador");
    }
    setBusy(false);
  };

  const cancel = () => {
    spinId.current++;
    timers.current.forEach(clearTimeout);
    if (draw) adminApi("fairStatus", { id: draw.id, status: "skipped" }).catch(() => {});
    onClose();
  };

  return createPortal(
    <>
      {phase === "countdown" && until && (
        <DrawCountdown until={until} onStep={(n) => sounds.tick(n === 1 ? 0.9 : n === 2 ? 0.5 : 0.15)} onDone={afterCountdown} />
      )}

      {phase !== "countdown" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-void/95 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-5xl flex flex-col items-center">
            <h2 className={`font-title text-3xl sm:text-4xl font-bold uppercase tracking-wider mb-10 ecto-text ${phase === "result" ? "" : "animate-pulse"}`}>
              {phase === "result" ? "A alma escolhida!" : "Invocando..."}
            </h2>

            <div className="relative w-full h-48 bg-crypt border-y-2 border-spirit/30 overflow-hidden shadow-[0_0_60px_rgba(167,139,250,0.15)] flex items-center">
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-ecto z-50 -translate-x-1/2 shadow-[0_0_18px_rgba(192,132,252,1)]" />
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-crypt to-transparent z-40" />
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-crypt to-transparent z-40" />
              <div ref={reelRef} className="flex gap-4 w-full" style={{ paddingLeft: `calc(50% - ${ITEM_W / 2}px)` }}>
                {items.map((label, i) => (
                  <div key={i} className="w-[160px] h-[144px] flex-shrink-0 bg-void border border-spirit/15 rounded-xl flex flex-col items-center justify-center gap-2 px-2">
                    <Avatar name={label} size={52} />
                    <span className="text-sm font-bold text-bone text-center truncate w-full">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {phase === "spinning" && (
              <div className="mt-10 flex items-center gap-3">
                <button onClick={cancel} className="btn-ghost !text-rose-300 !border-rose-400/40"><X className="w-4 h-4" /> Cancelar</button>
                <button onClick={() => sounds.setEnabled(!sounds.enabled)} title={sounds.enabled ? "Desligar som" : "Ligar som"} className="btn-ghost !px-3">
                  {sounds.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            )}

            {phase === "result" && draw && (
              <div className="mt-10 crypt-card w-full max-w-md p-8 text-center animate-scale-up relative overflow-hidden !border-ecto/40">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-spirit via-ecto to-hex" />
                <button onClick={cancel} title="Fechar (o giro fica como descartado)" className="absolute top-4 right-4 text-bone/40 hover:text-bone"><X className="w-5 h-5" /></button>
                <Avatar name={draw.winner_label ?? "?"} size={92} className="mx-auto mb-4 ring-4 ring-ecto/60 shadow-[0_0_30px_rgba(192,132,252,0.45)]" />
                <h3 className="font-title text-3xl font-bold text-bone truncate">{draw.winner_label}</h3>
                <p className="text-bone/50 mt-1 mb-2 text-xs uppercase tracking-widest">Ganhou · {giveaway.prize}</p>
                <a href={`/provably-fair?id=${draw.id}`} target="_blank" className="inline-flex items-center gap-1.5 mb-6 text-[11px] font-bold text-spirit hover:text-ecto uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ver prova do sorteio
                </a>
                <div className="flex gap-3">
                  <button onClick={confirm} disabled={busy} className="btn-neon flex-1 !text-xs uppercase tracking-widest"><Trophy className="w-4 h-4" /> Confirmar</button>
                  <button onClick={discardAndRedraw} disabled={busy} className="btn-ghost flex-1 !text-xs uppercase tracking-widest"><RotateCcw className="w-4 h-4" /> Sortear de novo</button>
                </div>
                <p className="mt-4 text-[11px] text-bone/40">Confirmar grava o ganhador no sorteio. &quot;Sortear de novo&quot; fica registrado como descartado.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
