import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { WHEEL, colorOf, pocketAngle } from './engine.ts';

const STEP = 360 / WHEEL.length;
const C = 100;
const pt = (r: number, deg: number): string => {
  const a = (deg * Math.PI) / 180;
  return `${(C + r * Math.sin(a)).toFixed(2)} ${(C - r * Math.cos(a)).toFixed(2)}`;
};
const FILL = { red: '#8E1020', black: '#0A0A0C', green: '#0A6B45' } as const;

/** Cara de la rueda (madera oscura, bronce y oro, casillas rubí/obsidiana/esmeralda). Estática: solo se anima su contenedor. */
const WheelFace = memo(function WheelFace() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="rw-wood" cx=".5" cy=".4" r=".7"><stop offset="0" stopColor="#4a2e17" /><stop offset="1" stopColor="#1b0f07" /></radialGradient>
        <linearGradient id="rw-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FCE38A" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#8B6914" /></linearGradient>
        <radialGradient id="rw-track" cx=".5" cy=".5" r=".5"><stop offset=".78" stopColor="#15110c" /><stop offset=".92" stopColor="#241c12" /><stop offset="1" stopColor="#0d0a07" /></radialGradient>
        <radialGradient id="rw-hub" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#FCE38A" /><stop offset=".45" stopColor="#B8860B" /><stop offset="1" stopColor="#4d3407" /></radialGradient>
      </defs>
      <circle cx={C} cy={C} r="99" fill="url(#rw-wood)" />
      <circle cx={C} cy={C} r="96" fill="none" stroke="url(#rw-gold)" strokeWidth="1.6" />
      <circle cx={C} cy={C} r="90" fill="url(#rw-track)" stroke="#8B6914" strokeWidth=".8" />
      {WHEEL.map((n, i) => {
        const a0 = (i - 0.5) * STEP; const a1 = (i + 0.5) * STEP;
        const d = `M${pt(74, a0)} A74 74 0 0 1 ${pt(74, a1)} L${pt(52, a1)} A52 52 0 0 0 ${pt(52, a0)} Z`;
        return <path key={n} d={d} fill={FILL[colorOf(n)]} stroke="#D4AF37" strokeWidth=".55" />;
      })}
      {WHEEL.map((n, i) => (
        <text key={n} x={C} y={C - 66.5} transform={`rotate(${(i * STEP).toFixed(2)} ${C} ${C})`} textAnchor="middle" dominantBaseline="central"
          fontSize={n > 9 ? 6.2 : 6.8} fontWeight="700" fill="#F1E7C6" fontFamily="Outfit, system-ui, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</text>
      ))}
      <circle cx={C} cy={C} r="52" fill="none" stroke="url(#rw-gold)" strokeWidth="1.4" />
      <circle cx={C} cy={C} r="46" fill="#2b1d0e" stroke="#8B6914" strokeWidth=".8" />
      <circle cx={C} cy={C} r="38" fill="url(#rw-hub)" stroke="#FCE38A" strokeWidth=".8" />
      {[0, 90, 180, 270].map((a) => (
        <g key={a} transform={`rotate(${a} ${C} ${C})`}><rect x="97.6" y="64" width="4.8" height="29" rx="2.4" fill="url(#rw-gold)" /><circle cx={C} cy="62" r="3.2" fill="url(#rw-gold)" /></g>
      ))}
      <circle cx={C} cy={C} r="7" fill="#1b0f07" stroke="#FCE38A" strokeWidth="1" />
    </svg>
  );
});

interface Props {
  /** Cambia en cada giro. */
  spin: number;
  result: number | null;
  /** Segundos que dura el giro. */
  duration: number;
  className?: string;
}

/**
 * Rueda y bola con inercia física: la rueda gira hacia un lado y frena; la bola, en sentido contrario por la pista exterior, pierde
 * velocidad, cae a la zona de casillas con tres rebotes y queda exactamente en el número sorteado. Solo se animan transform y opacity.
 */
export function Wheel({ spin, result, duration, className = '' }: Props) {
  const [ang, setAng] = useState({ w: 0, b: 0 });
  const last = useRef(0);
  useEffect(() => {
    if (spin === 0 || spin === last.current || result === null) return;
    last.current = spin;
    setAng((cur) => {
      const w = cur.w + 360 * 3 + Math.random() * 360;
      const target = (((w + pocketAngle(result)) % 360) + 360) % 360;
      const x = (((cur.b - target) % 360) + 360) % 360;
      return { w, b: cur.b - 360 * 7 - x };
    });
  }, [spin, result]);
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: '1', contain: 'layout' }}>
      <motion.div className="absolute inset-0" initial={false} animate={{ rotate: ang.w }} transition={{ duration, ease: [0.1, 0.55, 0.25, 1] }} style={{ willChange: 'transform' }}>
        <WheelFace />
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-0" initial={false} animate={{ rotate: ang.b }} transition={{ duration, ease: [0.22, 0.6, 0.3, 1] }} style={{ willChange: 'transform', opacity: spin === 0 ? 0 : 1 }}>
        <motion.div key={spin} className="absolute inset-0" initial={{ scale: 1 }} animate={{ scale: [1, 1, 0.97, 0.8, 0.765, 0.79, 0.765] }}
          transition={{ duration, times: [0, 0.62, 0.8, 0.9, 0.95, 0.98, 1], ease: 'easeOut' }} style={{ willChange: 'transform' }}>
          <span className="absolute left-1/2 block rounded-full" style={{ top: '8.4%', width: '3.6%', height: '3.6%', transform: 'translateX(-50%)', background: 'radial-gradient(circle at 35% 30%, #fff, #ddd 55%, #8a8a8a)', boxShadow: '0 1px 3px rgba(0,0,0,.7)' }} />
        </motion.div>
      </motion.div>
    </div>
  );
}
