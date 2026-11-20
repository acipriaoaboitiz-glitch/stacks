import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crown, MessageCircle, Shuffle, Store, Trophy } from 'lucide-react';
import { useT } from '../../i18n/index.ts';
import { CardBackArt } from '../cards/FrenchFace.tsx';
import { AvatarEmblem } from './AvatarEmblem.tsx';
import { VictoryFx } from './VictoryFx.tsx';
import { SHOP_EMOTES } from './Reactions.tsx';
import { Art, AvatarDisc, RARITY_BAR, WIN_ICON, nameOf } from './shopParts.tsx';
import { BACKS, CATALOG, TITLE_ITEMS, cosmetics, owns, useCosmetics, RARITY_ORDER, type Item, type Kind, type Rarity } from '../../store/cosmetics.ts';
import { useProfile } from '../../store/profile.ts';
import { THEMES, feedback, useSettings } from '../../store/settings.ts';

/** Categorías de la Taquilla, en el orden de la tira de huecos. */
const SLOTS: Kind[] = ['backs', 'mats', 'frames', 'avatars', 'wins', 'titles', 'reacts', 'sets'];
const FILTERS: ('all' | Rarity)[] = ['all', 'legendario', 'epico', 'raro', 'comun'];
const FILTER_LABEL: Record<'all' | Rarity, string> = { all: 'lk.all', legendario: 'rar.legendario', epico: 'rar.epico', raro: 'rar.raro', comun: 'rar.comun' };

/** Miniatura del cosmético equipado en cada hueco. */
function MiniArt({ kind, equippedId, emblem }: { kind: Kind; equippedId: string; emblem: string | null }) {
  const c = useCosmetics();
  switch (kind) {
    case 'backs': return <span className="block w-6 overflow-hidden rounded-[4px] shadow-[0_3px_6px_rgba(0,0,0,.5)]" style={{ aspectRatio: '2 / 3' }}><CardBackArt variant={BACKS.find((b) => b.id === equippedId)!.variant} seal="" /></span>;
    case 'mats': return <span className={`block size-7 rounded-full border border-white/20 bg-gradient-to-br ${THEMES[equippedId as keyof typeof THEMES].swatch}`} />;
    case 'frames': return <AvatarDisc emblem={null} frame={equippedId as never} size="size-6" letter="" />;
    case 'avatars': return emblem ? <span className="block size-7 overflow-hidden rounded-full border border-amber-300/50"><AvatarEmblem id={emblem as never} /></span> : <AvatarDisc emblem={null} size="size-7" letter="T" />;
    case 'wins': { const I = WIN_ICON[equippedId as keyof typeof WIN_ICON]; return <I size={20} strokeWidth={1.75} className="text-amber-200" aria-hidden />; }
    case 'titles': return <Crown size={20} strokeWidth={1.75} className="text-amber-200" aria-hidden />;
    case 'reacts': { const first = c.reactions[0]; const Ic = first ? SHOP_EMOTES[first].icon : MessageCircle; return <Ic size={20} strokeWidth={1.75} className="text-amber-200" aria-hidden />; }
    default: return <Art kind="sets" id={equippedId} c={c} />;
  }
}

/**
 * Taquilla VIP: solo los cosméticos que ya tienes. Mini-escaparate con tu combinación, tira de huecos activos y cuadrícula
 * de artículos en propiedad con rarezas; un toque en cualquier tarjeta lo equipa al instante.
 */
