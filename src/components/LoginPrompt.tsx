"use client";

import { signIn } from "next-auth/react";
import { DiscordIcon } from "@/components/Navbar";

export default function LoginPrompt({ text }: { text: string }) {
  return (
    <div className="text-center py-4">
      {text && <p className="text-sm text-bone/60 mb-4">{text}</p>}
      <button onClick={() => signIn("discord")} className="btn-neon"><DiscordIcon className="w-4 h-4" /> Entrar com Discord</button>
    </div>
  );
}
