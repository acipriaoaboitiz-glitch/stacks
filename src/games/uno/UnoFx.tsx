import { useEffect, useState, type ReactNode } from 'react';
import { animate, motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { Ban } from 'lucide-react';
import { Portal } from '../../components/ui/Portal.tsx';
import type { Color } from './engine.ts';
import { UnoBack } from './UnoCard.tsx';

/**
 * Efectos cinéticos de UNO. Todo usa `transform` y `opacity`; cada efecto dura 450–650 ms y vive en una capa
 * fija (`pointer-events-none`) por encima de la mesa y por debajo de los avisos, así nunca bloquea el juego.
 * Las coordenadas salen de los propios elementos (`data-uno="seat-top" | "deck" | "discard"…`), medidas al disparar el efecto.
 */
export type Slot = 'bottom' | 'right' | 'top' | 'left';

export const FX_HEX: Record<Color, string> = { red: '#EF4444', blue: '#3B82F6', green: '#10B981', yellow: '#F59E0B' };
const DISPLAY = "'Unbounded','Outfit',sans-serif";

export type FxItem = { id: number } & (
  | { kind: 'attack'; n: 2 | 4; slot: Slot; color: Color; delay?: number }
  | { kind: 'skip'; slot: Slot }
  | { kind: 'reverse'; color: Color }
  | { kind: 'wave'; color: Color }
  | { kind: 'prism'; delay?: number }
);

export type FxInput = FxItem extends infer T ? (T extends unknown ? Omit<T, 'id'> : never) : never;

/** Duración total (ms) de cada efecto, para retirarlo de la capa. */
export const fxLife = (f: FxItem): number => {
  switch (f.kind) {
    case 'attack': return 1500 + (f.delay ?? 0) * 1000;
    case 'skip': return 1200;
    case 'reverse': return 900;
    case 'wave': return 800;
    default: return 800 + (f.delay ?? 0) * 1000;
  }
};

interface Pt { x: number; y: number }
const FALLBACK: Record<Slot | 'mid', [number, number]> = { mid: [0.5, 0.42], top: [0.5, 0.26], left: [0.12, 0.44], right: [0.88, 0.44], bottom: [0.14, 0.86] };
const fallback = (k: Slot | 'mid'): Pt => ({ x: (typeof window === 'undefined' ? 400 : window.innerWidth) * FALLBACK[k][0], y: (typeof window === 'undefined' ? 700 : window.innerHeight) * FALLBACK[k][1] });
const center = (key: string): Pt | null => {
  const el = document.querySelector(`[data-uno="${key}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width === 0 && r.height === 0 ? null : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
export const seatPt = (slot: Slot): Pt => center(`seat-${slot}`) ?? fallback(slot);
const discardPt = (): Pt => center('discard') ?? fallback('mid');
const deckPt = (): Pt => center('deck') ?? fallback('mid');
/** Desplazamiento (px) desde el montón de descarte hasta un asiento: de ahí sale cada carta jugada. */
export const seatOffset = (slot: Slot): Pt => { const a = seatPt(slot); const d = discardPt(); return { x: a.x - d.x, y: a.y - d.y }; };

/** Contenedor que centra su contenido sobre un punto de la pantalla. */
function At({ p, children, className = '' }: { p: Pt; children: ReactNode; className?: string }) {
  return <div className={`absolute left-0 top-0 ${className}`} style={{ transform: `translate(${p.x}px, ${p.y}px)` }}><div className="-translate-x-1/2 -translate-y-1/2">{children}</div></div>;
}

// ─── +2 / +4 ────────────────────────────────────────────────────────────────────────────────────
function Attack({ n, slot, color, delay = 0 }: { n: 2 | 4; slot: Slot; color: Color; delay?: number }) {
  const [g] = useState(() => ({ from: discardPt(), deck: deckPt(), to: seatPt(slot) }));
  const hex = n === 4 ? '#F43F5E' : FX_HEX[color];
  const hit = 0.42; // el emblema llega al asiento
  const t0 = delay + hit - 0.05;
  return (
    <>
      {/* emblema tipográfico: sale del descarte, golpea el asiento y se desvanece */}
      <motion.div className="absolute left-0 top-0" initial={{ x: g.from.x, y: g.from.y, opacity: 0 }}
        animate={{ x: [g.from.x, g.to.x], y: [g.from.y, g.to.y], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.6, delay, times: [0, 0.12, 0.7, 1] } }}>
        <motion.div className="-translate-x-1/2 -translate-y-1/2" animate={{ scale: [0.6, 1.25, 1] }} transition={{ duration: 0.6, delay, times: [0, 0.7, 1], ease: 'easeOut' }}>
          <span className="grid place-items-center rounded-2xl border-2 px-3 py-1 text-[26px] font-extrabold leading-none text-white"
            style={{ fontFamily: DISPLAY, borderColor: '#FCE38A', background: `linear-gradient(160deg, ${hex}, #7f1d1d)`, boxShadow: `0 0 18px 3px ${hex}cc, 0 0 0 2px rgba(252,227,138,.55)` }}>
            +{n}
          </span>
        </motion.div>
      </motion.div>
      {/* ráfaga de cartas en miniatura: del mazo al avatar castigado */}
      {Array.from({ length: n }, (_, i) => (
        <motion.div key={i} className="absolute left-0 top-0" initial={{ x: g.deck.x, y: g.deck.y, opacity: 0 }}
          animate={{ x: [g.deck.x, g.to.x], y: [g.deck.y, g.to.y], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5, delay: t0 + i * 0.075, ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.5, delay: t0 + i * 0.075, times: [0, 0.1, 0.8, 1] } }}>
          <motion.div className="-translate-x-1/2 -translate-y-1/2" initial={{ rotate: -20 + i * 14, scale: 1 }} animate={{ rotate: [-20 + i * 14, 8 - i * 5], scale: [1, 0.7] }} transition={{ duration: 0.5, delay: t0 + i * 0.075 }}>
            <div className="h-[30px] w-[20px] overflow-hidden rounded-[4px] border-[1.5px] border-white shadow-[0_3px_8px_rgba(0,0,0,.55)]"><UnoBack /></div>
          </motion.div>
        </motion.div>
      ))}
      {/* destello de impacto en el borde del avatar al recibir la última carta */}
      <At p={g.to}>
        <motion.span className="block size-14 rounded-full border-[3px]" style={{ borderColor: hex, boxShadow: `0 0 16px 4px ${hex}aa, inset 0 0 12px ${hex}88` }}
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: [0, 0.95, 0], scale: [0.7, 1.35, 1.7] }} transition={{ duration: 0.5, delay: t0 + (n - 1) * 0.075 + 0.32 }} />
      </At>
    </>
  );
}

