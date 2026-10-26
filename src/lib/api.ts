// Chamada das páginas para as rotas /api. Lança erro com a mensagem do servidor.
export async function api<T = unknown>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || `Erro ${res.status}`), { data: json, status: res.status });
  return json as T;
}

/** Painel: uma rota só, com `action`. */
export const adminApi = <T = unknown>(action: string, payload: Record<string, unknown> = {}) =>
  api<T>("/api/admin", { action, ...payload });
