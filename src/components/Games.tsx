"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Armchair, Loader2, LogIn, LogOut, Shuffle } from "lucide-react";
import { api } from "@/lib/api";
import { useDialog } from "@/components/Dialog";

/** Botão da sala: Entrar ou Sair. */
export function RoomButton({ roomId, joined, full }: { roomId: string; joined: boolean; full: boolean }) {
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  const go = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await api("/api/games", { action: joined ? "leave" : "join", roomId });
    } catch (err) {
      dialog.error(err, "Não foi possível");
    }
    router.refresh();
    lock.current = false;
    setBusy(false);
  };

  if (joined) {
    return <button onClick={go} disabled={busy} className="btn-ghost w-full !py-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Sair da sala</button>;
  }
  if (full) return <p className="w-full py-2 text-center text-xs font-black italic uppercase tracking-widest text-bone/35">Sala cheia</p>;
  return <button onClick={go} disabled={busy} className="btn-neon w-full !py-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Entrar</button>;
}

/** Banco do jogo: entrar ou sair. */
export function BenchButton({ modeId, joined }: { modeId: string; joined: boolean }) {
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api("/api/games", { action: joined ? "unbench" : "bench", modeId });
    } catch (err) {
      dialog.error(err, "Não foi possível");
    }
    router.refresh();
    setBusy(false);
  };

  return joined
    ? <button onClick={go} disabled={busy} className="btn-ghost !py-2 !px-4 !text-xs">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Sair do banco</button>
    : <button onClick={go} disabled={busy} className="btn-neon !py-2 !px-4 !text-xs">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Armchair className="w-4 h-4" />} Entrar no banco</button>;
}

/** Liderança: embaralha o banco e distribui nas salas com vaga. */
export function ShuffleButton({ modeId, modeName, count }: { modeId: string; modeName: string; count: number }) {
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (busy) return;
    const ok = await dialog.confirm({
      title: `Aleatorizar o banco do ${modeName}?`,
      message: `As ${count} pessoas do banco são embaralhadas e colocadas nas salas com vaga, uma sala de cada vez. Quem não couber continua no banco.`,
      confirmText: "Aleatorizar",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const { placed } = await api<{ placed: number }>("/api/games", { action: "shuffle", modeId });
      router.refresh();
      const left = count - placed;
      dialog.alert({ title: "Salas sorteadas!", tone: "success", message: placed ? `${placed} ${placed === 1 ? "pessoa foi colocada" : "pessoas foram colocadas"} nas salas.${left > 0 ? ` ${left} ${left === 1 ? "ficou" : "ficaram"} no banco por falta de vaga.` : ""}` : "Não havia vaga livre nas salas. O banco continua igual." });
    } catch (err) {
      dialog.error(err, "Não foi possível aleatorizar");
    }
    setBusy(false);
  };

  return <button onClick={go} disabled={busy || !count} title={count ? "Embaralhar o banco nas salas" : "O banco está vazio"} className="btn-ghost !py-2 !px-4 !text-xs !text-amber-200 hover:!border-amber-300/60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />} Aleatorizar</button>;
}

/** Atualiza a página a cada 15s (só com a aba visível) para ver quem entrou nas salas. */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [router, seconds]);
  return null;
}
