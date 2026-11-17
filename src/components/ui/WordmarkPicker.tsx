import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Las 12 tipografías candidatas para la palabra STACKS (selección temporal). */
export const WORDMARK_FONTS: { name: string; family: string; weight: number; tracking: string; scale?: number }[] = [
  { name: 'Syne', family: "'Syne', sans-serif", weight: 800, tracking: '0.18em' },
  { name: 'Outfit', family: "'Outfit', sans-serif", weight: 900, tracking: '0.20em' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", weight: 800, tracking: '0.22em' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", weight: 700, tracking: '0.20em' },
  { name: 'Unbounded', family: "'Unbounded', sans-serif", weight: 700, tracking: '0.14em', scale: 0.85 },
  { name: 'Cinzel', family: "'Cinzel', serif", weight: 700, tracking: '0.24em' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", weight: 900, tracking: '0.18em' },
  { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif", weight: 700, tracking: '0.26em', scale: 1.1 },
  { name: 'Marcellus', family: "'Marcellus', serif", weight: 400, tracking: '0.25em' },
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", weight: 400, tracking: '0.22em', scale: 1.2 },
  { name: 'Oswald', family: "'Oswald', sans-serif", weight: 700, tracking: '0.18em' },
  { name: 'Chakra Petch', family: "'Chakra Petch', sans-serif", weight: 700, tracking: '0.20em' },
];

const KEY = 'stacks.wordmark.v1';
const load = (): { i: number; gold: boolean } => {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { i?: number; gold?: boolean };
    return { i: typeof p.i === 'number' && p.i >= 0 && p.i < WORDMARK_FONTS.length ? p.i : 0, gold: Boolean(p.gold) };
  } catch { return { i: 0, gold: false }; }
};

/** STACKS en una tipografía y color dados. */
export function WordmarkText({ i, gold, size = 24 }: { i: number; gold: boolean; size?: number }) {
  const f = WORDMARK_FONTS[i]!;
  const style: React.CSSProperties = {
    fontFamily: f.family, fontWeight: f.weight, letterSpacing: f.tracking, fontSize: size * (f.scale ?? 1), lineHeight: 1,
    ...(gold
      ? { background: 'linear-gradient(135deg,#F5D061,#D4AF37)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
      : { color: '#FAF8F0' }),
  };
  return <span className="inline-block select-none whitespace-nowrap uppercase" style={style}>STACKS</span>;
}

/** Wordmark del header con selector temporal: toca la palabra o las flechas para cambiar de fuente. */
export function WordmarkPicker() {
  const nav = useNavigate();
  const init = load();
  const [i, setI] = useState(init.i);
  const [gold, setGold] = useState(init.gold);
  const save = (n: number, g: boolean): void => { try { localStorage.setItem(KEY, JSON.stringify({ i: n, gold: g })); } catch { /* sin almacenamiento */ } };
  const go = (d: number): void => { const n = (i + d + WORDMARK_FONTS.length) % WORDMARK_FONTS.length; setI(n); save(n, gold); };
  const toggle = (): void => { setGold(!gold); save(i, !gold); };
  return (
    <div className="grid min-w-0 justify-items-center gap-1" role="group" aria-label="Wordmark STACKS">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Fuente anterior" onClick={() => go(-1)} className="grid size-6 touch-manipulation place-items-center rounded-full text-stone-500 active:scale-90"><ChevronLeft size={14} /></button>
        <button type="button" aria-label="Cambiar fuente" onClick={() => go(1)} className="touch-manipulation px-1"><WordmarkText i={i} gold={gold} /></button>
        <button type="button" aria-label="Fuente siguiente" onClick={() => go(1)} className="grid size-6 touch-manipulation place-items-center rounded-full text-stone-500 active:scale-90"><ChevronRight size={14} /></button>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
        <span className="tabular-nums">{String(i + 1).padStart(2, '0')} / {WORDMARK_FONTS.length} · {WORDMARK_FONTS[i]!.name}</span>
        <button type="button" aria-label={gold ? 'Letra en blanco marfil' : 'Letra en oro'} onClick={toggle}
          className="size-3 touch-manipulation rounded-full border border-white/40" style={{ background: gold ? '#FAF8F0' : 'linear-gradient(135deg,#F5D061,#D4AF37)' }} />
        <button type="button" onClick={() => nav('/branding')} className="touch-manipulation underline decoration-dotted">Elegir fuente e icono</button>
      </div>
    </div>
  );
}
