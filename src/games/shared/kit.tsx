import { memo, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimatedNumber } from '../mus/app/components/AnimatedNumber.tsx';
import { CardBack, CardFace } from '../mus/app/components/CardFace.tsx';
import { PhaseCinematic } from '../mus/app/components/PhaseCinematic.tsx';
import { Button } from '../mus/app/components/ui.tsx';
import { CINE, type PhaseCine } from '../mus/app/game/useTableDirector.ts';
import { CardBackArt, FrenchFace } from '../../components/cards/FrenchFace.tsx';
import type { AnyCard, SpanishCard, SpanishSuit } from '../../engine/deck.ts';
import { CARD_EASE, FAST_EASE, feedback, useSettings } from '../../store/settings.ts';
import { wallet } from '../../store/wallet.ts';
import { points as briscaPoints } from '../brisca/engine.ts';
import { escobaValue } from '../escoba/engine.ts';

/** En pantallas táctiles el «hover» se queda pegado tras tocar: solo se usa con ratón. */
const CAN_HOVER = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches;

/* Kit de interfaz con el estilo de Mus Online: píldoras flotantes, marcador doble, naipes Fournier, cartel de fase. */

// ─── Píldoras de acción (mismas clases que la ActionBar de Mus Online) ────────────────────────────
const PILL =
  'relative inline-flex h-10 items-center justify-center gap-1 overflow-hidden rounded-full border px-[min(4vw,18px)] text-[13px] font-bold tracking-wide transition-transform duration-100 enabled:active:scale-95 disabled:opacity-40 touch-manipulation';
const TONE = {
  gold: 'border-amber-200 bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950',
  ok: 'border-emerald-400/60 bg-emerald-800 text-emerald-50',
  danger: 'border-red-400/60 bg-red-950 text-red-50',
  soft: 'border-amber-300/55 bg-gradient-to-br from-amber-300/20 to-zinc-800 text-amber-100',
} as const;

export interface PillSpec { id: string; label: ReactNode; tone: keyof typeof TONE; disabled?: boolean; onPress: () => void }

