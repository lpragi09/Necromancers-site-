/* eslint-disable @next/next/no-img-element */

/** Evaldocoin, a moeda da lojinha. Mesmo uso de um ícone: o tamanho vem do className. */
export default function Coin({ className = "w-4 h-4" }: { className?: string }) {
  return <img src="/loja/evaldocoin.webp" alt="Evaldocoins" className={`inline-block shrink-0 rounded-full object-cover ${className}`} />;
}
