import { memo } from 'react';

/** Posiciones de los puntos (en una cara de 50×50) para cada valor 0–6. */
const P = { tl: [14, 14], tr: [36, 14], ml: [14, 25], mr: [36, 25], c: [25, 25], bl: [14, 36], br: [36, 36] } as const;
const PIPS: Record<number, (keyof typeof P)[]> = {
  0: [], 1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
};

/** Punto hundido: aro de luz abajo-derecha, pozo negro con degradado y reflejo mínimo. */
/** Puntos con el código de color clásico de torneo: 1 carmesí · 2 esmeralda · 3 cobalto · 4 ámbar · 5 púrpura · 6 obsidiana. */
const PIP_COLORS: [string, string, string][] = [['#ff6b7e', '#b3122a', '#4d0711'], ['#4fe0a6', '#0f8a5c', '#053a27'], ['#7fa8ff', '#1d4fbf', '#0a1f5c'], ['#ffd36b', '#d98a0b', '#6b3d02'], ['#c79bff', '#7a3fc2', '#2f1160'], ['#4a4a4a', '#141414', '#000']];
function Face({ n, x }: { n: number; x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      {PIPS[n]!.map((k) => (
        <g key={k}>
          <circle cx={P[k][0] + 0.5} cy={P[k][1] + 0.8} r="5.4" fill="#fff" opacity=".85" />
          <circle cx={P[k][0]} cy={P[k][1]} r="5" fill={`url(#dm-pip${n})`} />
          <circle cx={P[k][0] - 1.3} cy={P[k][1] - 1.5} r="1.1" fill="#fff" opacity=".28" />
        </g>
      ))}
    </g>
  );
}

interface Props {
  a: number; b: number;
  /** Largo en horizontal (por defecto) o en vertical. */
  vertical?: boolean;
  /** Lado corto como longitud CSS (p. ej. `calc(var(--card-w) * .56)`). */
  size: string;
  selected?: boolean;
  dim?: boolean;
  /** Ficha de la mano que se puede jugar ahora: borde dorado y elevada. */
  playable?: boolean;
  /** Extremo jugable resaltado de la cadena. */
  glow?: boolean;
  faceDown?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * Ficha de dominó de marfil con grosor real (canto inferior y derecho en sombra de marfil), barra divisoria de oro metálico,
 * remache central de latón y puntos hundidos con aro de luz. Vectorial: nítida a cualquier tamaño.
 */
export const DominoTile = memo(function DominoTile({ a, b, vertical, size, selected, dim, playable, glow, faceDown, onClick, className = '' }: Props) {
  const long = `calc(${size} * 2)`;
  const edge = `calc(${size} * .09)`;
  const lift = selected ? `0 0 0 3px #FCE38A, 0 0 12px rgba(252,227,138,.6), ` : playable ? `0 0 0 2.5px #D4AF37, 0 0 10px rgba(212,175,55,.45), ` : glow ? `0 0 0 2.5px #FCE38A, 0 0 14px rgba(252,227,138,.7), ` : '';
  const body = faceDown ? '#0a2a1e' : '#8C816A';
  return (
    <button type="button" disabled={!onClick} onClick={onClick} aria-label={faceDown ? undefined : `${a}-${b}`}
      className={`relative block shrink-0 touch-manipulation select-none rounded-[14%/28%] will-change-transform ${selected || playable ? '-translate-y-2' : ''} ${dim && !faceDown ? 'opacity-55' : ''} ${glow ? 'dm-pulse' : ''} ${className}`}
      style={{
        width: vertical ? size : long, height: vertical ? long : size,
        // grosor: canto inferior (y derecho) del marfil + sombra de contacto sobre el fieltro
        boxShadow: `${lift}${edge} ${edge} 0 ${body}, 0 calc(${edge} * 1.8) calc(${edge} * 1.4) rgba(0,0,0,.55)`,
        transition: 'transform .16s ease-out',
      }}>
      <svg viewBox="0 0 100 50" aria-hidden="true" shapeRendering="geometricPrecision"
        style={vertical ? { position: 'absolute', display: 'block', width: long, height: size, left: `calc(50% - ${long} / 2)`, top: `calc(50% - ${size} / 2)`, transform: 'rotate(90deg)' } : { display: 'block', width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="dm-ivory" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FAF6EE" /><stop offset=".55" stopColor="#EFE7D2" /><stop offset="1" stopColor="#E4DBC4" /></linearGradient>
          <linearGradient id="dm-back" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#14503a" /><stop offset="1" stopColor="#061810" /></linearGradient>
          <linearGradient id="dm-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8B6914" /><stop offset=".45" stopColor="#FCE38A" /><stop offset="1" stopColor="#A57A12" /></linearGradient>
          {PIP_COLORS.map(([hi, mid, lo], i) => <radialGradient key={i} id={`dm-pip${i + 1}`} cx=".38" cy=".34" r=".8"><stop offset="0" stopColor={hi} /><stop offset=".6" stopColor={mid} /><stop offset="1" stopColor={lo} /></radialGradient>)}
          <radialGradient id="dm-rivet" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#FFF6C6" /><stop offset=".4" stopColor="#D4AF37" /><stop offset="1" stopColor="#6b4a08" /></radialGradient>
          <linearGradient id="dm-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></linearGradient>
        </defs>
        <rect x=".6" y=".6" width="98.8" height="48.8" rx="7.5" fill={faceDown ? 'url(#dm-back)' : 'url(#dm-ivory)'} stroke={faceDown ? '#D4AF37' : '#a8975f'} strokeWidth="1.1" />
        {faceDown ? <rect x="8" y="8" width="84" height="34" rx="4" fill="none" stroke="#D4AF37" strokeWidth="1" opacity=".5" />
          : (<>
            <rect x="2" y="2" width="96" height="46" rx="6.4" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".9" />
            <rect x="3" y="3" width="94" height="20" rx="5.5" fill="url(#dm-gloss)" opacity=".5" />
            {/* barra divisoria de oro metálico + remache central */}
            <rect x="48.7" y="6" width="2.6" height="38" rx="1.3" fill="url(#dm-gold)" />
            <rect x="49.4" y="6" width=".8" height="38" fill="#fff" opacity=".35" />
            <circle cx="50" cy="25" r="3.4" fill="url(#dm-rivet)" stroke="#6b4a08" strokeWidth=".5" />
            <circle cx="49" cy="24" r=".9" fill="#fff" opacity=".85" />
            <Face n={a} x={0} />
            <Face n={b} x={50} />
          </>)}
      </svg>
    </button>
  );
});