/** Barra de acciones: píldora de cristal con botones redondeados. `idle` se muestra cuando no hay acciones. */
export function PillBar({ pills, idle }: { pills: PillSpec[]; idle?: string }) {
  return (
    <div className="flex min-h-[50px] items-center justify-center">
      <AnimatePresence mode="wait">
        {pills.length === 0 ? (
          <motion.div key="idle" className="rounded-full border border-white/10 bg-zinc-900/60 px-4 py-2 text-[12px] text-stone-400"
            initial={{ opacity: 0 }} animate={{ opacity: idle ? 1 : 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            {idle || ' '}
          </motion.div>
        ) : (
          <motion.div key="actions" role="group" aria-label="Acciones"
            className="flex max-w-full flex-wrap items-center justify-center gap-[5px] rounded-[26px] border border-white/10 bg-zinc-900/95 p-[5px]"
            initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1, transition: FAST_EASE }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}>
            {pills.map((p) => (
              <motion.button key={p.id} type="button" className={`${PILL} ${TONE[p.tone]}`} disabled={p.disabled} onClick={p.onPress}>
                {p.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Marcador doble (Nosotros / Ellos), como el Scoreboard de Mus Online ──────────────────────────
export function ScorePair({ labels = ['Nosotros', 'Ellos'], values, target, subs }: {
  labels?: [string, string]; values: [number, number]; target?: number; subs?: [ReactNode, ReactNode];
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-[min(1.8vw,8px)]" role="group" aria-label="Marcador">
      {[0, 1].map((i) => {
        const us = i === 0;
        return (
          <div key={i} className={`min-w-0 rounded-[13px] border border-white/10 px-[min(2.4vw,10px)] py-[min(1.1dvh,6px)] ${us ? 'bg-gradient-to-br from-teal-400/10 to-black/30' : 'bg-gradient-to-br from-orange-400/10 to-black/30'}`}>
            <div className="flex items-baseline justify-between gap-1">
              <span className={`shrink-0 whitespace-nowrap text-[9px] font-extrabold uppercase tracking-[.08em] ${us ? 'text-teal-300' : 'text-orange-300'}`}>{labels[i]}</span>
              <b className="font-[var(--font-display)] text-[clamp(17px,5.4vw,22px)] leading-none tabular-nums">
                <AnimatedNumber value={values[i]!} duration={0.7} />
                {target !== undefined && <small className="font-sans text-[9px] font-bold text-stone-400">/{target}</small>}
              </b>
            </div>
            {subs && <div className="mt-1 min-h-[10px] text-[10px] leading-none text-stone-400">{subs[i]}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Naipes ──────────────────────────────────────────────────────────────────────────────────────
/** Tamaño de carta: `--card-w` (definida por la mesa) multiplicada por `scale`. */
export const FaceCard = memo(function FaceCard({ card, faceDown, scale = 1, onClick, onSelect, selected, dim, glow, aura, shimmer, badge, title, rotate = 0, className = '', style }: {
  card: AnyCard; faceDown?: boolean; scale?: number; onClick?: () => void;
  /** Alternativa estable a `onClick`: recibe la carta (así la carta no se vuelve a pintar en cada frame del padre). */
  onSelect?: (card: AnyCard) => void; selected?: boolean; dim?: boolean; glow?: boolean;
  /** Aura dorada permanente (cartas de triunfo). */
  aura?: boolean;
  /** Brillo animado (7 de oros). */
  shimmer?: boolean;
  /** Distintivo discreto de valor (+11, =8…). */
  badge?: string;
  title?: string;
  rotate?: number; className?: string; style?: CSSProperties;
}) {
  const interactive = Boolean(onClick || onSelect);
  const handle = useCallback(() => { if (onSelect) onSelect(card); else onClick?.(); }, [onSelect, onClick, card]);
  const { help } = useSettings();
  if (!help) { badge = undefined; aura = false; shimmer = false; }
  const content = faceDown
    ? (card.deck === 'fr' ? <CardBackArt variant="midnight" /> : <CardBack />)
    : card.deck === 'fr' ? <FrenchFace card={card} /> : <CardFace card={card} />;
  return (
    <motion.button
      type="button"
      disabled={!interactive}
      onClick={handle}
      aria-pressed={interactive ? selected : undefined}
      aria-label={faceDown ? 'Carta boca abajo' : undefined}
      title={faceDown ? undefined : title}
      className={`${shimmer && !faceDown ? 'card-shimmer ' : ''}relative block shrink-0 touch-manipulation overflow-hidden rounded-none border border-black/40 will-change-transform ${interactive ? 'cursor-pointer' : 'cursor-default'} ${className}`}
      style={{
        width: `calc(var(--card-w) * ${scale})`,
        aspectRatio: card.deck === 'fr' ? '167 / 243' : '12 / 19',
        // Una sola sombra sencilla por carta: las sombras múltiples hunden los FPS en iOS Safari.
        boxShadow: selected || glow ? '0 0 0 2px #f0c35f' : (aura || shimmer) && !faceDown ? '0 0 0 1.5px rgba(240,195,95,.9)' : '0 3px 6px rgba(0,0,0,.5)',
        ...style,
      }}
      animate={{ y: selected ? -12 : 0, rotate }}
      whileHover={interactive && CAN_HOVER ? { y: selected ? -14 : -6 } : undefined}
      whileTap={interactive ? { scale: 0.96 } : undefined}
      transition={CARD_EASE}
    >
      {content}
      {dim && !faceDown && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/45" />}
      {badge && !faceDown && (
        <span aria-hidden="true" className="pointer-events-none absolute right-[5%] top-[3%] rounded-full bg-black/70 px-[.35em] py-[.05em] font-mono font-bold leading-none text-amber-200 shadow"
          style={{ fontSize: `max(8px, calc(var(--card-w) * ${scale} * 0.13))` }}>{badge}</span>
      )}
    </motion.button>
  );
});

/** Giro natural estable por carta (-6°…+6°). */
export const tilt = (id: string): number => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return (h % 13) - 6;
};

// ─── Avisos ──────────────────────────────────────────────────────────────────────────────────────
/** Texto grande en el centro del tapete (como los avisos «deje», «juego»…). */
export function useBanner(ms = 1700): { banner: string | null; show: (text: string) => void } {
  const [banner, setBanner] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string) => {
    setBanner(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBanner(null), ms);
  }, [ms]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { banner, show };
}

export function Banner({ text }: { text: string | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
      <AnimatePresence mode="wait">
        {text && (
          <motion.div key={text}
            className="px-2 text-center font-[var(--font-display)] text-[clamp(22px,7vw,34px)] font-bold leading-tight text-amber-300 [text-shadow:0_0_18px_rgba(240,195,95,.45)]"
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.3 } }}
            transition={FAST_EASE}>
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Cartel a pantalla casi completa (el de los lances de Mus) para momentos clave: ¡ESCOBA!, ¡VICTORIA!… */
export function useCine(): { cine: PhaseCine | null; show: (title: string, subtitle?: string) => void } {
  const [cine, setCine] = useState<PhaseCine | null>(null);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((title: string, subtitle?: string) => {
    setCine({ key: ++seq.current, lance: 'grande', title, subtitle: subtitle ?? null });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCine(null), (CINE.in + CINE.hold) * 1000);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { cine, show };
}

export { PhaseCinematic };

// ─── Resultado ───────────────────────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#f0c35f', '#fde68a', '#f59e0b', '#34d399', '#f472b6', '#60a5fa'];
/** 45 partículas como máximo, animadas con CSS (transform): ligeras incluso en móviles modestos. */
const CONFETTI = Array.from({ length: 42 }, (_, i) => ({
  left: (i * 37) % 100, dx: ((i * 53) % 120) - 60, rot: 180 + ((i * 71) % 540), dur: 1.6 + ((i * 13) % 14) / 10, delay: ((i * 7) % 12) / 20, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
}));
const DROPS = Array.from({ length: 6 }, (_, i) => ({ left: 8 + i * 16, r0: -20 + i * 9, r1: 160 + i * 40, dur: 1.5 + (i % 3) * 0.3, delay: i * 0.12 }));

/** Número que sube de 0 al premio con tintineo de fichas. */
function useCountUp(target: number): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    const t0 = performance.now();
    const dur = 900;
    let raf = 0;
    let ticks = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      setV(Math.round(target * (1 - (1 - k) ** 3)));
      if (Math.floor(k * 7) > ticks) { ticks = Math.floor(k * 7); feedback('chip'); }
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

export function ResultOverlay({ title, children, actions, outcome, prize = 0, taunt }: {
  title: string; children?: ReactNode; actions: { label: string; onClick: () => void; primary?: boolean }[];
  /** Fin de partida: «win» lanza confeti y el premio sube desde 0; «lose» destello rojo, cartas cayendo y un mensaje con guasa. */
  outcome?: 'win' | 'lose'; prize?: number; taunt?: string;
}) {
  const shown = useCountUp(outcome === 'win' ? prize : 0);
  useEffect(() => {
    if (!outcome) return;
    wallet.recordResult(outcome === 'win');
    feedback(outcome === 'win' ? 'win' : 'defeat');
  }, [outcome]);
  const win = outcome === 'win';
  return (
    <motion.div className="fixed inset-0 z-40 grid place-items-center bg-black/80 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {win && <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">{CONFETTI.map((c, i) => (
        <span key={i} className="confetti" style={{ left: `${c.left}%`, background: c.color, ['--dx' as string]: `${c.dx}px`, ['--rot' as string]: `${c.rot}deg`, ['--dur' as string]: `${c.dur}s`, ['--delay' as string]: `${c.delay}s` }} />
      ))}</div>}
      {outcome === 'lose' && <>
        <div aria-hidden className="red-flash pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">{DROPS.map((d, i) => (
          <span key={i} className="card-drop" style={{ left: `${d.left}%`, ['--r0' as string]: `${d.r0}deg`, ['--r1' as string]: `${d.r1}deg`, ['--dur' as string]: `${d.dur}s`, ['--delay' as string]: `${d.delay}s` }} />
        ))}</div>
      </>}
      <motion.div role="dialog" aria-modal="true" aria-label={title}
        className={`relative w-full max-w-sm rounded-3xl border bg-zinc-900/95 p-5 ${win ? 'border-amber-300/50' : outcome === 'lose' ? 'border-red-400/40' : 'border-amber-200/20'}`}
        initial={{ scale: 0.8, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }}>
        <h2 className={`mb-1 text-center font-[var(--font-display)] text-2xl font-bold ${outcome === 'lose' ? 'text-red-300' : 'text-amber-300'}`}>{title}</h2>
        {outcome === 'lose' && taunt && <p className="mb-3 text-center text-[13px] font-semibold text-red-200/90">{taunt}</p>}
        {win && prize > 0 && (
          <p className="mb-3 text-center font-mono text-3xl font-black tabular-nums text-amber-300" aria-label={`${prize} fichas ganadas`}>+{shown} <span className="text-base font-bold text-amber-200/80">fichas</span></p>
        )}
        {children}
        <div className="mt-4 grid gap-2">
          {actions.map((a) => (
            <div key={a.label} className={a.primary && outcome ? 'cta-pulse' : ''}>
              <Button variant={a.primary ? 'primary' : 'secondary'} block onClick={a.onClick}>{outcome && a.primary ? (win ? '¡Revancha!' : 'Revancha rápida') : a.label}</Button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Distintivos por juego ────────────────────────────────────────────────────────────────────────
/** Brisca: puntos de la carta (+11, +10, +4, +3, +2) y aura dorada para el palo de triunfo. */
export const briscaDeco = (card: SpanishCard, trump: SpanishSuit): { badge?: string; aura: boolean; title: string } => {
  const p = briscaPoints(card);
  return { badge: p > 0 ? `+${p}` : undefined, aura: card.suit === trump, title: `${p} puntos${card.suit === trump ? ' · triunfo' : ''}` };
};

/** Escoba: valor de suma de las figuras (=8, =9, =10) y brillo del 7 de oros (el «velo»: 1 punto directo). */
export const escobaDeco = (card: SpanishCard): { badge?: string; shimmer: boolean; title: string } => {
  const v = escobaValue(card);
  const velo = card.suit === 'oros' && card.rank === 7;
  return { badge: card.rank >= 10 ? `=${v}` : undefined, shimmer: velo, title: velo ? 'Siete de oros (el velo): 1 punto al final de la ronda' : `Vale ${v}` };
};

/** Marcador compacto para 3 o más jugadores (o puntuaciones individuales). */
export function ScoreStrip({ items, target }: { items: { name: string; value: number; us?: boolean }[]; target?: number }) {
  return (
    <div className="grid w-full gap-[min(1.4vw,6px)]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} role="group" aria-label="Marcador">
      {items.map((it) => (
        <div key={it.name} className={`min-w-0 rounded-[13px] border border-white/10 px-[min(2vw,8px)] py-[min(1dvh,5px)] ${it.us ? 'bg-gradient-to-br from-teal-400/10 to-black/30' : 'bg-gradient-to-br from-orange-400/10 to-black/30'}`}>
          <span className={`block truncate text-[8px] font-extrabold uppercase tracking-[.06em] ${it.us ? 'text-teal-300' : 'text-orange-300'}`}>{it.name}</span>
          <b className={`font-[var(--font-display)] leading-none tabular-nums ${items.length > 3 ? "text-[clamp(11px,3.3vw,15px)]" : "text-[clamp(15px,4.6vw,20px)]"}`}>
            <AnimatedNumber value={it.value} duration={0.7} />{target !== undefined && <small className="font-sans text-[8px] font-bold text-stone-400">/{target}</small>}
          </b>
        </div>
      ))}
    </div>
  );
}

