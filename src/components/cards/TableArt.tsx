import { memo } from 'react';

/** Ilustraciones vectoriales de los juegos de mesa (Dominó, El Mentiroso, Ruleta VIP). viewBox 150×150, nítidas a cualquier tamaño. */
const P = { tl: [14, 14], tr: [36, 14], ml: [14, 25], mr: [36, 25], c: [25, 25], bl: [14, 36], br: [36, 36] } as const;
const PIPS: Record<number, (keyof typeof P)[]> = {
  0: [], 1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
};
const D = { tl: [27, 27], tr: [73, 27], ml: [27, 50], mr: [73, 50], c: [50, 50], bl: [27, 73], br: [73, 73] } as const;
const DPIPS: Record<number, (keyof typeof D)[]> = { 1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'] };

function Defs() {
  return (
    <defs>
      <linearGradient id="ta-ivory" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFBEA" /><stop offset=".6" stopColor="#F1E7C6" /><stop offset="1" stopColor="#D2C292" /></linearGradient>
      <linearGradient id="ta-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FCE38A" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#8B6914" /></linearGradient>
      <linearGradient id="ta-cup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0b0907" /><stop offset=".35" stopColor="#2f281c" /><stop offset=".62" stopColor="#15110b" /><stop offset="1" stopColor="#070605" /></linearGradient>
      <radialGradient id="ta-wood" cx=".5" cy=".4" r=".7"><stop offset="0" stopColor="#4a2e17" /><stop offset="1" stopColor="#1b0f07" /></radialGradient>
      <radialGradient id="ta-hub" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#FCE38A" /><stop offset=".45" stopColor="#B8860B" /><stop offset="1" stopColor="#4d3407" /></radialGradient>
    </defs>
  );
}

function Tile({ x, y, r, a, b }: { x: number; y: number; r: number; a: number; b: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(.78) translate(-50 -25)`} style={{ filter: 'drop-shadow(0 6px 5px rgba(0,0,0,.55))' }}>
      <rect x="1" y="1" width="98" height="48" rx="7" fill="url(#ta-ivory)" stroke="#8B7A45" strokeWidth="1.2" />
      <rect x="2.5" y="2.5" width="95" height="45" rx="5.5" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".8" />
      <line x1="50" y1="7" x2="50" y2="43" stroke="#D4AF37" strokeWidth="2" />
      <circle cx="50" cy="25" r="2.4" fill="#B8860B" />
      {[[a, 0], [b, 50]].map(([n, ox]) => PIPS[n!]!.map((k) => (
        <g key={`${ox}${k}`}><circle cx={P[k][0] + ox!} cy={P[k][1]} r="5.6" fill="#B8860B" opacity=".55" /><circle cx={P[k][0] + ox!} cy={P[k][1]} r="4.6" fill="#16120a" /></g>
      )))}
    </g>
  );
}

function Dice({ x, y, r, face, s = 1 }: { x: number; y: number; r: number; face: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${0.36 * s}) translate(-50 -50)`} style={{ filter: 'drop-shadow(0 6px 5px rgba(0,0,0,.55))' }}>
      <rect x="4" y="4" width="92" height="92" rx="20" fill="url(#ta-ivory)" stroke="#B8860B" strokeWidth="3" />
      <rect x="9" y="9" width="82" height="82" rx="15" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
      {DPIPS[face]!.map((k) => <g key={k}><circle cx={D[k][0]} cy={D[k][1]} r="10.5" fill="#B8860B" opacity=".6" /><circle cx={D[k][0]} cy={D[k][1]} r="8.6" fill={face === 1 ? '#8B1A1A' : '#16120a'} /></g>)}
    </g>
  );
}

const pt = (r: number, deg: number): string => { const a = (deg * Math.PI) / 180; return `${(75 + r * Math.sin(a)).toFixed(2)} ${(75 - r * Math.cos(a)).toFixed(2)}`; };

