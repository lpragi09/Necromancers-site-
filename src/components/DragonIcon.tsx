/** Dragãozinho de asas abertas (Alpha Red), no mesmo estilo dos fantasminhas. */
export default function DragonIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" fillRule="evenodd" className={className} style={style} aria-hidden="true">
      <path d="M32 12 L29 19 L24 13 L25 22 C21 24 19 27 19 30 C13 29 8 25 4 18 C5 28 10 34 17 36 C13 37 9 37 6 35 C9 40 15 42 21 41 C22 45 25 48 28 49 C27 53 28 57 32 60 C31 56 32 53 34 50 C38 49 42 45 43 41 C49 42 55 40 58 35 C55 37 51 37 47 36 C54 34 59 28 60 18 C56 25 51 29 45 30 C45 27 43 24 39 22 L40 13 L35 19 Z M27.5 25.5 a1.8 1.8 0 1 0 0.01 0 Z M36.5 25.5 a1.8 1.8 0 1 0 0.01 0 Z" />
    </svg>
  );
}
