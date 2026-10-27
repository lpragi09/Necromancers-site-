import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Params = Record<string, string | string[] | undefined>;

/** Lê o número da página de um parâmetro da URL (?pagina=2). Sempre devolve 1 ou mais. */
export function pageFrom(params: Params, key = "pagina") {
  const raw = Array.isArray(params[key]) ? params[key][0] : params[key];
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 1 ? n : 1;
}

/** Recorta uma lista já carregada para a página pedida. */
export function slicePage<T>(items: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pageCount);
  return { items: items.slice((current - 1) * size, current * size), page: current, pageCount, total: items.length };
}

function pageList(page: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(count - 1, page + 1);
  if (from > 2) out.push("…");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < count - 1) out.push("…");
  out.push(count);
  return out;
}

/**
 * Barra de páginas das páginas públicas (links de verdade, renderizados no servidor).
 * Mantém os outros parâmetros da URL e some quando cabe tudo numa página.
 */
export default function PageNav({ page, pageCount, path, params = {}, param = "pagina", anchor }: {
  page: number; pageCount: number; path: string; params?: Params; param?: string; anchor?: string;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      const val = Array.isArray(v) ? v[0] : v;
      if (val && k !== param) q.set(k, val);
    }
    if (p > 1) q.set(param, String(p));
    const qs = q.toString();
    return `${path}${qs ? `?${qs}` : ""}${anchor ? `#${anchor}` : ""}`;
  };
  const btn = "min-w-9 h-9 px-2 rounded-lg flex items-center justify-center text-sm font-black italic transition-colors";
  return (
    <nav aria-label="Páginas" className="mt-8 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} scroll={false} aria-label="Página anterior" className={`${btn} text-bone/60 hover:bg-white/5 hover:text-bone`}><ChevronLeft className="w-4 h-4" /></Link>
      ) : (
        <span className={`${btn} text-bone/20`}><ChevronLeft className="w-4 h-4" /></span>
      )}
      {pageList(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-bone/30">…</span>
        ) : (
          <Link key={p} href={href(p)} scroll={false} aria-current={p === page ? "page" : undefined}
            className={`${btn} ${p === page ? "bg-spirit text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]" : "text-bone/60 hover:bg-white/5 hover:text-bone"}`}>
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} scroll={false} aria-label="Próxima página" className={`${btn} text-bone/60 hover:bg-white/5 hover:text-bone`}><ChevronRight className="w-4 h-4" /></Link>
      ) : (
        <span className={`${btn} text-bone/20`}><ChevronRight className="w-4 h-4" /></span>
      )}
    </nav>
  );
}
