import { useEffect, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Chip } from '../cards/Chip.tsx';
import { useWallet } from '../../store/wallet.ts';

export function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const c = animate(prev.current, value, { duration: 0.8, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) });
    prev.current = value;
    return () => c.stop();
  }, [value]);
  return <>{shown.toLocaleString('es-ES')}</>;
}

export const RANKS = [
  { min: 0, name: 'Novato', color: '#a8a29e' },
  { min: 1000, name: 'Tahúr', color: '#34d399' },
  { min: 5000, name: 'Capo', color: '#60a5fa' },
  { min: 20000, name: 'Maestro', color: '#c084fc' },
  { min: 100000, name: 'Leyenda', color: '#fef08a' },
] as const;

export function rankFor(chips: number): { name: string; color: string; level: number } {
  let level = 0;
  RANKS.forEach((r, i) => { if (chips >= r.min) level = i; });
  return { name: RANKS[level]!.name, color: RANKS[level]!.color, level: level + 1 };
}

/** Avatar con marco de rango/nivel. */
export function PlayerAvatar({ name, chips, size = 44 }: { name: string; chips: number; size?: number }) {
  const rank = rankFor(chips);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="avatar-ring h-full w-full" style={{ background: `conic-gradient(from 210deg, #fff, ${rank.color}, #3b2a05, ${rank.color})` }}>
        <div className="font-display grid h-full w-full place-items-center rounded-full text-lg font-black"
          style={{ background: 'radial-gradient(circle at 30% 25%, #1f6b52, #06241b)', color: '#fef08a' }}>
          {name.slice(0, 1).toUpperCase()}
        </div>
      </div>
      <span className="font-mono absolute -bottom-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px]"
        style={{ background: rank.color, color: '#0b0b0b', border: '1.5px solid #020a08' }} aria-label={`Nivel ${rank.level}`}>{rank.level}</span>
    </div>
  );
}

/** Contador de fichas con ficha 3D giratoria. `onPlus` añade el botón de recarga. */
export function ChipBalance({ onPlus, className = '' }: { onPlus?: () => void; className?: string }) {
  const { chips } = useWallet();
  return (
    <div className={`glass-panel flex items-center gap-1.5 rounded-full py-1 pl-1.5 ${onPlus ? 'pr-1' : 'pr-3'} ${className}`} aria-label={`${chips} fichas`}>
      <motion.span style={{ display: 'block', perspective: 200 }} animate={{ rotateY: [0, 360] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}>
        <Chip value={25} size={26} />
      </motion.span>
      <span className="font-mono text-sm font-bold gold-text"><AnimatedNumber value={chips} /></span>
      {onPlus && (
        <button type="button" onClick={onPlus} aria-label="Recargar fichas"
          className="gold-foil ml-0.5 grid h-7 w-7 place-items-center rounded-full" style={{ boxShadow: '0 2px 0 #6b4306' }}>
          <Plus size={16} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
