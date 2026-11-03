import GhostIcon from "@/components/GhostIcon";
import DragonIcon from "@/components/DragonIcon";

// Posições fixas (mesmo HTML no servidor e no navegador)
const GHOSTS = [
  { left: "6%", size: 46, duration: 38, delay: 0 },
  { left: "22%", size: 28, duration: 46, delay: 12 },
  { left: "41%", size: 60, duration: 55, delay: 25 },
  { left: "63%", size: 34, duration: 42, delay: 6 },
  { left: "78%", size: 52, duration: 50, delay: 30 },
  { left: "92%", size: 26, duration: 36, delay: 18 },
];

// Dragõezinhos da Alpha Red subindo entre os fantasmas
const DRAGONS = [
  { left: "14%", size: 54, duration: 48, delay: 20 },
  { left: "33%", size: 36, duration: 40, delay: 4 },
  { left: "54%", size: 46, duration: 52, delay: 36 },
  { left: "86%", size: 40, duration: 44, delay: 10 },
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
      {DRAGONS.map((d, i) => (
        <span
          key={`d${i}`}
          className="ghost-float dragon-float"
          style={{ left: d.left, animationDuration: `${d.duration}s`, animationDelay: `-${d.delay}s` }}
        >
          <DragonIcon className="block" style={{ width: d.size * 1.5, height: d.size * 0.96 }} />
        </span>
      ))}
    </div>
  );
}
