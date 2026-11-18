import { memo } from 'react';

const G = { tl: [27, 27], tr: [73, 27], ml: [27, 50], mr: [73, 50], c: [50, 50], bl: [27, 73], br: [73, 73] } as const;
const PIPS: Record<number, (keyof typeof G)[]> = {
  1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
};

interface DieProps {
  face: number;
  /** Lado como longitud CSS. */
  size: string;
  /** Resalta el dado (coincide con la apuesta durante el recuento). */
  hit?: boolean;
  dim?: boolean;
  className?: string;
}

/** Dado de marfil con puntos negros y aro dorado (vectorial). */
export const Die = memo(function Die({ face, size, hit, dim, className = '' }: DieProps) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size, opacity: dim ? 0.4 : 1, transition: 'opacity .2s' }}>
      <svg viewBox="0 0 100 100" aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%', filter: hit ? 'drop-shadow(0 0 7px rgba(252,227,138,.95))' : 'drop-shadow(0 2px 2px rgba(0,0,0,.55))' }}>
        <defs>
          <linearGradient id="die-ivory" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFBEA" /><stop offset=".65" stopColor="#F1E7C6" /><stop offset="1" stopColor="#D2C292" /></linearGradient>
        </defs>
        <rect x="4" y="4" width="92" height="92" rx="20" fill="url(#die-ivory)" stroke={hit ? '#FCE38A' : '#B8860B'} strokeWidth={hit ? 5 : 3} />
        <rect x="9" y="9" width="82" height="82" rx="15" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
        {PIPS[face]?.map((k) => (
          <g key={k}>
            <circle cx={G[k][0]} cy={G[k][1]} r="10.5" fill="#B8860B" opacity=".6" />
            <circle cx={G[k][0]} cy={G[k][1]} r="8.6" fill={face === 1 ? '#8B1A1A' : '#16120a'} />
          </g>
        ))}
      </svg>
    </span>
  );
});

/** Cubilete oscuro con borde dorado, boca abajo. Ocupa su caja entera. */
export const Cup = memo(function Cup({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 66" aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,.55))' }}>
      <defs>
        <linearGradient id="cup-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0b0907" /><stop offset=".35" stopColor="#2a241a" /><stop offset=".6" stopColor="#15110b" /><stop offset="1" stopColor="#070605" /></linearGradient>
        <linearGradient id="cup-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8B6914" /><stop offset=".5" stopColor="#FCE38A" /><stop offset="1" stopColor="#B8860B" /></linearGradient>
      </defs>
      <path d="M13 5 Q40 1 67 5 L77 55 Q40 62 3 55 Z" fill="url(#cup-body)" stroke="#D4AF37" strokeWidth="1" strokeOpacity=".55" />
      <ellipse cx="40" cy="5" rx="27" ry="3.2" fill="#2a241a" stroke="#D4AF37" strokeWidth=".8" strokeOpacity=".6" />
      <path d="M3 55 Q40 63 77 55 L78 60 Q40 68 2 60 Z" fill="url(#cup-gold)" />
      <path d="M24 12 L15 50" stroke="#fff" strokeOpacity=".08" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
});
