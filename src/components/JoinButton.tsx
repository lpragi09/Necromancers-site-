"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Check, Loader2, Sparkles, UserPlus } from "lucide-react";
import { DiscordIcon } from "@/components/Navbar";
import { api } from "@/lib/api";
import { useDialog } from "@/components/Dialog";

export default function JoinButton({ giveawayId, joined, canJoin }: { giveawayId: string; joined: boolean; canJoin: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false); // trava contra clique duplo antes do re-render

  if (status !== "authenticated") {
    return <button onClick={() => signIn("discord")} className="btn-ghost w-full"><DiscordIcon className="w-4 h-4" /> Entrar para participar</button>;
  }
  if (!canJoin) {
    return <Link href="/perfil" className="btn-ghost w-full"><UserPlus className="w-4 h-4" /> Cadastre seu personagem</Link>;
  }

  const toggle = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await api("/api/sorteios", { giveawayId, leave: joined });
      router.refresh();
    } catch (err) {
      dialog.error(err, "Não foi possível");
    }
    lock.current = false;
    setBusy(false);
  };

  return joined ? (
    <div className="flex items-center gap-2">
      <span className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-spirit/50 bg-spirit/15 py-2.5 text-sm font-black italic uppercase text-bone">
        <Check className="w-4 h-4 text-spirit" /> Você está participando
      </span>
      <button onClick={toggle} disabled={busy} className="text-xs text-bone/40 hover:text-rose-300 px-2">sair</button>
    </div>
  ) : (
    <button onClick={toggle} disabled={busy} className="btn-neon w-full">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Quero participar
    </button>
  );
}
