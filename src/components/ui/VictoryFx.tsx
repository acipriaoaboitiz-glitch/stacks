import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { VictoryId } from '../../store/cosmetics.ts';

/**
 * Efectos de victoria equipables. Todos animan solo `transform` y `opacity` (60 FPS), duran 2–3,5 s y no capturan toques.
 * Se pintan en el overlay de victoria y, como demostración, en la vista previa de la tienda (`burst` reinicia la animación).
 */
const rng = (seed: number) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const GOLD = ['#FFF0B0', '#F5D061', '#D4AF37', '#B8860B'];
const EMERALD = ['#6ee7b7', '#34d399', '#10b981', '#ecfdf5', '#FCE38A'];

function Classic() {
  return (
    <>
      <motion.div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(252,227,138,.55), rgba(252,227,138,0) 62%)' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 1.8] }} transition={{ duration: 1.1, ease: 'easeOut' }} />
      <motion.div className="absolute left-1/2 top-[45%] size-[160%] -translate-x-1/2 -translate-y-1/2" initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: [0, 0.5, 0], rotate: 40 }} transition={{ duration: 1.6, ease: 'easeOut' }}
        style={{ background: 'repeating-conic-gradient(from 0deg, rgba(252,227,138,.5) 0deg 5deg, transparent 5deg 20deg)', WebkitMask: 'radial-gradient(circle, #000 0, transparent 55%)', mask: 'radial-gradient(circle, #000 0, transparent 55%)' }} />
    </>
  );
}

function Coins({ seed }: { seed: number }) {
  const items = useMemo(() => { const r = rng(seed); return Array.from({ length: 28 }, () => ({ x: r() * 100, d: r() * 1.1, t: 1.6 + r() * 1.1, s: 14 + r() * 14, spin: 0.4 + r() * 0.5 })); }, [seed]);
  return (
    <>
      {items.map((c, i) => (
        <motion.span key={i} className="absolute top-0 block rounded-full border border-[#8a6410]" style={{ left: `${c.x}%`, width: c.s, height: c.s, background: 'radial-gradient(circle at 35% 30%, #FFF0B0, #D4AF37 55%, #8a6410)', boxShadow: '0 0 8px rgba(245,208,97,.7)' }}
          initial={{ y: 'calc(var(--fx-h) * -0.12)', opacity: 0 }} animate={{ y: 'calc(var(--fx-h) * 1.12)', opacity: [0, 1, 1, 0], scaleX: [1, 0.2, 1, 0.2, 1], rotate: [0, 40, -30, 20] }} transition={{ duration: c.t, delay: c.d, ease: 'easeIn', scaleX: { duration: c.spin * 2, repeat: Infinity } }} />
      ))}
    </>
  );
}

function Fireworks({ seed, k }: { seed: number; k: number }) {
  const bursts = useMemo(() => { const r = rng(seed); return Array.from({ length: 5 }, (_, b) => ({ x: 15 + r() * 70, y: 12 + r() * 45, d: b * 0.45 + r() * 0.2, sparks: Array.from({ length: 16 }, (_, n) => ({ a: (n / 16) * Math.PI * 2 + r() * 0.2, rad: (70 + r() * 60) * k, c: EMERALD[Math.floor(r() * EMERALD.length)]! })) })); }, [seed]);
  return (
    <>
      {bursts.map((b, i) => (
        <div key={i} className="absolute" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
          <motion.span className="absolute block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 0], scale: [0.4, 2.6, 3.4] }} transition={{ duration: 0.5, delay: b.d }} />
          {b.sparks.map((s, k) => (
            <motion.span key={k} className="absolute block size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: s.c, boxShadow: `0 0 8px 1px ${s.c}` }}
              initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: Math.cos(s.a) * s.rad, y: [0, Math.sin(s.a) * s.rad + 26], opacity: [0, 1, 1, 0], scale: [1, 1, 0.4] }} transition={{ duration: 1.3, delay: b.d + 0.08, ease: 'easeOut' }} />
          ))}
        </div>
      ))}
    </>
  );
}

function Lightning({ seed }: { seed: number }) {
  const bolts = useMemo(() => { const r = rng(seed); return Array.from({ length: 4 }, (_, i) => ({ x: 14 + i * 24 + r() * 8, d: i * 0.28, pts: Array.from({ length: 6 }, (_, k) => `${(r() - 0.5) * 16 + 20},${k * 18}`).join(' ') })); }, [seed]);
  return (
    <>
      <motion.div className="absolute inset-0 bg-[#FCE38A]" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0, 0.35, 0, 0.25, 0] }} transition={{ duration: 1.6, times: [0, 0.05, 0.12, 0.35, 0.42, 0.65, 0.75] }} />
      {bolts.map((b, i) => (
        <motion.svg key={i} viewBox="0 0 40 100" preserveAspectRatio="none" className="absolute top-0 h-[75%] w-[22%]" style={{ left: `${b.x - 11}%`, transformOrigin: 'top' }} initial={{ opacity: 0, scaleY: 0.6 }} animate={{ opacity: [0, 1, 0.2, 1, 0], scaleY: [0.6, 1, 1, 1, 1] }} transition={{ duration: 0.7, delay: b.d, times: [0, 0.1, 0.3, 0.45, 1] }}>
          <polyline points={b.pts} fill="none" stroke="#fff6c6" strokeWidth="2.4" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
          <polyline points={b.pts} fill="none" stroke="#F5D061" strokeOpacity=".7" strokeWidth="7" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
        </motion.svg>
      ))}
    </>
  );
}

