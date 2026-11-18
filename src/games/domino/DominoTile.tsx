import { memo } from 'react';

/** Posiciones de los puntos (en una cara de 50×50) para cada valor 0–6. */
const P = { tl: [14, 14], tr: [36, 14], ml: [14, 25], mr: [36, 25], c: [25, 25], bl: [14, 36], br: [36, 36] } as const;
const PIPS: Record<number, (keyof typeof P)[]> = {
  0: [], 1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
};

function Face({ n, x }: { n: number; x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      {PIPS[n]!.map((k) => (
        <g key={k}>
          <circle cx={P[k][0]} cy={P[k][1]} r="5.6" fill="#B8860B" opacity=".55" />
          <circle cx={P[k][0]} cy={P[k][1]} r="4.6" fill="#16120a" />
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
  /** Extremo jugable resaltado de la cadena. */
  glow?: boolean;
  faceDown?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

/** Ficha de dominó de marfil satinado con línea divisoria dorada y puntos grabados en negro y oro (vectorial, nítida a cualquier tamaño). */
export const DominoTile = memo(function DominoTile({ a, b, vertical, size, selected, dim, glow, faceDown, onClick, className = '' }: Props) {
  const long = `calc(${size} * 2)`;
  return (
    <button type="button" disabled={!onClick} onClick={onClick} aria-label={faceDown ? undefined : `${a}-${b}`}
      className={`relative block shrink-0 touch-manipulation select-none rounded-[14%/28%] will-change-transform ${selected ? '-translate-y-2' : ''} ${className}`}
      style={{ width: vertical ? size : long, height: vertical ? long : size, boxShadow: glow ? '0 0 0 2.5px #FCE38A, 0 0 14px rgba(252,227,138,.7)' : selected ? '0 0 0 2px #f0c35f' : '0 3px 6px rgba(0,0,0,.5)', transition: 'transform .16s ease-out' }}>
      <svg viewBox="0 0 100 50" aria-hidden="true"
        style={vertical ? { position: 'absolute', display: 'block', width: long, height: size, left: `calc(50% - ${long} / 2)`, top: `calc(50% - ${size} / 2)`, transform: 'rotate(90deg)' } : { display: 'block', width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="dm-ivory" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFBEA" /><stop offset=".6" stopColor="#F1E7C6" /><stop offset="1" stopColor="#D9CBA0" /></linearGradient>
          <linearGradient id="dm-back" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0F3A2A" /><stop offset="1" stopColor="#061810" /></linearGradient>
        </defs>
        <rect x="1" y="1" width="98" height="48" rx="7" fill={faceDown ? 'url(#dm-back)' : 'url(#dm-ivory)'} stroke={faceDown ? '#D4AF37' : '#8B7A45'} strokeWidth="1.2" />
        {faceDown ? <rect x="8" y="8" width="84" height="34" rx="4" fill="none" stroke="#D4AF37" strokeWidth="1" opacity=".5" />
          : (<>
            <rect x="2.5" y="2.5" width="95" height="45" rx="5.5" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".8" />
            <line x1="50" y1="7" x2="50" y2="43" stroke="#D4AF37" strokeWidth="2" />
            <circle cx="50" cy="25" r="2.4" fill="#B8860B" />
            <Face n={a} x={0} />
            <Face n={b} x={50} />
          </>)}
      </svg>
      {dim && !faceDown && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[14%/28%] bg-black/40" />}
    </button>
  );
});