// ─── Salto ⊘ ────────────────────────────────────────────────────────────────────────────────────
function Skip({ slot }: { slot: Slot }) {
  const [g] = useState(() => ({ from: discardPt(), to: seatPt(slot) }));
  const dx = g.to.x - g.from.x; const dy = g.to.y - g.from.y;
  const len = Math.hypot(dx, dy); const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <>
      <div className="absolute left-0 top-0" style={{ transform: `translate(${g.from.x}px, ${g.from.y}px) rotate(${ang}deg)`, transformOrigin: '0 50%' }}>
        <motion.div className="h-[3px] origin-left rounded-full" style={{ width: len, background: 'linear-gradient(90deg, rgba(245,158,11,0), #F59E0B 55%, #EF4444)', boxShadow: '0 0 10px 2px rgba(239,68,68,.65)' }}
          initial={{ scaleX: 0, opacity: 1 }} animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }} transition={{ duration: 0.45, times: [0, 0.6, 1], ease: 'easeOut' }} />
      </div>
      <At p={g.to}>
        <motion.div initial={{ opacity: 0, scale: 0.4, x: 0 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.15, 1, 1], x: [0, -6, 6, -4, 4, 0] }}
          transition={{ duration: 0.9, delay: 0.3, times: [0, 0.2, 0.7, 1], x: { duration: 0.45, delay: 0.3 } }}>
          <span className="grid size-14 place-items-center rounded-full border-[3px] border-red-500 bg-black/70 text-red-400" style={{ boxShadow: '0 0 18px 3px rgba(239,68,68,.7), inset 0 0 12px rgba(245,158,11,.45)' }}>
            <Ban size={34} strokeWidth={2.4} aria-hidden />
          </span>
        </motion.div>
      </At>
    </>
  );
}

