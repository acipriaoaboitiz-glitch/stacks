import { memo, useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { CARD_EASE } from '../../store/settings.ts';
import { cardLabel, type Color, type UnoCard as UnoCardData } from './engine.ts';

/** Colores oficiales del set. */
const HEX: Record<Color | 'wild', string> = { red: '#DC2626', yellow: '#D97706', green: '#059669', blue: '#2563EB', wild: '#111827' };
/** Acabado satinado: luz arriba a la izquierda y tono más profundo abajo a la derecha. */
const SATIN: Record<Color | 'wild', [string, string]> = { red: ['#EF4444', '#991B1B'], yellow: ['#F59E0B', '#A16207'], green: ['#10B981', '#047857'], blue: ['#3B82F6', '#1D4ED8'], wild: ['#1F2937', '#05080F'] };

/** El «hover» se queda pegado en pantallas táctiles: solo se usa con ratón. */
const CAN_HOVER = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches;

// ─── Set vectorial opcional: /public/cards/uno/{color}_{valor}.svg ───────────────────────────────
// Nombres: red|yellow|green|blue + 0-9, skip, reverse, draw2  ·  wild_wild.svg, wild_wild4.svg  ·  back.svg
// Se comprueba UNA vez (y que la respuesta sea de verdad un SVG: algunos hosts devuelven index.html con 200).
// Si el set no está, se dibuja el componente vectorial propio, sin cientos de 404 ni parpadeos.
const BASE = `${import.meta.env.BASE_URL}cards/uno/`;
let vectorSet = false;
let probe: Promise<void> | null = null;
const subs = new Set<() => void>();

function probeVectorSet(): void {
  probe ??= fetch(`${BASE}red_0.svg`)
    .then((r) => r.ok && (r.headers.get('content-type') ?? '').includes('svg'))
    .catch(() => false)
    .then((ok) => { if (ok !== vectorSet) { vectorSet = ok; subs.forEach((f) => f()); } });
}
function useVectorSet(): boolean {
  useEffect(probeVectorSet, []);
  return useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l); }; }, () => vectorSet);
}
export const unoFile = (c: UnoCardData): string => (c.color === 'wild' ? `wild_${c.kind}.svg` : `${c.color}_${c.kind === 'num' ? c.n : c.kind}.svg`);

// ─── Respaldo vectorial ──────────────────────────────────────────────────────────────────────────
const FONT = 'Outfit, system-ui, sans-serif';

/** Número/símbolo grueso con sombra suave. */
function Outlined({ children, fill, size, y = 0, x = 0 }: { children: string | number; fill: string; size: number; y?: number; x?: number }) {
  const common = { textAnchor: 'middle', dominantBaseline: 'central', fontFamily: FONT, fontWeight: 900, fontStyle: 'italic', fontSize: size } as const;
  return (
    <g>
      <text {...common} x={x + 3} y={y + 6} fill="#000" opacity=".25">{children}</text>
      <text {...common} x={x} y={y} fill={fill}>{children}</text>
    </g>
  );
}

function Glyph({ card, color }: { card: UnoCardData; color: string }) {
  switch (card.kind) {
    case 'num':
      return <Outlined fill={color} size={118} y={4}>{card.n}</Outlined>;
    case 'skip':
      return (
        <g fill="none" strokeLinecap="round">
          <circle r="40" stroke="#000" strokeWidth="26" transform="translate(4 5)" opacity=".85" /><path d="M-28 -28 L28 28" stroke="#000" strokeWidth="26" transform="translate(4 5)" opacity=".85" />
          <circle r="40" stroke="#fff" strokeWidth="22" /><path d="M-28 -28 L28 28" stroke="#fff" strokeWidth="22" />
          <circle r="40" stroke={color} strokeWidth="14" /><path d="M-28 -28 L28 28" stroke={color} strokeWidth="14" />
        </g>
      );
    case 'reverse': {
      const arrows = (
        <>
          <path d="M-40 -2 L-8 -2 L-8 -24 L40 -24 L40 -50 L-8 -50 L-8 -72 Z" transform="translate(0 24)" />
          <path d="M40 2 L8 2 L8 24 L-40 24 L-40 50 L8 50 L8 72 Z" transform="translate(0 -24)" />
        </>
      );
      return (
        <g strokeLinejoin="round">
          <g transform="translate(4 5)" fill="#000" stroke="#000" strokeWidth="8" opacity=".85">{arrows}</g>
          <g fill={color} stroke="#fff" strokeWidth="6" paintOrder="stroke">{arrows}</g>
        </g>
      );
    }
    case 'draw2':
      return (
        <g>
          <rect x="-36" y="-52" width="44" height="64" rx="7" fill="#000" transform="translate(4 5) rotate(-12)" opacity=".85" />
          <rect x="-8" y="-18" width="44" height="64" rx="7" fill="#000" transform="translate(4 5) rotate(12)" opacity=".85" />
          <rect x="-36" y="-52" width="44" height="64" rx="7" fill={color} stroke="#fff" strokeWidth="4" transform="rotate(-12)" />
          <rect x="-8" y="-18" width="44" height="64" rx="7" fill={color} stroke="#fff" strokeWidth="4" transform="rotate(12)" />
          <Outlined fill={color} size={40} y={70}>+2</Outlined>
        </g>
      );
    case 'wild':
      return (
        <g>
          <circle r="62" fill="#0B1220" />
          {[[0, HEX.red], [90, HEX.blue], [180, HEX.green], [270, HEX.yellow]].map(([rot, col]) => (
            <path key={String(rot)} d="M0 -50A50 50 0 0 1 50 0" fill="none" stroke={String(col)} strokeWidth="24" transform={`rotate(${rot})`} />
          ))}
          <circle r="34" fill="#111827" />
          <circle r="62" fill="none" stroke="#C9CED6" strokeWidth="2" opacity=".6" />
        </g>
      );
    case 'wild4':
      return (
        <g>
          {[[-30, HEX.red], [-10, HEX.blue], [10, HEX.green], [30, HEX.yellow]].map(([rot, col]) => (
            <g key={String(rot)} transform={`translate(0 28) rotate(${rot})`}>
              <rect x="-17" y="-86" width="34" height="56" rx="6" fill={String(col)} stroke="#F8FAFC" strokeWidth="3" />
            </g>
          ))}
        </g>
      );
  }
}

