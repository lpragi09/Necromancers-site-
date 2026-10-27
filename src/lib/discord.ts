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
    components: linkButton(post),
  };
}

// Botão de link embaixo do card (webhook comum pode mandar botão de link com ?with_components=true)
const linkButton = (post: Post) => [
  { type: 1, components: [{ type: 2, style: 5, label: "Ver no site", emoji: { name: "👻" }, url: `${SITE_URL}/avisos/${post.id}` }] },
];

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

// Se o Discord recusar o botão, manda de novo sem ele: o aviso sempre chega
const withoutButton = <T extends { components?: unknown }>(body: T) => ({ ...body, components: [] });
const rejectedButton = (err: unknown) => err instanceof Error && /Discord respondeu 400/.test(err.message);

/** Manda o aviso no canal. Devolve o id da mensagem para editar/apagar depois. */
export async function sendPost(post: Post, mentionEveryone: boolean): Promise<string | null> {
  const body = payload(post, mentionEveryone);
  let res: Response | null;
  try {
    res = await call("POST", "?wait=true&with_components=true", body);
  } catch (err) {
    if (!rejectedButton(err)) throw err;
    res = await call("POST", "?wait=true", withoutButton(body));
  }
  if (!res?.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id ?? null;
}

/** Edita a mensagem para ficar igual ao aviso (sem marcar @everyone de novo). Devolve false se ela não existe mais. */
export async function editPost(messageId: string, post: Post): Promise<boolean> {
  // Na edição o Discord só aceita o conteúdo e o card (nome e foto do autor ficam como foram enviados)
  const { embeds, components } = payload(post, false);
  const body = { embeds, components, allowed_mentions: { parse: [] } };
  let res: Response | null;
  try {
    res = await call("PATCH", `/messages/${messageId}?with_components=true`, body);
  } catch (err) {
    if (!rejectedButton(err)) throw err;
    res = await call("PATCH", `/messages/${messageId}`, withoutButton(body));
  }
  return !!res?.ok;
}

/** Apaga a mensagem do canal (se já foi apagada no Discord, tudo bem). */
export async function deletePost(messageId: string) {
  await call("DELETE", `/messages/${messageId}`);
}
