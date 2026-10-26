import GhostIcon from "@/components/GhostIcon";

// Posições fixas (mesmo HTML no servidor e no navegador)
const GHOSTS = [
  { left: "6%", size: 46, duration: 38, delay: 0 },
  { left: "22%", size: 28, duration: 46, delay: 12 },
  { left: "41%", size: 60, duration: 55, delay: 25 },
  { left: "63%", size: 34, duration: 42, delay: 6 },
  { left: "78%", size: 52, duration: 50, delay: 30 },
  { left: "92%", size: 26, duration: 36, delay: 18 },
];

export default function HauntBackground() {
  return (
    <div className="haunt-bg" aria-hidden="true">
      <div className="fog fog-1" />
      <div className="fog fog-2" />
      {GHOSTS.map((g, i) => (
        <span
          key={i}
          className="ghost-float"
          style={{ left: g.left, animationDuration: `${g.duration}s`, animationDelay: `-${g.delay}s` }}
        >
          <GhostIcon className="block" style={{ width: g.size, height: g.size * 1.12 }} />
        </span>
      ))}
    </div>
  );
}
