"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Enquanto a pessoa rola, a URL acompanha a seção da tela (#sorteios, #top, #mural...).
 * Vale para qualquer elemento com data-section e id. Troca sem criar histórico novo.
 */
export default function ScrollHash() {
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = [...document.querySelectorAll<HTMLElement>("[data-section][id]")];
      if (!sections.length) return;
      // A seção atual é a última cujo topo já passou de 40% da tela
      const line = window.innerHeight * 0.4;
      let current = "";
      for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s.id;
      const hash = current ? `#${current}` : "";
      if (hash === window.location.hash) return;
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${hash}`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [pathname]);

  return null;
}