// ─── Onda expansiva (cambio de color) ───────────────────────────────────────────────────────────
function Wave({ color, at }: { color: Color; at?: Pt }) {
  const [p] = useState(() => at ?? discardPt());
  const hex = FX_HEX[color];
  return (
    <At p={p}>
      <motion.span className="block size-[110px] rounded-full" style={{ border: `3px solid ${hex}`, background: `radial-gradient(circle, ${hex}55, transparent 68%)`, boxShadow: `0 0 26px 4px ${hex}88` }}
        initial={{ scale: 0, opacity: 0.45 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }} />
    </At>
  );
}

// ─── Destello prismático del +4 ─────────────────────────────────────────────────────────────────
function Prism({ delay = 0 }: { delay?: number }) {
  const [p] = useState(() => discardPt());
  return (
    <At p={p}>
      <motion.span className="block size-[120px] rounded-full" style={{ background: `conic-gradient(${FX_HEX.red} 0 25%, ${FX_HEX.blue} 25% 50%, ${FX_HEX.green} 50% 75%, ${FX_HEX.yellow} 75% 100%)`, WebkitMask: 'radial-gradient(circle, transparent 54%, #000 56%, #000 70%, transparent 72%)', mask: 'radial-gradient(circle, transparent 54%, #000 56%, #000 70%, transparent 72%)' }}
        initial={{ scale: 0.5, opacity: 0, rotate: 0 }} animate={{ scale: [0.5, 1.15, 1.35], opacity: [0, 1, 0], rotate: 120 }} transition={{ duration: 0.6, delay, ease: 'easeOut' }} />
    </At>
  );
}

// ─── Cambio de sentido ⇄ ────────────────────────────────────────────────────────────────────────
function Reverse({ color }: { color: Color }) {
  const [p] = useState(() => discardPt());
  const hex = FX_HEX[color];
  const arc = (flip: boolean) => (
    <motion.svg viewBox="0 0 60 60" className="absolute left-1/2 top-1/2 size-[64px] -translate-x-1/2 -translate-y-1/2" style={{ scaleX: flip ? -1 : 1 }} aria-hidden
      initial={{ x: flip ? 46 : -46, opacity: 0 }} animate={{ x: [flip ? 46 : -46, 0, 0], opacity: [0, 1, 0], scale: [0.9, 1, 1.2] }} transition={{ duration: 0.4, times: [0, 0.65, 1], ease: 'easeIn' }}>
      <path d="M8 38 A24 24 0 0 1 44 14" fill="none" stroke={hex} strokeWidth="5" strokeLinecap="round" />
      <path d="M38 8 L45 14 L37 19" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
  return (
    <>
      <At p={p}><div className="relative size-[64px]">{arc(false)}{arc(true)}</div></At>
      {/* onda del choque */}
      <At p={p}>
        <motion.span className="block size-[110px] rounded-full" style={{ border: `3px solid ${hex}`, boxShadow: `0 0 22px 3px ${hex}99` }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 0, 2.2], opacity: [0, 0.8, 0] }} transition={{ duration: 0.7, times: [0, 0.35, 1], ease: 'easeOut' }} />
      </At>
    </>
  );
}

/** Capa de efectos (portal a `body`, z-45: por debajo de modales, avisos y cinemáticas). */
export function UnoFx({ items }: { items: FxItem[] }) {
  if (items.length === 0) return null;
  return (
    <Portal>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[45] overflow-hidden" dir="ltr">
        {items.map((f) => {
          switch (f.kind) {
            case 'attack': return <Attack key={f.id} n={f.n} slot={f.slot} color={f.color} delay={f.delay} />;
            case 'skip': return <Skip key={f.id} slot={f.slot} />;
            case 'reverse': return <Reverse key={f.id} color={f.color} />;
            case 'wave': return <Wave key={f.id} color={f.color} />;
            default: return <Prism key={f.id} delay={f.delay} />;
          }
        })}
      </div>
    </Portal>
  );
}

