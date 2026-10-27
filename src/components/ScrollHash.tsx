"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const SECTION_EVENT = "sectionchange";

/**
 * Enquanto a pessoa rola, a URL acompanha a seção da tela (#sorteios, #top, #mural...).
 * Vale para qualquer elemento com data-section e id. Troca sem criar histórico novo
 * e avisa o menu (evento "sectionchange") para ele destacar o link certo.
 */
export default function ScrollHash() {
  const pathname = usePathname();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      timer = undefined;
      const sections = [...document.querySelectorAll<HTMLElement>("[data-section][id]")];
      if (!sections.length) return;
      // A seção atual é a última cujo topo já passou de 40% da tela
      const line = window.innerHeight * 0.4;
      let current = "";
      for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s.id;
      const hash = current ? `#${current}` : "";
      if (hash === window.location.hash) return;
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${hash}`);
      window.dispatchEvent(new CustomEvent(SECTION_EVENT, { detail: current }));
    };
    // No máximo uma conta a cada 80 ms enquanto rola
    const onScroll = () => { if (!timer) timer = setTimeout(update, 80); };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, [pathname]);

  return null;
}
