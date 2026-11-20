import { Crown, Coins, Layers, PartyPopper, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import { CardBackArt } from '../cards/FrenchFace.tsx';
import { AvatarFrame } from './AvatarFrame.tsx';
import { AvatarEmblem } from './AvatarEmblem.tsx';
import { SHOP_EMOTES } from './Reactions.tsx';
import { DICE } from '../../games/mentiroso/Dice.tsx';
import { BACKS, TITLE_ITEMS, chipLook, type AvatarId, type FrameId, type Kind, type Rarity, type SetId, type State, type VictoryId } from '../../store/cosmetics.ts';
import { THEMES } from '../../store/settings.ts';

/** Piezas visuales comunes a la tienda y a la Taquilla: dibujo de cada artículo, etiquetas de rareza y nombres. */
export const RARITY_STYLE: Record<Rarity, { chip: string; ring: string }> = {
  comun: { chip: 'border-white/15 bg-white/[0.06] text-stone-300', ring: 'border-white/10' },
  raro: { chip: 'border-sky-400/40 bg-sky-400/10 text-sky-300', ring: 'border-sky-400/25' },
  epico: { chip: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300', ring: 'border-fuchsia-400/30' },
  legendario: { chip: 'border-amber-300/60 bg-gradient-to-r from-amber-400/25 to-orange-400/20 text-amber-200', ring: 'border-amber-300/45' },
};
export const RarityBadge = ({ r, t }: { r: Rarity; t: (k: string) => string }) => (
  <span className={`rounded-full border px-2 py-[1px] text-[9px] font-extrabold uppercase tracking-wider ${RARITY_STYLE[r].chip}`}>{t(`rar.${r}`)}</span>
);

const NAME_KEY: Partial<Record<Kind, string>> = { backs: 'cb', mats: 'tp', frames: 'fr', avatars: 'av', wins: 'vc', sets: 'cs' };
export const money = (n: number): string => n.toLocaleString('es-ES');

export const WIN_ICON: Record<VictoryId, LucideIcon> = { destello: Sparkles, monedas: Coins, fuegos: PartyPopper, relampago: Zap, cartas: Layers, explosion: Crown };
const WIN_BG: Record<VictoryId, string> = {
  destello: 'from-amber-200/40 to-amber-700/30', monedas: 'from-yellow-300/50 to-amber-700/40', fuegos: 'from-emerald-300/40 to-emerald-900/50',
  relampago: 'from-yellow-200/50 to-orange-700/40', cartas: 'from-rose-300/40 to-indigo-900/50', explosion: 'from-amber-300/60 to-fuchsia-800/50',
};

/** Vista previa de un juego de fichas y dados: una ficha y un dado con la paleta del juego. */
export function SetPreview({ id }: { id: SetId }) {
  return (
    <span className="flex items-center gap-2">
      <span className="block size-10 rounded-full shadow-[0_3px_5px_rgba(0,0,0,.5)]">
        <svg viewBox="0 0 100 100" className="size-full" shapeRendering="geometricPrecision" aria-hidden="true">
          {(() => {
            const c = chipLook(id, 2, { base: '#c62f2f', ring: '#ffd0d0', ink: '#fff' });
            return (
              <>
                <circle cx="50" cy="50" r="48" fill={c.base} stroke="#000" strokeOpacity=".45" strokeWidth="2" />
                {Array.from({ length: 12 }, (_, i) => <rect key={i} x="43" y="2" width="14" height="13" rx="2" fill={c.ring} transform={`rotate(${i * 30} 50 50)`} />)}
                <circle cx="50" cy="50" r="30" fill="none" stroke={c.ring} strokeWidth="3" strokeDasharray="4 3" />
              </>
            );
          })()}
        </svg>
      </span>
      <PreviewDie id={id} />
    </span>
  );
}
function PreviewDie({ id }: { id: SetId }) {
  const d = DICE[id];
  return (
    <span className="block size-11">
      <svg viewBox="0 0 100 100" className="size-full" shapeRendering="geometricPrecision" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 28 L50 50 L50 94 L8 72 Z" fill={d.left[0]} />
        <path d="M92 28 L50 50 L50 94 L92 72 Z" fill={d.right[0]} />
        <path d="M50 6 L92 28 L50 50 L8 28 Z" fill={d.top[0]} />
        <g transform="matrix(.42 .22 -.42 .22 50 6)">{[[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="10.4" fill={d.pip[1]} />)}</g>
        <path d="M50 6 L92 28 L92 72 L50 94 L8 72 L8 28 Z" fill="none" stroke="#B8860B" strokeWidth="2.2" />
      </svg>
    </span>
  );
}

/** Disco de avatar con letra o emblema, y marco opcional. */
export function AvatarDisc({ emblem, frame, letter = 'T', size = 'size-14' }: { emblem: AvatarId | null; frame?: FrameId; letter?: string; size?: string }) {
  return (
    <span className={`relative grid ${size} place-items-center rounded-full border border-white/15 bg-gradient-to-br from-[#1f6a5e] to-[#154a42] font-[var(--font-display)] text-lg font-bold text-teal-50`}>
      {emblem ? <AvatarEmblem id={emblem} /> : letter}
      {frame && <AvatarFrame id={frame} />}
    </span>
  );
}

/** Dibujo de cada artículo. */
export function Art({ kind, id, c }: { kind: Kind; id: string; c: State }) {
  switch (kind) {
    case 'backs': return <span className="block w-14 overflow-hidden rounded-lg shadow-[0_6px_14px_rgba(0,0,0,.5)]" style={{ aspectRatio: '2 / 3' }}><CardBackArt variant={BACKS.find((b) => b.id === id)!.variant} seal="" /></span>;
    case 'mats': return <span className={`block size-12 rounded-full border-2 border-white/15 bg-gradient-to-br ${THEMES[id as keyof typeof THEMES].swatch}`} />;
    case 'frames': return <span className="mt-3 block"><AvatarDisc emblem={c.avatar} frame={id as FrameId} /></span>;
    case 'avatars': return <span className="block size-14 rounded-full border-2 border-amber-300/50 shadow-[0_4px_10px_rgba(0,0,0,.5)]"><AvatarEmblem id={id as AvatarId} /></span>;
    case 'wins': {
      const I = WIN_ICON[id as VictoryId];
      return <span className={`grid size-14 place-items-center rounded-2xl border border-white/15 bg-gradient-to-br ${WIN_BG[id as VictoryId]}`}><I size={26} strokeWidth={1.75} className="text-amber-100" aria-hidden /></span>;
    }
    case 'titles': return <span className="flex min-h-14 items-center gap-1.5 rounded-xl border border-amber-300/30 bg-black/30 px-2.5 py-1 text-center font-[var(--font-display)] text-[11px] font-bold leading-tight text-amber-200"><Crown size={13} strokeWidth={1.75} className="shrink-0" aria-hidden />{TITLE_ITEMS.find((x) => x.id === id)!.name}</span>;
    case 'reacts': {
      const sh = SHOP_EMOTES[id as keyof typeof SHOP_EMOTES];
      return <span className="grid size-14 place-items-center rounded-full border border-amber-300/40 bg-gradient-to-b from-zinc-800 to-zinc-950 text-amber-200"><sh.icon size={24} strokeWidth={1.75} aria-hidden /></span>;
    }
    default: return <SetPreview id={id as SetId} />;
  }
}


/** Barra de color inferior según rareza (Taquilla). */
export const RARITY_BAR: Record<Rarity, string> = { legendario: '#D4AF37', epico: '#8B5CF6', raro: '#3B82F6', comun: '#2F6F5E' };

/** Nombre traducido de un artículo (cae al nombre en español si no hay traducción). */
export function nameOf(t: (k: string) => string, kind: Kind, id: string, fallback: string): string {
  const p = NAME_KEY[kind]; if (!p) return fallback;
  const v = t(`${p}.${id}`); return v === `${p}.${id}` ? fallback : v;
}
