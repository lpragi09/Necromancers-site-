"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, LogOut } from "lucide-react";
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
