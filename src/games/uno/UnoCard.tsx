import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { cardLabel, type Color, type UnoCard } from './engine.ts';

const HEX: Record<Color | 'wild', string> = { red: '#d72600', yellow: '#ecb800', green: '#2f9a14', blue: '#0956bf', wild: '#15151a' };

/** Símbolo central de la carta, centrado en (0,0), caja ~ 90×90, en el color de la carta. */
function Glyph({ card, color, scale = 1 }: { card: UnoCard; color: string; scale?: number }) {
  const t = `scale(${scale})`;
  switch (card.kind) {
    case 'num':
      return <text transform={t} textAnchor="middle" dominantBaseline="central" fontFamily="Manrope, system-ui, sans-serif" fontWeight="800" fontStyle="italic" fontSize="104" fill={color} stroke="#fff" strokeWidth="2" paintOrder="stroke" y="4">{card.n}</text>;
    case 'skip':
      return (
        <g transform={t} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round">
          <circle r="38" /><path d="M-27 -27 L27 27" />
        </g>
      );
    case 'reverse':
      return (
        <g transform={t} fill={color}>
          <path d="M-38 -6 L-6 -6 L-6 -26 L38 -26 L38 -52 L-6 -52 L-6 -72 Z" transform="translate(0 22)" />
          <path d="M38 6 L6 6 L6 26 L-38 26 L-38 52 L6 52 L6 72 Z" transform="translate(0 -22)" />
        </g>
      );
    case 'draw2':
      return (
        <g transform={t}>
          <rect x="-34" y="-46" width="40" height="58" rx="6" fill={color} stroke="#fff" strokeWidth="3" transform="rotate(-12)" />
          <rect x="-6" y="-14" width="40" height="58" rx="6" fill={color} stroke="#fff" strokeWidth="3" transform="rotate(12)" />
          <text y="62" textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="36" fill={color} stroke="#fff" strokeWidth="2" paintOrder="stroke">+2</text>
        </g>
      );
    case 'wild':
    case 'wild4':
      return (
        <g transform={t}>
          <g transform="rotate(-20)">
            <path d="M0 0 L0 -48 A48 48 0 0 1 48 0Z" fill={HEX.red} /><path d="M0 0 L48 0 A48 48 0 0 1 0 48Z" fill={HEX.blue} />
            <path d="M0 0 L0 48 A48 48 0 0 1 -48 0Z" fill={HEX.green} /><path d="M0 0 L-48 0 A48 48 0 0 1 0 -48Z" fill={HEX.yellow} />
          </g>
          {card.kind === 'wild4' && <text y="6" textAnchor="middle" dominantBaseline="central" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="40" fill="#fff" stroke="#000" strokeWidth="3" paintOrder="stroke">+4</text>}
        </g>
      );
  }
}

/** Esquina: símbolo pequeño blanco. */
function CornerMark({ card }: { card: UnoCard }) {
  const label = card.kind === 'num' ? String(card.n) : card.kind === 'draw2' ? '+2' : card.kind === 'wild4' ? '+4' : card.kind === 'skip' ? '⊘' : card.kind === 'reverse' ? '⇄' : '★';
  return <text textAnchor="middle" dominantBaseline="central" fontFamily="Manrope, sans-serif" fontWeight="800" fontStyle="italic" fontSize="30" fill="#fff" stroke="#000" strokeWidth="1.5" paintOrder="stroke">{label}</text>;
}

/** Cara de la carta (SVG propio, proporción 2:3). */
export function UnoFace({ card }: { card: UnoCard }) {
  const bg = HEX[card.color];
  const inner = card.color === 'wild' ? '#fff' : '#fff';
  const glyphColor = card.color === 'wild' ? '#15151a' : bg;
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" aria-hidden="true" style={{ display: 'block' }}>
      <rect width="200" height="300" rx="18" fill="#fff" />
      <rect x="9" y="9" width="182" height="282" rx="12" fill={bg} />
      <ellipse cx="100" cy="150" rx="74" ry="116" fill={inner} transform="rotate(30 100 150)" />
      {card.color === 'wild' && <ellipse cx="100" cy="150" rx="68" ry="108" fill="#15151a" transform="rotate(30 100 150)" />}
      <g transform="translate(100 150)"><Glyph card={card} color={card.color === 'wild' ? '#fff' : glyphColor} /></g>
      <g transform="translate(34 40)"><CornerMark card={card} /></g>
      <g transform="translate(166 260) rotate(180)"><CornerMark card={card} /></g>
    </svg>
  );
}

/** Reverso: negro con óvalo rojo y rótulo UNO. */
export function UnoBack() {
  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" aria-hidden="true" style={{ display: 'block' }}>
      <rect width="200" height="300" rx="18" fill="#fff" />
      <rect x="9" y="9" width="182" height="282" rx="12" fill="#15151a" />
      <ellipse cx="100" cy="150" rx="74" ry="116" fill="#d72600" transform="rotate(30 100 150)" />
      <text x="100" y="158" textAnchor="middle" dominantBaseline="central" fontFamily="Manrope, sans-serif" fontWeight="800" fontStyle="italic" fontSize="64" fill="#ecb800" stroke="#000" strokeWidth="4" paintOrder="stroke" transform="rotate(-24 100 150)">UNO</text>
    </svg>
  );
}

export function UnoCardView({ card, faceDown, scale = 1, onClick, playable, dim, glow, rotate = 0, style }: {
  card: UnoCard; faceDown?: boolean; scale?: number; onClick?: () => void; playable?: boolean; dim?: boolean; glow?: boolean; rotate?: number; style?: CSSProperties;
}) {
  const interactive = Boolean(onClick);
  return (
    <motion.button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      aria-label={faceDown ? 'Carta boca abajo' : cardLabel(card)}
      className={`relative block aspect-[2/3] shrink-0 touch-none overflow-hidden rounded-[10px] ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        width: `calc(var(--card-w) * ${scale})`,
        boxShadow: glow || playable ? '0 0 0 2px #f0c35f, 0 0 16px rgba(240,195,95,.6)' : '0 10px 20px rgba(0,0,0,.4), 0 2px 3px rgba(0,0,0,.25)',
        ...style,
      }}
      animate={{ y: playable ? -10 : 0, rotate, opacity: dim ? 0.5 : 1 }}
      whileHover={interactive ? { y: -18 } : undefined}
      whileTap={interactive ? { scale: 0.96 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      {faceDown ? <UnoBack /> : <UnoFace card={card} />}
    </motion.button>
  );
}

export const UNO_HEX = HEX;
