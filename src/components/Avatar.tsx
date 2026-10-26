/* eslint-disable @next/next/no-img-element */
import GhostIcon from "@/components/GhostIcon";

// Foto do Discord; sem foto, um fantasminha com a cor tirada do nome
const HUES = [265, 160, 290, 190, 320, 140];
const hueOf = (name: string) => HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % HUES.length];

export default function Avatar({ src, name, size = 40, className = "" }: { src?: string | null; name: string; size?: number; className?: string }) {
  if (src) {
    return <img src={src} alt="" width={size} height={size} className={`rounded-full object-cover shrink-0 ${className}`} style={{ width: size, height: size }} />;
  }
  const hue = hueOf(name || "?");
  return (
    <span
      className={`rounded-full shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size, background: `radial-gradient(circle at 30% 25%, hsl(${hue} 70% 35%), hsl(${hue} 60% 12%))` }}
    >
      <GhostIcon style={{ width: size * 0.5, height: size * 0.56, color: `hsl(${hue} 90% 85%)` }} />
    </span>
  );
}