// ─── Anillo orbital permanente ──────────────────────────────────────────────────────────────────
const SPEED = 0.045; // grados por ms (una vuelta cada 8 s)

/**
 * Anillo luminoso con flechas curvas que gira sin parar en el sentido del turno. Al invertirse la dirección, la velocidad
 * pasa de un signo al otro con un muelle (frena en seco, rebota y arranca al revés) y las flechas cambian de sentido.
 * `dir === 1` es sentido antihorario.
 */
export function OrbitRing({ dir, color }: { dir: 1 | -1; color: Color }) {
  const hex = FX_HEX[color];
  const rot = useMotionValue(0);
  const speed = useMotionValue(dir === 1 ? -SPEED : SPEED);
  useEffect(() => {
    const c = animate(speed, dir === 1 ? -SPEED : SPEED, { type: 'spring', stiffness: 170, damping: 8, mass: 0.7 });
    return () => c.stop();
  }, [dir, speed]);
  useAnimationFrame((_, dt) => { rot.set((rot.get() + speed.get() * Math.min(dt, 50)) % 360); });
  const arrows = [0, 120, 240];
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[min(124%,230px)] -translate-x-1/2 -translate-y-1/2">
      <motion.svg viewBox="0 0 100 100" className="size-full" style={{ rotate: rot, willChange: 'transform' }}>
        <circle cx="50" cy="50" r="46" fill="none" strokeWidth="5" opacity=".14" style={{ stroke: hex, transition: 'stroke .4s' }} />
        <circle cx="50" cy="50" r="46" fill="none" strokeWidth="1.6" strokeDasharray="1.5 5" strokeLinecap="round" opacity=".85" style={{ stroke: hex, transition: 'stroke .4s' }} />
        {arrows.map((a) => (
          <g key={a} transform={`rotate(${a} 50 50)`}>
            <motion.path d="M44 1.8 L51 4.6 L44 7.6" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: hex, transition: 'stroke .4s' }}
              animate={{ opacity: dir === 1 ? 0 : 1 }} transition={{ duration: 0.25 }} />
            <motion.path d="M56 1.8 L49 4.6 L56 7.6" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: hex, transition: 'stroke .4s' }}
              animate={{ opacity: dir === 1 ? 1 : 0 }} transition={{ duration: 0.25 }} />
          </g>
        ))}
      </motion.svg>
    </div>
  );
}

/** Resplandor ambiental de la mesa teñido del color activo. */
export function AmbientGlow({ color }: { color: Color }) {
  const hex = FX_HEX[color];
  return (
    <motion.div key={color} aria-hidden className="pointer-events-none absolute inset-0 z-0" style={{ background: `radial-gradient(ellipse at 50% 52%, ${hex}38 0%, ${hex}14 38%, transparent 70%)` }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
  );
}

/** Anillo de cuenta atrás para `¡CANTAR UNO!` (se vacía en `total` ms y palpita en los últimos 2 s). */
export function CountdownRing({ remaining, total, urgent }: { remaining: number; total: number; urgent: boolean }) {
  const f = Math.max(0, Math.min(1, remaining / total));
  const C = 2 * Math.PI * 17;
  return (
    <motion.span className="relative grid size-11 shrink-0 place-items-center" animate={urgent ? { scale: [1, 1.14, 1] } : { scale: 1 }} transition={urgent ? { duration: 0.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.15 }}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full -rotate-90">
        <circle cx="20" cy="20" r="17" fill="rgba(0,0,0,.4)" stroke="rgba(255,255,255,.25)" strokeWidth="3" />
        <circle cx="20" cy="20" r="17" fill="none" stroke={urgent ? '#FDE68A' : '#fff'} strokeWidth="3.4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - f)} />
      </svg>
      <b className="relative font-mono text-[12px] tabular-nums text-white">{(remaining / 1000).toFixed(1)}</b>
    </motion.span>
  );
}
