import { motion } from 'framer-motion';
import { feedback } from '../../store/settings.ts';

export const CHIP_VALUES = [1, 5, 25, 100, 500] as const;
export type ChipValue = (typeof CHIP_VALUES)[number];

const COLORS: Record<ChipValue, { base: string; ring: string; ink: string }> = {
  1: { base: '#e8e4d4', ring: '#8a8774', ink: '#2a2a22' },
  5: { base: '#d14b4b', ring: '#f4c1c1', ink: '#fff' },
  25: { base: '#2f9e6b', ring: '#bdeed7', ink: '#fff' },
  100: { base: '#23262e', ring: '#f0c35f', ink: '#f0c35f' },
  500: { base: '#6a3fb5', ring: '#f0c35f', ink: '#fff6d8' },
};

/** Ficha de casino en SVG. `onClick` la convierte en botón táctil. */
export function Chip({
  value, size = 56, onClick, disabled, label,
}: { value: ChipValue; size?: number; onClick?: () => void; disabled?: boolean; label?: string }) {
  const c = COLORS[value];
  const svg = (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`chip-${value}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#000" stopOpacity=".25" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill={c.base} stroke="#0008" strokeWidth="2" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="45" y="2" width="10" height="14" rx="2" fill={c.ring} transform={`rotate(${i * 45} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="31" fill="none" stroke={c.ring} strokeWidth="2.5" strokeDasharray="3 4" />
      <circle cx="50" cy="50" r="47" fill={`url(#chip-${value})`} />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontFamily="JetBrains Mono, monospace"
        fontWeight="800" fontSize={value >= 100 ? 24 : 30} fill={c.ink}>{value}</text>
    </svg>
  );
  if (!onClick) return svg;
  return (
    <motion.button
      type="button" whileTap={{ scale: 0.88, y: 2 }} onClick={() => { feedback('chip'); onClick(); }} disabled={disabled}
      aria-label={label ?? `Ficha de ${value}`}
      className="rounded-full disabled:opacity-35"
      style={{ background: 'none', border: 0, padding: 0, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.5))' }}
    >
      {svg}
    </motion.button>
  );
}

/** Descompone un importe en fichas (las mayores primero) para dibujar una pila. */
export function chipBreakdown(amount: number, max = 8): ChipValue[] {
  const out: ChipValue[] = [];
  let rest = Math.max(0, Math.floor(amount));
  for (const v of [...CHIP_VALUES].reverse()) {
    while (rest >= v && out.length < max) { out.push(v); rest -= v; }
  }
  return out;
}

export function ChipStack({ amount, size = 38 }: { amount: number; size?: number }) {
  const chips = chipBreakdown(amount);
  if (chips.length === 0) return null;
  return (
    <div className="relative" style={{ width: size, height: size + chips.length * 5 }}>
      {chips.map((v, i) => (
        <motion.div key={i} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.04 }}
          className="absolute left-0" style={{ bottom: i * 5 }}>
          <Chip value={v} size={size} />
        </motion.div>
      ))}
    </div>
  );
}