function Cards({ seed }: { seed: number }) {
  const items = useMemo(() => { const r = rng(seed); return Array.from({ length: 20 }, (_, i) => ({ x0: 8 + r() * 84, dx: (r() - 0.5) * 120, up: 38 + r() * 40, d: r() * 0.7, rot: (r() - 0.5) * 720, red: i % 3 === 0 })); }, [seed]);
  return (
    <>
      {items.map((c, i) => (
        <motion.span key={i} className="absolute bottom-0 grid h-[46px] w-[32px] place-items-center rounded-[5px] border-[1.5px] border-[#D4AF37] bg-[#f6efdc] text-[15px] font-black" style={{ left: `${c.x0}%`, color: c.red ? '#c62f2f' : '#111827' }}
          initial={{ y: 'calc(var(--fx-h) * .04)', opacity: 0, rotate: 0 }} animate={{ y: ['calc(var(--fx-h) * .04)', `calc(var(--fx-h) * -${c.up / 100})`, 'calc(var(--fx-h) * .3)'], x: [0, c.dx * 0.6, c.dx], rotate: c.rot, opacity: [0, 1, 1, 0] }} transition={{ duration: 2.4, delay: c.d, times: [0, 0.45, 1], ease: ['easeOut', 'easeIn'] }}>
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path d="M12 3 C12 3 4 10 4 15 C4 18.5 8 19 10 16.5 C9.5 19 8.5 21 7.5 21.5 H16.5 C15.5 21 14.5 19 14 16.5 C16 19 20 18.5 20 15 C20 10 12 3 12 3Z" fill="currentColor" /></svg>
        </motion.span>
      ))}
    </>
  );
}

function Explosion({ seed, k }: { seed: number; k: number }) {
  const parts = useMemo(() => { const r = rng(seed); return Array.from({ length: 44 }, () => ({ a: r() * Math.PI * 2, rad: (90 + r() * 210) * k, s: 4 + r() * 7, c: [...GOLD, ...EMERALD][Math.floor(r() * 9)]!, d: r() * 0.15 })); }, [seed, k]);
  return (
    <>
      <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }} transition={{ duration: 0.5 }} />
      <motion.div className="absolute left-1/2 top-[45%] size-[170%] -translate-x-1/2 -translate-y-1/2" initial={{ opacity: 0, rotate: 0, scale: 0.4 }} animate={{ opacity: [0, 0.7, 0], rotate: 70, scale: [0.4, 1, 1.2] }} transition={{ duration: 2, ease: 'easeOut' }}
        style={{ background: 'repeating-conic-gradient(from 0deg, rgba(245,208,97,.55) 0deg 7deg, transparent 7deg 24deg)', WebkitMask: 'radial-gradient(circle, #000 0, transparent 60%)', mask: 'radial-gradient(circle, #000 0, transparent 60%)' }} />
      {[0, 0.12, 0.26].map((d, i) => (
        <motion.span key={i} className="absolute left-1/2 top-[45%] block size-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ border: `${4 - i}px solid ${i === 1 ? '#34d399' : '#F5D061'}`, boxShadow: `0 0 24px ${i === 1 ? '#10b981' : '#D4AF37'}` }} initial={{ scale: 0, opacity: 0.9 }} animate={{ scale: (5 + i) * k, opacity: 0 }} transition={{ duration: 1.1, delay: d, ease: 'easeOut' }} />
      ))}
      <div className="absolute left-1/2 top-[45%]">
        {parts.map((p, i) => (
          <motion.span key={i} className="absolute block -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: p.s, height: p.s, background: p.c, boxShadow: `0 0 10px ${p.c}` }}
            initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: Math.cos(p.a) * p.rad, y: [0, Math.sin(p.a) * p.rad, Math.sin(p.a) * p.rad + 80], opacity: [0, 1, 1, 0], scale: [0.6, 1, 0.3] }} transition={{ duration: 1.8, delay: p.d, ease: 'easeOut' }} />
        ))}
      </div>
    </>
  );
}

/** Efecto de victoria. Con `burst` distinto se vuelve a lanzar (demo de la tienda). */
export const VictoryFx = memo(function VictoryFx({ id, burst = 0, compact = false }: { id: VictoryId; burst?: number; compact?: boolean }) {
  const k = compact ? 0.42 : 1;
  const seed = 7919 + burst * 131 + id.length * 17;
  return (
    <div key={`${id}-${burst}`} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" dir="ltr" style={{ ['--fx-h' as string]: compact ? '150px' : '100vh' }}>
      {id === 'destello' && <Classic />}
      {id === 'monedas' && <Coins seed={seed} />}
      {id === 'fuegos' && <Fireworks seed={seed} k={k} />}
      {id === 'relampago' && <Lightning seed={seed} />}
      {id === 'cartas' && <Cards seed={seed} />}
      {id === 'explosion' && <Explosion seed={seed} k={k} />}
    </div>
  );
});
