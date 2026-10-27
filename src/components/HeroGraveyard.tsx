// Cemitério ao luar do hero, em camadas: céu, lua, colinas com capela, cerca e árvore seca,
// lápides na frente e névoa entre as camadas. Tudo SVG, sem imagem externa.

// Estrelas em posições fixas (mesmo HTML no servidor e no navegador)
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * 1600, y: r(2) * 380, s: r(3) < 0.12 ? 1.6 : r(3) < 0.4 ? 1.1 : 0.7, o: 0.25 + r(4) * 0.6, d: 2 + r(5) * 4 };
});

const FENCE = Array.from({ length: 34 }, (_, i) => 430 + i * 21);

const RIM = "rgba(196,181,253,0.28)";

function Tomb({ x, y, w, h, kind, tilt = 0 }: { x: number; y: number; w: number; h: number; kind: "round" | "cross" | "celtic" | "obelisk" | "flat"; tilt?: number }) {
  const t = `rotate(${tilt} ${x + w / 2} ${y + h})`;
  const common = { fill: "#020104", stroke: RIM, strokeWidth: 1.4 };
  if (kind === "round")
    return <path transform={t} {...common} d={`M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z`} />;
  if (kind === "flat")
    return <path transform={t} {...common} d={`M${x} ${y + h} V${y + 8} L${x + 6} ${y} H${x + w - 6} L${x + w} ${y + 8} V${y + h} Z`} />;
  if (kind === "obelisk")
    return <path transform={t} {...common} d={`M${x} ${y + h} L${x + w * 0.2} ${y + 14} L${x + w / 2} ${y} L${x + w * 0.8} ${y + 14} L${x + w} ${y + h} Z`} />;
  const cx = x + w / 2;
  const arm = w * 0.9;
  if (kind === "celtic")
    return (
      <g transform={t} {...common}>
        <path d={`M${cx - 5} ${y + h} V${y + 34} H${cx - arm / 2} V${y + 24} H${cx - 5} V${y} H${cx + 5} V${y + 24} H${cx + arm / 2} V${y + 34} H${cx + 5} V${y + h} Z`} />
        <circle cx={cx} cy={y + 29} r={13} fill="none" strokeWidth={4} stroke="#020104" />
        <circle cx={cx} cy={y + 29} r={13} fill="none" strokeWidth={1} />
      </g>
    );
  return <path transform={t} {...common} d={`M${cx - 5} ${y + h} V${y + 30} H${cx - arm / 2} V${y + 20} H${cx - 5} V${y} H${cx + 5} V${y + 20} H${cx + arm / 2} V${y + 30} H${cx + 5} V${y + h} Z`} />;
}

