"use client";

import { useEffect, useRef } from "react";

// Cemitério em loop no fundo do hero. Quem pede menos animação no sistema vê o primeiro quadro parado.
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => (reduce.matches ? video.pause() : video.play().catch(() => {}));
    apply();
    reduce.addEventListener("change", apply);
    return () => reduce.removeEventListener("change", apply);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <video ref={ref} src="/hero-cemiterio.mp4" autoPlay muted loop playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover" />
      {/* escurece o topo (menu), as bordas (foco no centro) e funde a base com a página */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_50%_45%,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}