function Body({ id }: { id: string }) {
  if (id === 'domino') {
    return (
      <g>
        <ellipse cx="75" cy="128" rx="58" ry="9" fill="rgba(0,0,0,.5)" />
        <Tile x={44} y={92} r={-24} a={6} b={4} />
        <Tile x={96} y={96} r={14} a={4} b={2} />
        <Tile x={76} y={44} r={-4} a={6} b={6} />
      </g>
    );
  }
  if (id === 'mentiroso') {
    return (
      <g>
        <ellipse cx="75" cy="128" rx="58" ry="9" fill="rgba(0,0,0,.5)" />
        <Dice x={52} y={104} r={-14} face={5} s={1.15} />
        <Dice x={104} y={106} r={18} face={3} s={1.05} />
        <g transform="translate(70 12) rotate(-12 40 50)" style={{ filter: 'drop-shadow(0 8px 6px rgba(0,0,0,.55))' }}>
          <path d="M22 5 Q40 1 58 5 L77 74 Q40 84 3 74 Z" fill="url(#ta-cup)" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity=".55" transform="scale(.9)" />
          <ellipse cx="36" cy="4" rx="16" ry="3" fill="#2f281c" stroke="#D4AF37" strokeWidth=".8" strokeOpacity=".6" />
          <path d="M3 67 Q36 75 69 67 L70 73 Q36 82 2 73 Z" fill="url(#ta-gold)" />
        </g>
      </g>
    );
  }
  // ruleta
  return (
    <g>
      <ellipse cx="75" cy="132" rx="58" ry="8" fill="rgba(0,0,0,.5)" />
      <circle cx="75" cy="72" r="62" fill="url(#ta-wood)" stroke="url(#ta-gold)" strokeWidth="2.4" transform="translate(0 -2)" />
      <g transform="translate(0 -3)">
        <circle cx="75" cy="75" r="55" fill="#15110c" stroke="#8B6914" strokeWidth="1" />
        {Array.from({ length: 24 }, (_, i) => {
          const a0 = (i - 0.5) * 15; const a1 = (i + 0.5) * 15;
          const fill = i === 0 ? '#0A6B45' : i % 2 ? '#8E1020' : '#0A0A0C';
          return <path key={i} d={`M${pt(50, a0)} A50 50 0 0 1 ${pt(50, a1)} L${pt(32, a1)} A32 32 0 0 0 ${pt(32, a0)} Z`} fill={fill} stroke="#D4AF37" strokeWidth=".7" />;
        })}
        <circle cx="75" cy="75" r="32" fill="none" stroke="url(#ta-gold)" strokeWidth="1.6" />
        <circle cx="75" cy="75" r="27" fill="#2b1d0e" stroke="#8B6914" strokeWidth="1" />
        <circle cx="75" cy="75" r="21" fill="url(#ta-hub)" stroke="#FCE38A" strokeWidth="1" />
        {[0, 90].map((a) => <rect key={a} x="73.4" y="56" width="3.2" height="38" rx="1.6" fill="url(#ta-gold)" transform={`rotate(${a} 75 75)`} />)}
        <circle cx="75" cy="75" r="4.5" fill="#1b0f07" stroke="#FCE38A" strokeWidth="1" />
        <circle cx="105" cy="46" r="3.6" fill="#fff" stroke="#999" strokeWidth=".6" />
      </g>
      <g transform="translate(112 112)" style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,.55))' }}>
        <circle r="15" fill="#7f1d1d" stroke="#fde68a" strokeWidth="2.5" strokeDasharray="6 4" />
        <circle r="9" fill="none" stroke="#fde68a" strokeWidth="1.2" />
      </g>
    </g>
  );
}

export const TABLE_GAMES = new Set(['domino', 'mentiroso', 'ruleta']);

/** Ilustración 150×150 de un juego de mesa (el tamaño final lo da `size`). */
export const TableArt = memo(function TableArt({ id, size = 150 }: { id: string; size?: number }) {
  return (
    <svg viewBox="0 0 150 150" width={size} height={size} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <Defs />
      <Body id={id} />
    </svg>
  );
});

/** Cuerpo para incrustar en un emblema de viewBox 100×100. */
export function TableEmblemBody({ id }: { id: string }) {
  return <g transform="translate(0 4) scale(.66)"><Defs /><Body id={id} /></g>;
}
