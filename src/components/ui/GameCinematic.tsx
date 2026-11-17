import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { CinematicTone } from '../../services/juice.ts';

/** Paletas por tipo de evento: gradiente del título, color de rayos y de chispas. */
const TONES: Record<CinematicTone, { fill: string; glow: string; ray: string; spark: string[] }> = {
  gold: { fill: 'linear-gradient(180deg,#FFF3B0 0%,#F5D061 45%,#B8860B 100%)', glow: '#F5D061', ray: 'rgba(245,208,97,.55)', spark: ['#FFF3B0', '#F5D061', '#D4AF37'] },
  ruby: { fill: 'linear-gradient(180deg,#FFD1D1 0%,#F87171 40%,#B91C1C 100%)', glow: '#EF4444', ray: 'rgba(239,68,68,.5)', spark: ['#FECACA', '#EF4444', '#F5D061'] },
  emerald: { fill: 'linear-gradient(180deg,#D1FAE5 0%,#34D399 45%,#047857 100%)', glow: '#10B981', ray: 'rgba(16,185,129,.5)', spark: ['#A7F3D0', '#10B981', '#F5D061'] },
  electric: { fill: 'linear-gradient(180deg,#E0F2FE 0%,#60A5FA 45%,#1D4ED8 100%)', glow: '#3B82F6', ray: 'rgba(59,130,246,.55)', spark: ['#BAE6FD', '#60A5FA', '#F5D061'] },
};

const SPARKS = 28;

/**
 * Cinemática rápida de jugada (≈1,5 s): destello oscuro, rayos giratorios, barrido de luz,
 * título cinético con muelle, píldora con el detalle y 28 chispas. No bloquea: `pointer-events-none`.
 */
export function GameCinematic({ title, sub, tone = 'gold' }: { title: string; sub?: string; tone?: CinematicTone }) {
  const t = TONES[tone];
  const sparks = useMemo(() => Array.from({ length: SPARKS }, (_, i) => {
    const a = (i / SPARKS) * Math.PI * 2 + (i % 3) * 0.2;
    const d = 110 + ((i * 37) % 120);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, fall: 90 + ((i * 29) % 70), rot: ((i * 83) % 540) - 270, size: 5 + (i % 4) * 2, color: t.spark[i % t.spark.length]!, delay: (i % 5) * 0.02 };
  }), [t]);
  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center overflow-hidden" aria-live="assertive">
      {/* atmósfera: destello oscuro radial */}
      <motion.div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,.72) 0%, rgba(0,0,0,.25) 55%, rgba(0,0,0,0) 80%)' }}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 1.6, times: [0, 0.12, 0.75, 1] }} />
      {/* rayos giratorios */}
      <motion.div className="absolute left-1/2 top-1/2 size-[150vmax] -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{ background: `repeating-conic-gradient(from 0deg, ${t.ray} 0deg 7deg, transparent 7deg 26deg)`, maskImage: 'radial-gradient(circle, #000 0%, transparent 22%)', WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 22%)' }}
        initial={{ opacity: 0, rotate: 0, scale: 0.6 }} animate={{ opacity: [0, 0.9, 0.9, 0], rotate: 50, scale: 1 }} transition={{ duration: 1.6, ease: 'easeOut' }} />
      <div className="relative grid justify-items-center gap-3 px-4 text-center">
        {/* chispas */}
        {sparks.map((p, i) => (
          <motion.span key={i} className="absolute left-1/2 top-1/2 block rounded-[2px] will-change-transform" style={{ width: p.size, height: p.size * 1.6, background: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{ x: p.x, y: [0, p.y, p.y + p.fall], opacity: [1, 1, 0], rotate: p.rot, scale: [1, 1, 0.5] }}
            transition={{ duration: 1.25, delay: 0.12 + p.delay, ease: 'easeOut' }} />
        ))}
        {/* título cinético */}
        <motion.h2 className="relative font-black uppercase leading-none will-change-transform"
          style={{
            fontFamily: "'Unbounded','Outfit',sans-serif", fontSize: 'clamp(26px,9vw,56px)', backgroundImage: t.fill, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            WebkitTextStroke: '3px rgba(6,24,16,.9)', paintOrder: 'stroke fill', filter: `drop-shadow(0 0 16px ${t.glow}) drop-shadow(0 4px 0 rgba(0,0,0,.55))`,
          }}
          initial={{ scale: 2.4, rotate: -6, opacity: 0 }} animate={{ scale: [2.4, 0.92, 1, 1, 1.06], rotate: [-6, 2, 0, 0, 0], opacity: [0, 1, 1, 1, 0] }}
          transition={{ duration: 1.5, times: [0, 0.2, 0.32, 0.8, 1], ease: 'easeOut' }}>
          {title}
          {/* barrido de luz metálico */}
          <motion.span aria-hidden className="absolute inset-y-[-10%] left-0 w-[40%]" style={{ background: 'linear-gradient(100deg, transparent 0%, rgba(255,255,255,.9) 50%, transparent 100%)', mixBlendMode: 'overlay', transform: 'skewX(-18deg)' }}
            initial={{ x: '-120%' }} animate={{ x: '320%' }} transition={{ duration: 0.6, delay: 0.3, ease: 'easeInOut' }} />
        </motion.h2>
        {sub && (
          <motion.div className="rounded-full border border-white/20 bg-zinc-950/90 px-4 py-1.5 text-[13px] font-bold text-stone-100"
            style={{ fontFamily: "'Outfit',sans-serif" }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -4] }} transition={{ duration: 1.5, times: [0, 0.25, 0.8, 1], delay: 0.1 }}>
            {sub}
          </motion.div>
        )}
      </div>
    </div>
  );
}