export function LockerView({ onShop }: { onShop: (kind: Kind) => void }) {
  const t = useT();
  const c = useCosmetics();
  const prof = useProfile();
  const { theme } = useSettings();
  const [cat, setCat] = useState<Kind>('backs');
  const [rar, setRar] = useState<'all' | Rarity>('all');
  const [burst, setBurst] = useState(0);
  const [flash, setFlash] = useState(0);
  const slotRefs = useRef<Partial<Record<Kind, HTMLButtonElement | null>>>({});
  useEffect(() => { slotRefs.current[cat]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [cat]);
  useEffect(() => { setRar('all'); }, [cat]);

  const th = THEMES[theme];
  const titleNow = prof?.title ?? 'Jugador VIP';
  const equippedId = (k: Kind): string => (k === 'backs' ? c.back : k === 'mats' ? theme : k === 'frames' ? c.frame : k === 'sets' ? c.set : k === 'wins' ? c.victory
    : k === 'avatars' ? c.avatar ?? 'default' : k === 'titles' ? TITLE_ITEMS.find((x) => x.name === titleNow)?.id ?? 'base' : '');
  const total = (k: Kind): number => CATALOG.filter((x) => x.kind === k).length;
  const have = (k: Kind): number => CATALOG.filter((x) => x.kind === k && owns(k, x.id, c)).length;
  const slotName = (k: Kind): string => {
    if (k === 'avatars') return c.avatar ? nameOf(t, k, c.avatar, CATALOG.find((x) => x.kind === k && x.id === c.avatar)?.name ?? '') : t('lk.initial');
    if (k === 'titles') return titleNow;
    if (k === 'reacts') return `${c.reactions.length} ${t('lk.inMenu')}`;
    const it = CATALOG.find((x) => x.kind === k && x.id === equippedId(k));
    return it ? nameOf(t, k, it.id, it.name) : '';
  };

  // artículos en propiedad de la categoría activa (+ el elemento base cuando no es un artículo de la tienda)
  const owned: (Item & { base?: boolean })[] = CATALOG.filter((x) => x.kind === cat && owns(cat, x.id, c)).sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || b.price - a.price);
  const list: (Item & { base?: boolean })[] = [
    ...(cat === 'avatars' ? [{ kind: cat, id: 'default', name: t('lk.initial'), price: 0, rarity: 'comun' as Rarity, base: true }] : []),
    ...(cat === 'titles' && !TITLE_ITEMS.some((x) => x.name === titleNow) ? [{ kind: cat, id: 'base', name: titleNow, price: 0, rarity: 'comun' as Rarity, base: true }] : []),
    ...owned,
  ].filter((x) => rar === 'all' || x.rarity === rar);
  const extras = owned.filter((x) => x.price > 0).length;

  const tap = (it: Item & { base?: boolean }): void => {
    if (cat === 'reacts' || it.id === 'base') return;
    cosmetics.equip(cat, it.id); feedback('tap');
  };
  const isOn = (it: Item): boolean => (cat === 'reacts' ? false : equippedId(cat) === it.id);

  return (
    <div className="grid gap-2.5">
      {/* mini-escaparate */}
      <div className="relative h-[118px] overflow-hidden rounded-2xl border border-white/10 [@media(max-height:500px)]:h-[96px]" style={{ background: `radial-gradient(circle at 50% 30%, ${th.a}, ${th.b} 62%, ${th.c})` }} aria-label={t('lk.showcase')}>
        <div className="absolute inset-0 flex items-center gap-4 px-4">
          <div className="relative grid size-[58px] shrink-0 place-items-center"><AvatarDisc emblem={c.avatar} frame={c.frame} size="size-[52px]" letter={(prof?.name ?? 'T').slice(0, 1).toUpperCase()} /></div>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-[14px] text-white">{prof?.name ?? '—'}</b>
            <small className="block truncate font-[var(--font-display)] text-[11px] font-bold text-amber-200">{titleNow}</small>
            <div className="mt-2 flex flex-wrap gap-1">
              <button type="button" onClick={() => { setBurst((b) => b + 1); feedback('tap'); }} className="flex h-8 touch-manipulation items-center gap-1 whitespace-nowrap rounded-full border border-amber-300/40 bg-black/35 px-2 text-[10.5px] font-bold text-amber-100 active:scale-95"><Trophy size={13} strokeWidth={1.75} aria-hidden />{t('lk.test')}</button>
              <button type="button" onClick={() => { cosmetics.randomize(); setFlash((f) => f + 1); feedback('win'); }} className="flex h-8 touch-manipulation items-center gap-1 whitespace-nowrap rounded-full border border-white/15 bg-black/35 px-2 text-[10.5px] font-bold text-stone-100 active:scale-95"><Shuffle size={13} strokeWidth={1.75} aria-hidden />{t('lk.random')}</button>
            </div>
          </div>
          <div className="relative h-[84px] w-[74px] shrink-0">
            <motion.span key={`a${flash}`} initial={{ rotate: -40, opacity: 0 }} animate={{ rotate: -12, opacity: 1 }} className="absolute left-0 top-2 block w-[48px] overflow-hidden rounded-md shadow-[0_6px_14px_rgba(0,0,0,.55)]" style={{ aspectRatio: '2 / 3' }}><CardBackArt variant={BACKS.find((b) => b.id === c.back)!.variant} seal="" /></motion.span>
            <motion.span key={`b${flash}`} initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 6, opacity: 1 }} className="absolute right-0 top-0 block w-[48px] overflow-hidden rounded-md shadow-[0_6px_14px_rgba(0,0,0,.55)]" style={{ aspectRatio: '2 / 3' }}><CardBackArt variant={BACKS.find((b) => b.id === c.back)!.variant} seal="" /></motion.span>
          </div>
        </div>
        {burst > 0 && <VictoryFx id={c.victory} burst={burst} compact />}
      </div>

      {/* huecos activos (loadout) */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t('lk.loadout')}>
        {SLOTS.map((k) => (
          <button key={k} ref={(el) => { slotRefs.current[k] = el; }} type="button" role="tab" aria-selected={cat === k} onClick={() => { setCat(k); feedback('tap'); }}
            className={`relative grid h-[78px] w-[84px] shrink-0 touch-manipulation content-between justify-items-center rounded-2xl border px-1 pb-1.5 pt-2 active:scale-95 ${cat === k ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/[0.05]'}`}>
            <span className="grid h-8 place-items-center"><MiniArt kind={k} equippedId={equippedId(k)} emblem={c.avatar} /></span>
            <span className="w-full truncate text-center text-[10.5px] font-bold leading-tight text-stone-100">{t(`vip.tab.${k}`)}</span>
            <span className="rounded-full bg-black/40 px-1.5 text-[9.5px] font-extrabold tabular-nums text-amber-200">{have(k)}/{total(k)}</span>
          </button>
        ))}
      </div>
      <p className="-mt-1 truncate text-[11px] text-stone-400">{t(`vip.tab.${cat}`)} · <span className="text-stone-200">{slotName(cat)}</span></p>

      {/* filtro por rareza */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="group" aria-label={t('lk.filter')}>
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={rar === f} onClick={() => { setRar(f); feedback('tap'); }}
            className={`shrink-0 touch-manipulation whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] font-bold active:scale-95 ${rar === f ? 'border-transparent bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] text-[#2a1d02]' : 'border-white/10 bg-white/[0.06] text-stone-200'}`}>
            {t(FILTER_LABEL[f])}
          </button>
        ))}
      </div>

      {/* cuadrícula: solo lo que ya es tuyo */}
      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((it) => {
            const on = it.base && it.id === 'base' ? true : isOn(it);
            return (
              <button key={it.id} type="button" onClick={() => tap(it)} aria-pressed={on} aria-label={nameOf(t, cat, it.id, it.name)} disabled={cat === 'reacts'}
                className={`relative flex min-h-[136px] touch-manipulation flex-col items-center justify-between overflow-hidden rounded-2xl border pt-3 text-center active:scale-[.97] disabled:active:scale-100 ${on ? 'border-amber-300 bg-amber-300/10 shadow-[0_0_0_1px_rgba(212,175,55,.5)]' : 'border-white/10 bg-white/5'}`}>
                {on && <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-amber-300 px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wide text-amber-950"><Check size={10} strokeWidth={3} aria-hidden />{t('vip.equipped')}</span>}
                {cat === 'reacts' && <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-900/70 px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wide text-emerald-200">{t('vip.inMenu')}</span>}
                <span className="mt-2 grid place-items-center">
                  {it.id === 'default' ? <AvatarDisc emblem={null} size="size-14" letter={(prof?.name ?? 'T').slice(0, 1).toUpperCase()} />
                    : it.id === 'base' ? <span className="flex min-h-14 items-center gap-1.5 rounded-xl border border-amber-300/30 bg-black/30 px-2.5 text-[11px] font-bold text-amber-200"><Crown size={13} strokeWidth={1.75} aria-hidden />{it.name}</span>
                    : <Art kind={cat} id={it.id} c={c} />}
                </span>
                <span className="w-full px-1.5 pb-1.5 pt-1 text-[12px] font-bold leading-tight text-stone-100">{cat === 'titles' || cat === 'reacts' ? '' : nameOf(t, cat, it.id, it.name)}</span>
                <span aria-hidden className="h-1.5 w-full" style={{ background: RARITY_BAR[it.rarity] }} />
              </button>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {(extras === 0 || list.length === 0) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid justify-items-center gap-1.5 rounded-2xl border border-dashed border-white/15 p-3 text-center">
            {list.length === 0 && <p className="text-[12px] text-stone-400">{t('lk.none')}</p>}
            <button type="button" onClick={() => onShop(cat)} className="flex h-10 touch-manipulation items-center gap-1.5 rounded-full bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] px-4 text-[12.5px] font-extrabold text-[#2a1d02] active:scale-95"><Store size={15} strokeWidth={1.75} aria-hidden />{t('lk.getMore')}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
