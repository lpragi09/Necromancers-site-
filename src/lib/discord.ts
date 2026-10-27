// Avisos no Discord por webhook (variável DISCORD_WEBHOOK_URL, criada no canal do servidor).
// O site manda o aviso como card (embed), edita junto e apaga junto. Sem a variável, nada acontece.
import type { Post } from "@/lib/types";

const SITE_URL = process.env.NEXTAUTH_URL || "https://necromancers.vercel.app";

export const discordEnabled = () => !!process.env.DISCORD_WEBHOOK_URL;

const KIND = {
  aviso: { label: "📢 Aviso", color: 0xf43f5e },
  novidade: { label: "✨ Novidade", color: 0xa855f7 },
  evento: { label: "📅 Evento", color: 0x38bdf8 },
} as const;

const fmtEvent = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });

function payload(post: Post, mentionEveryone: boolean) {
  const k = KIND[post.kind];
  const limit = 4000;
  const body = post.body.length > limit ? `${post.body.slice(0, limit).trimEnd()}…\n\n*(continua no site)*` : post.body;
  const embed: Record<string, unknown> = {
    author: { name: `${k.label}${post.pinned ? " · 📌 Fixado" : ""}` },
    title: post.title.slice(0, 256),
    url: `${SITE_URL}/avisos/${post.id}`,
    description: body || undefined,
    color: k.color,
    footer: { text: "Necromancers · ver no site", icon_url: `${SITE_URL}/apple-icon.png` },
    timestamp: post.created_at,
  };
  if (post.image_url) embed.image = { url: post.image_url };
  if (post.kind === "evento" && post.event_at) embed.fields = [{ name: "🗓️ Quando", value: fmtEvent(post.event_at) }];
  return {
    username: "Necromancers",
    avatar_url: `${SITE_URL}/apple-icon.png`,
    content: mentionEveryone ? "@everyone" : "",
    allowed_mentions: { parse: mentionEveryone ? ["everyone"] : [] },
    embeds: [embed],
  };
}

async function call(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return null;
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 404) throw new Error(`Discord respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

/** Manda o aviso no canal. Devolve o id da mensagem para editar/apagar depois. */
export async function sendPost(post: Post, mentionEveryone: boolean): Promise<string | null> {
  const res = await call("POST", "?wait=true", payload(post, mentionEveryone));
  if (!res?.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id ?? null;
}

/** Edita a mensagem para ficar igual ao aviso (sem marcar @everyone de novo). Devolve false se ela não existe mais. */
export async function editPost(messageId: string, post: Post): Promise<boolean> {
  // Na edição o Discord só aceita o conteúdo e o card (nome e foto do autor ficam como foram enviados)
  const { embeds } = payload(post, false);
  const res = await call("PATCH", `/messages/${messageId}`, { embeds, allowed_mentions: { parse: [] } });
  return !!res?.ok;
}

/** Apaga a mensagem do canal (se já foi apagada no Discord, tudo bem). */
export async function deletePost(messageId: string) {
  await call("DELETE", `/messages/${messageId}`);
}
