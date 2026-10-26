"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useDialog } from "@/components/Dialog";

export default function ProfileForm({ charName, level, isNew }: { charName: string; level: number | null; isNew: boolean }) {
  const router = useRouter();
  const dialog = useDialog();
  const [name, setName] = useState(charName);
  const [lvl, setLvl] = useState(level ? String(level) : "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/me", { charName: name, level: lvl ? Number(lvl) : null });
      if (isNew) await dialog.alert({ title: "Cadastro enviado!", message: "Agora é só esperar a liderança aprovar sua entrada no clã.", tone: "success" });
      router.refresh();
    } catch (err) {
      dialog.error(err, "Não foi possível salvar");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-[1fr_140px] gap-4">
      <div>
        <label className="label">Nome do personagem</label>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required placeholder="Como aparece no jogo" className="field" />
      </div>
      <div>
        <label className="label">Level</label>
        <input type="number" min={1} max={1000} value={lvl} onChange={(e) => setLvl(e.target.value)} placeholder="Ex.: 250" className="field" />
      </div>
      <div className="sm:col-span-2">
        <button disabled={busy} className="btn-neon">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isNew ? "Pedir entrada no clã" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