const cornerLabel = (card: UnoCardData): string =>
  card.kind === 'num' ? String(card.n) : card.kind === 'draw2' ? '+2' : card.kind === 'wild4' ? '+4' : card.kind === 'skip' ? '⊘' : card.kind === 'reverse' ? '⇄' : '★';

function Corner({ card }: { card: UnoCardData }) {
  return (
    <g>
      <text textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight="900" fontStyle="italic" fontSize="32" fill="#000" stroke="#000" strokeWidth="5" x="1.5" y="2">{cornerLabel(card)}</text>
      <text textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight="900" fontStyle="italic" fontSize="32" fill="#fff">{cornerLabel(card)}</text>
    </g>
  );
}

/** Cara vectorial: borde blanco grueso, óvalo inclinado, número grande con doble contorno. */
export function UnoFace({ card }: { card: UnoCardData }) {
  const bg = HEX[card.color];
  const [c1, c2] = SATIN[card.color];
  const wild = card.color === 'wild';
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" aria-hidden="true" style={{ display: 'block' }}>
      <defs><linearGradient id={`sat-${card.color}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient></defs>
      <rect width="200" height="300" fill={`url(#sat-${card.color})`} />
      <rect width="200" height="130" fill="#fff" opacity=".07" />
      <rect x="7" y="7" width="186" height="286" rx="16" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      <ellipse cx="100" cy="150" rx="60" ry="96" fill="#F8FAFC" fillOpacity=".94" transform="rotate(26 100 150)" />
      {wild && <ellipse cx="100" cy="150" rx="55" ry="90" fill="#111827" transform="rotate(26 100 150)" />}
      <g transform="translate(100 150)"><Glyph card={card} color={wild ? '#fff' : bg} /></g>
      <g transform="translate(36 42)"><Corner card={card} /></g>
      <g transform="translate(164 258) rotate(180)"><Corner card={card} /></g>
    </svg>
  );
}

/** Reverso: negro con óvalo rojo y rótulo UNO. */
export function UnoBack() {
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" aria-hidden="true" style={{ display: 'block' }}>
      <rect width="200" height="300" fill="#fff" />
      <rect x="11" y="11" width="178" height="278" rx="12" fill="#15151a" />
      <ellipse cx="100" cy="150" rx="72" ry="114" fill={HEX.red} transform="rotate(30 100 150)" />
      <g transform="rotate(-24 100 150)"><Outlined fill={HEX.yellow} size={66} x={100} y={154}>UNO</Outlined></g>
    </svg>
  );
}

interface Props {
  card: UnoCardData;
  faceDown?: boolean;
  scale?: number;
  onClick?: () => void;
  /** Se puede jugar: solo brilla (no se eleva). */
  playable?: boolean;
  /** Seleccionada: se eleva; un segundo toque la juega. */
  selected?: boolean;
  dim?: boolean;
  glow?: boolean;
  rotate?: number;
  style?: CSSProperties;
}

/** Carta de UNO: usa el set SVG de /public/cards/uno si existe y, si no, el diseño vectorial propio. */
export const UnoCard = memo(function UnoCard({ card, faceDown, scale = 1, onClick, playable, selected, dim, glow, rotate = 0, style }: Props) {
  const vectors = useVectorSet();
  const interactive = Boolean(onClick);
  const lit = glow || playable || selected;
  return (
    <motion.button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      aria-pressed={interactive ? Boolean(selected) : undefined}
      aria-label={faceDown ? 'Carta boca abajo' : cardLabel(card)}
      className={`relative block aspect-[2/3] shrink-0 touch-manipulation select-none overflow-hidden rounded-xl bg-[#0b1220] shadow-md will-change-transform md:shadow-[0_10px_24px_rgba(0,0,0,0.65)] ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        width: `calc(var(--card-w) * ${scale})`,
        boxShadow: lit ? '0 0 0 2px #f0c35f' : undefined,
        ...style,
      }}
      animate={{ y: selected ? -12 : 0, rotate }}
      whileHover={interactive && CAN_HOVER ? { y: selected ? -14 : -6 } : undefined}
      whileTap={interactive ? { scale: 0.96 } : undefined}
      transition={CARD_EASE}
    >
      {vectors
        ? <img src={`${BASE}${faceDown ? 'back.svg' : unoFile(card)}`} alt="" draggable={false} className="size-full object-contain" />
        : faceDown ? <UnoBack /> : <UnoFace card={card} />}
      {dim && !faceDown && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/45" />}
    </motion.button>
  );
});

export const UNO_HEX = HEX;
