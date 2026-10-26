// Fantasminha do clã (SVG próprio, herda a cor do texto)
export default function GhostIcon({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 72" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M32 2C16.5 2 5 13.8 5 29.5V66c0 2.6 3 3.9 4.9 2.1l5-4.7 5.4 5.1c1.2 1.1 3 1.1 4.2 0l5.3-5.1 5.3 5.1c1.2 1.1 3 1.1 4.2 0l5.4-5.1 5 4.7c1.9 1.8 4.9.5 4.9-2.1V29.5C59 13.8 47.5 2 32 2Z" />
      <ellipse cx="23" cy="30" rx="5" ry="7" fill="var(--color-void, #05040a)" />
      <ellipse cx="41" cy="30" rx="5" ry="7" fill="var(--color-void, #05040a)" />
      <path d="M25 46c4 3.5 10 3.5 14 0" stroke="var(--color-void, #05040a)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
