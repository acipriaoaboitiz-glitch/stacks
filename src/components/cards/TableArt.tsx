import { memo } from 'react';
import { CupGroup, IsoDefs, IsoDie } from '../../games/mentiroso/Dice.tsx';
import { WheelGroup } from '../../games/ruleta/Wheel.tsx';

/** Ilustraciones vectoriales de los juegos de mesa (Dominó, El Mentiroso, Ruleta VIP). viewBox 150×150, nítidas a cualquier tamaño. */
const P = { tl: [14, 14], tr: [36, 14], ml: [14, 25], mr: [36, 25], c: [25, 25], bl: [14, 36], br: [36, 36] } as const;
const PIPS: Record<number, (keyof typeof P)[]> = {
  0: [], 1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
};
function Defs() {
  return (
    <>
    <IsoDefs />
    <defs>
      <linearGradient id="ta-ivory" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFBEA" /><stop offset=".6" stopColor="#F1E7C6" /><stop offset="1" stopColor="#D2C292" /></linearGradient>
      <linearGradient id="ta-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FCE38A" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#8B6914" /></linearGradient>
      <linearGradient id="ta-cup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0b0907" /><stop offset=".35" stopColor="#2f281c" /><stop offset=".62" stopColor="#15110b" /><stop offset="1" stopColor="#070605" /></linearGradient>
      <radialGradient id="ta-wood" cx=".5" cy=".4" r=".7"><stop offset="0" stopColor="#4a2e17" /><stop offset="1" stopColor="#1b0f07" /></radialGradient>
      <radialGradient id="ta-hub" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#FCE38A" /><stop offset=".45" stopColor="#B8860B" /><stop offset="1" stopColor="#4d3407" /></radialGradient>
    </defs>
    </>
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
  return <g transform={`translate(${x} ${y}) rotate(${r}) scale(${0.62 * s}) translate(-50 -50)`} style={{ filter: 'drop-shadow(0 5px 4px rgba(0,0,0,.5))' }}><IsoDie face={face} /></g>;
}


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
        <Dice x={50} y={102} r={-10} face={5} s={1.25} />
        <Dice x={104} y={106} r={14} face={3} s={1.1} />
        <g transform="translate(58 16) scale(.8) rotate(-10 40 33)" style={{ filter: 'drop-shadow(0 8px 6px rgba(0,0,0,.55))' }}><CupGroup /></g>
            </g>
    );
  }
  // ruleta: la rueda completa (misma que en la mesa) y una ficha de casino
  return (
    <g>
      <ellipse cx="75" cy="134" rx="56" ry="7" fill="rgba(0,0,0,.5)" />
      <g transform="translate(9 4) scale(.66)"><WheelGroup /></g>
      <circle cx="104" cy="45" r="3.2" fill="#fff" stroke="#999" strokeWidth=".5" />
      <g transform="translate(116 114)" style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,.55))' }}>
        <circle r="16" fill="#7f1d1d" stroke="#fde68a" strokeWidth="2.6" strokeDasharray="6 4" />
        <circle r="10" fill="none" stroke="#fde68a" strokeWidth="1.2" />
        <circle r="5" fill="#fde68a" opacity=".85" />
      </g>
    </g>
  );
}

export const TABLE_GAMES = new Set(['domino', 'mentiroso', 'ruleta']);

/** Ilustración 150×150 de un juego de mesa (el tamaño final lo da `size`). */
export const TableArt = memo(function TableArt({ id, size = 150 }: { id: string; size?: number }) {
  return (
    <svg shapeRendering="geometricPrecision" viewBox="0 0 150 150" width={size} height={size} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <Defs />
      <Body id={id} />
    </svg>
  );
});

/** Cuerpo para incrustar en un emblema de viewBox 100×100. */
export function TableEmblemBody({ id }: { id: string }) {
  return <g transform="translate(0 4) scale(.66)"><Defs /><Body id={id} /></g>;
}