export default function HeroGraveyard() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Céu estrelado */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMin slice">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#efe9ff" opacity={s.o} className="star-twinkle" style={{ animationDuration: `${s.d}s`, animationDelay: `-${s.d * 0.7}s` }} />
        ))}
      </svg>

      {/* Lua com halo e crateras */}
      <div className="absolute top-[9%] right-[9%] w-24 h-24 sm:w-36 sm:h-36">
        <div className="absolute -inset-16 rounded-full bg-[radial-gradient(circle,rgba(196,181,253,0.28),transparent_65%)]" />
        <svg viewBox="0 0 100 100" className="relative w-full h-full drop-shadow-[0_0_40px_rgba(196,181,253,0.55)]">
          <defs>
            <radialGradient id="moon" cx="38%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#fbf9ff" />
              <stop offset="55%" stopColor="#ddd3fb" />
              <stop offset="100%" stopColor="#9d86e0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#moon)" />
          <g fill="#7c66c4" opacity="0.28">
            <circle cx="34" cy="38" r="9" />
            <circle cx="62" cy="30" r="5" />
            <circle cx="58" cy="62" r="11" />
            <circle cx="30" cy="66" r="5" />
            <circle cx="74" cy="50" r="4" />
            <circle cx="45" cy="18" r="3" />
          </g>
          <g fill="#ffffff" opacity="0.25">
            <circle cx="32" cy="36" r="6" />
            <circle cx="56" cy="60" r="7" />
          </g>
          {/* sombra do lado oposto à luz */}
          <path d="M50 2 A48 48 0 0 1 50 98 A40 48 0 0 0 50 2 Z" fill="#2a1a52" opacity="0.18" />
        </svg>
      </div>

      {/* Nuvens finas passando na frente da lua */}
      <div className="cloud-drift absolute top-[12%] right-[-10%] w-[45rem] h-24 rounded-full bg-[#140a26]/40 blur-2xl" />
      <div className="cloud-drift absolute top-[22%] right-[-30%] w-[38rem] h-16 rounded-full bg-[#1b0f33]/35 blur-2xl [animation-duration:110s]" />

      {/* Camada do fundo: colinas e a capela */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-[42%] sm:h-[62%]" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#24133f" />
            <stop offset="100%" stopColor="#0d0619" />
          </linearGradient>
        </defs>
        <path fill="url(#far)" d="M0 330 C140 290 260 300 380 318 C520 340 620 290 760 296 C900 302 980 262 1120 270 C1260 278 1380 312 1600 290 V600 H0Z" />
        {/* capela gótica ao longe */}
        <g fill="#140a26">
          <rect x="1010" y="196" width="70" height="90" />
          <path d="M1004 200 L1045 160 L1086 200 Z" />
          <rect x="1030" y="110" width="30" height="70" />
          <path d="M1026 114 L1045 52 L1064 114 Z" />
          <rect x="1043" y="34" width="4" height="22" />
          <rect x="1037" y="40" width="16" height="4" />
        </g>
        <path d="M1039 214 a6 9 0 0 1 12 0 v18 h-12 Z" fill="#e879f9" opacity="0.55" className="window-flicker" />
        <circle cx="1045" cy="220" r="22" fill="#e879f9" opacity="0.08" />
        {/* árvores secas pequenas no horizonte */}
        <g stroke="#140a26" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M300 320 V270 M300 292 L284 276 M300 284 L316 266 M300 276 L292 258" />
          <path d="M1400 300 V246 M1400 270 L1382 252 M1400 262 L1418 240" />
          <path d="M640 302 V262 M640 282 L626 268 M640 276 L652 260" />
        </g>
      </svg>

      <div className="hero-fog bottom-[24%] opacity-60" />

      {/* Camada do meio: cerca de ferro, árvore retorcida e mausoléu */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-[42%] sm:h-[62%]" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
        <path fill="#08040f" d="M0 430 C200 400 360 420 520 428 C700 436 860 404 1040 410 C1220 416 1400 436 1600 420 V600 H0Z" />
        {/* cerca */}
        <g fill="#08040f" stroke="rgba(196,181,253,0.12)" strokeWidth="1">
          <rect x="425" y="378" width="725" height="4" />
          <rect x="425" y="406" width="725" height="4" />
          {FENCE.map((x) => (
            <path key={x} d={`M${x} 432 V372 L${x + 3} 362 L${x + 6} 372 V432 Z`} />
          ))}
          <rect x="420" y="350" width="12" height="86" />
          <rect x="1146" y="350" width="12" height="86" />
          <circle cx="426" cy="346" r="7" />
          <circle cx="1152" cy="346" r="7" />
        </g>
        {/* árvore seca */}
        <g fill="#08040f">
          <path d="M150 600 C162 520 150 450 172 390 C184 352 170 320 186 270 L196 272 C184 320 200 352 190 392 C176 452 192 520 186 600 Z" />
        </g>
        <g stroke="#08040f" strokeLinecap="round" fill="none">
          <path strokeWidth="9" d="M180 360 C150 330 120 310 84 300" />
          <path strokeWidth="5" d="M84 300 C66 296 52 284 40 268 M120 312 C112 290 116 270 106 250" />
          <path strokeWidth="8" d="M188 330 C214 300 250 284 296 276" />
          <path strokeWidth="4" d="M296 276 C318 272 334 262 350 246 M250 286 C262 262 262 244 276 226" />
          <path strokeWidth="6" d="M190 290 C178 252 160 226 150 196" />
          <path strokeWidth="3" d="M150 196 C144 180 132 172 124 160 M162 230 C176 210 190 204 196 186" />
          <path strokeWidth="5" d="M192 276 C206 236 226 210 236 174" />
          <path strokeWidth="2.5" d="M236 174 C240 160 252 150 258 136 M226 206 C240 200 256 196 266 184" />
        </g>
        {/* mausoléu */}
        <g fill="#08040f" stroke="rgba(196,181,253,0.16)" strokeWidth="1.2">
          <rect x="1260" y="330" width="170" height="110" />
          <path d="M1248 334 L1345 278 L1442 334 Z" />
          <rect x="1252" y="430" width="186" height="14" />
          {[1276, 1306, 1384, 1414].map((x) => <rect key={x} x={x} y="346" width="10" height="86" />)}
          <path d="M1328 432 V376 a17 17 0 0 1 34 0 V432 Z" fill="#000" />
          <rect x="1342" y="250" width="6" height="34" />
          <rect x="1333" y="258" width="24" height="5" />
        </g>
      </svg>

      <div className="hero-fog bottom-[10%]" />

      {/* Camada da frente: lápides e mato, com contorno iluminado pela lua */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-[42%] sm:h-[62%]" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#030106" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
        </defs>
        <Tomb x={70} y={430} w={58} h={98} kind="round" tilt={-4} />
        <Tomb x={250} y={448} w={46} h={86} kind="cross" tilt={3} />
        <Tomb x={360} y={470} w={44} h={64} kind="flat" />
        <Tomb x={520} y={430} w={40} h={110} kind="obelisk" />
        <Tomb x={1040} y={452} w={50} h={84} kind="round" tilt={5} />
        <Tomb x={1160} y={420} w={56} h={118} kind="celtic" tilt={-2} />
        <Tomb x={1330} y={466} w={48} h={70} kind="flat" tilt={-6} />
        <Tomb x={1480} y={440} w={56} h={96} kind="round" tilt={2} />
        <path fill="url(#ground)" d="M0 520 C180 500 320 512 480 520 C640 528 760 534 900 528 C1080 520 1260 506 1600 516 V600 H0Z" />
        <path fill="none" stroke="rgba(196,181,253,0.18)" strokeWidth="1.5" d="M0 520 C180 500 320 512 480 520 C640 528 760 534 900 528 C1080 520 1260 506 1600 516" />
        {/* mato */}
        <g stroke="#000" strokeWidth="2" strokeLinecap="round">
          {[40, 140, 210, 330, 460, 600, 980, 1100, 1250, 1420, 1560].map((x, i) => (
            <path key={x} d={`M${x} ${522 - (i % 3)} l-6 -${14 + (i % 4) * 3} M${x} ${522 - (i % 3)} l2 -${18 + (i % 3) * 4} M${x} ${522 - (i % 3)} l8 -${12 + (i % 5) * 2}`} />
          ))}
        </g>
      </svg>

      <div className="hero-fog bottom-[-12%] [animation-duration:65s] [animation-direction:reverse] opacity-70" />

      {/* Morcegos */}
      {[{ top: "18%", left: "18%", d: "26s", s: 1 }, { top: "26%", left: "8%", d: "34s", s: 0.7 }, { top: "14%", left: "30%", d: "30s", s: 0.55 }].map((b, i) => (
        <svg key={i} viewBox="0 0 40 16" className="bat-fly absolute text-[#0a0514]" style={{ top: b.top, left: b.left, width: 40 * b.s, animationDuration: b.d }}>
          <path fill="currentColor" d="M20 9 C17 4 12 2 6 3 C9 5 9 8 7 10 C10 9 13 10 15 12 C17 10 18 10 20 12 C22 10 23 10 25 12 C27 10 30 9 33 10 C31 8 31 5 34 3 C28 2 23 4 20 9 Z" />
        </svg>
      ))}
    </div>
  );
}
