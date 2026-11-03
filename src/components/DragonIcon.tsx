/** Dragãozinho voando de lado (Alpha Red), no mesmo estilo dos fantasminhas. */
export default function DragonIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 64" fill="currentColor" fillRule="evenodd" className={className} style={style} aria-hidden="true">
      {/* asa de trás */}
      <path opacity=".6" d="M66 38 C67 29 69 20 72 12 C78 13 84 15 90 19 C85 20 82 23 81 27 C78 26 75 28 73 32 C71 32 68 34 66 38 Z" />
      {/* corpo, pescoço, cabeça, patas e rabo */}
      <path d="M8 38 C20 44 29 44 37 41 C43 38 52 37 62 39 C68 40 72 38 76 33 C79 29 82 27 86 27 L92 28 L98 31 L92 32 L96 35 L88 35 C84 35 81 38 79 42 C76 47 70 49 63 49 L61 55 L57 55 L58 49 C53 49 49 49 45 48 L43 55 L39 55 L40 47 C30 47 19 44 8 38 Z M88.5 30.5 a1.3 1.3 0 1 0 0.01 0 Z" />
      {/* chifres */}
      <path d="M85 28 L80 19 L88 26 Z M88 27 L86 20 L91 27 Z" />
      {/* asa da frente */}
      <path d="M63 40 C62 29 61 19 58 9 C49 5 39 3 26 3 C32 9 36 15 37 22 C41 18 46 18 49 22 C52 18 56 19 58 23 C57 29 55 35 52 41 Z" />
      {/* ponta do rabo */}
      <path d="M1 34 L11 35 L6 43 Z" />
    </svg>
  );
}
