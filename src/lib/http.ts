// Respostas das rotas /api
export const fail = (error: string, status = 400) => Response.json({ error }, { status });
export const ok = (data: unknown = { ok: true }) => Response.json(data, { headers: { "Cache-Control": "no-store" } });

export const DEMO_MESSAGE = "Site em modo demonstração: configure o Supabase nas variáveis de ambiente para salvar dados.";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Converte o data URL (imagem já comprimida no navegador) em bytes, conferindo tipo e tamanho. */
export function decodeImage(dataUrl: unknown): { bytes: Buffer; contentType: string; ext: string } | null {
  if (typeof dataUrl !== "string") return null;
  const m = dataUrl.match(/^data:(image\/(webp|png|jpeg|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const bytes = Buffer.from(m[3], "base64");
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
  return { bytes, contentType: m[1], ext: m[2] === "jpeg" ? "jpg" : m[2] };
}

export const cleanText = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
