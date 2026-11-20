import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crown, MessageCircle, Save, Shuffle, Store, Trophy } from 'lucide-react';
import { useT } from '../../i18n/index.ts';
import { CardBackArt } from '../cards/FrenchFace.tsx';
import { AvatarEmblem } from './AvatarEmblem.tsx';
import { VictoryFx } from './VictoryFx.tsx';
import { EMOTES, SHOP_EMOTES } from './Reactions.tsx';
import { Art, AvatarDisc, RARITY_BAR, WIN_ICON, nameOf } from './shopParts.tsx';
import { BACKS, CATALOG, PRESET_COUNT, REACTION_ITEMS, TITLE_ITEMS, cosmetics, owns, useCosmetics, RARITY_ORDER, type Item, type Kind, type Rarity } from '../../store/cosmetics.ts';
import { useProfile } from '../../store/profile.ts';
import { THEMES, feedback, useSettings } from '../../store/settings.ts';

/** Categorías de la Taquilla, en el orden de la tira de huecos. */
const SLOTS: Kind[] = ['backs', 'mats', 'frames', 'avatars', 'wins', 'titles', 'reacts', 'sets'];
const FILTERS: ('all' | Rarity)[] = ['all', 'legendario', 'epico', 'raro', 'comun'];
const FILTER_LABEL: Record<'all' | Rarity, string> = { all: 'lk.all', legendario: 'rar.legendario', epico: 'rar.epico', raro: 'rar.raro', comun: 'rar.comun' };
/** Fondo radial de cada tarjeta según rareza. */
const RARITY_GLOW: Record<Rarity, string> = {
  legendario: 'radial-gradient(circle at 50% 30%, rgba(212,175,55,.38), rgba(212,175,55,.06) 62%, transparent)',
  epico: 'radial-gradient(circle at 50% 30%, rgba(139,92,246,.34), rgba(139,92,246,.06) 62%, transparent)',
  raro: 'radial-gradient(circle at 50% 30%, rgba(59,130,246,.32), rgba(59,130,246,.06) 62%, transparent)',
  comun: 'radial-gradient(circle at 50% 30%, rgba(16,120,90,.30), rgba(6,60,44,.06) 62%, transparent)',
};
/** Cada vista usa un layout común: escenario fijo arriba (móvil) o a la izquierda (PC y horizontal bajo). */
const SPLIT = 'lg:flex-row lg:gap-4 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-3';

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
 * Taquilla VIP: escenario fijo con tu combinación (arriba en móvil, a la izquierda en PC) e inventario con solo lo que ya tienes.
 * Un toque en una tarjeta lo equipa al instante y el escenario se actualiza en vivo. Tres conjuntos guardables.
 */
export function LockerView({ onShop }: { onShop: (kind: Kind) => void }) {
  const t = useT();
  const c = useCosmetics();
  const prof = useProfile();
  const { theme } = useSettings();
  const [cat, setCat] = useState<Kind>('backs');
  const [rar, setRar] = useState<'all' | Rarity>('all');
  const [burst, setBurst] = useState(0);
  const [bubble, setBubble] = useState<{ n: number; text: string } | null>(null);
  const [flash, setFlash] = useState(0);
  const [slot, setSlot] = useState(0);
  const [lastRar, setLastRar] = useState<Rarity>('epico');
  const slotRefs = useRef<Partial<Record<Kind, HTMLButtonElement | null>>>({});
  const bubbleTimer = useRef(0);
  useEffect(() => { slotRefs.current[cat]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [cat]);
  useEffect(() => { setRar('all'); }, [cat]);
  useEffect(() => () => window.clearTimeout(bubbleTimer.current), []);

  const th = THEMES[theme];
  const titleNow = prof?.title ?? 'Jugador VIP';
  const equippedId = (k: Kind): string => (k === 'backs' ? c.back : k === 'mats' ? theme : k === 'frames' ? c.frame : k === 'sets' ? c.set : k === 'wins' ? c.victory
    : k === 'avatars' ? c.avatar ?? 'default' : k === 'titles' ? TITLE_ITEMS.find((x) => x.name === titleNow)?.id ?? 'base' : '');
  const total = (k: Kind): number => CATALOG.filter((x) => x.kind === k).length;
  const have = (k: Kind): number => CATALOG.filter((x) => x.kind === k && owns(k, x.id, c)).length;
  const haveAll = useMemo(() => CATALOG.filter((x) => owns(x.kind, x.id, c)).length, [c]);
  const slotName = (k: Kind): string => {
    if (k === 'avatars') return c.avatar ? nameOf(t, k, c.avatar, CATALOG.find((x) => x.kind === k && x.id === c.avatar)?.name ?? '') : t('lk.initial');
    if (k === 'titles') return titleNow;
    if (k === 'reacts') return `${c.reactions.length} ${t('lk.inMenu')}`;
    const it = CATALOG.find((x) => x.kind === k && x.id === equippedId(k));
    return it ? nameOf(t, k, it.id, it.name) : '';
  };

  const owned: (Item & { base?: boolean })[] = CATALOG.filter((x) => x.kind === cat && owns(cat, x.id, c)).sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || b.price - a.price);
  const list: (Item & { base?: boolean })[] = [
    ...(cat === 'avatars' ? [{ kind: cat, id: 'default', name: t('lk.initial'), price: 0, rarity: 'comun' as Rarity, base: true }] : []),
    ...(cat === 'titles' && !TITLE_ITEMS.some((x) => x.name === titleNow) ? [{ kind: cat, id: 'base', name: titleNow, price: 0, rarity: 'comun' as Rarity, base: true }] : []),
    ...owned,
  ].filter((x) => rar === 'all' || x.rarity === rar);
  const extras = owned.filter((x) => x.price > 0).length;

  const tap = (it: Item & { base?: boolean }): void => {
    setLastRar(it.rarity);
    cosmetics.markSeen(cat, it.id);
    if (cat === 'reacts' || it.id === 'base') return;
    cosmetics.equip(cat, it.id); feedback('tap');
  };
  const isOn = (it: Item): boolean => (cat === 'reacts' ? false : equippedId(cat) === it.id);

  const testReaction = (): void => {
    const pool = [...EMOTES.map((e) => e.text), ...REACTION_ITEMS.filter((r) => c.reactions.includes(r.id)).map((r) => r.name)];
    setBubble({ n: Date.now(), text: pool[Math.floor(Math.random() * pool.length)]! });
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), 1700);
    feedback('tap');
  };
  const glow = RARITY_BAR[lastRar];
  const btn = 'flex h-9 min-w-0 flex-[1.3] touch-manipulation items-center justify-center gap-1 whitespace-nowrap rounded-full border border-white/15 bg-black/40 px-1.5 text-[10px] font-bold text-stone-100 active:scale-95';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* progreso de colección */}
      <div className="flex shrink-0 items-center gap-2" aria-label={t('lk.progress')}>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full origin-left rounded-full bg-gradient-to-r from-[#8a6410] via-[#D4AF37] to-[#FCE38A]" initial={false} animate={{ scaleX: haveAll / CATALOG.length }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} /></div>
        <span className="shrink-0 text-[11px] font-bold tabular-nums text-amber-200">{haveAll} / {CATALOG.length} {t('lk.items')}</span>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col gap-2.5 ${SPLIT}`}>
        {/* ── escenario fijo ── */}
        <section className={`flex shrink-0 flex-col gap-2 overflow-hidden rounded-2xl border border-white/10 p-2.5 h-[34dvh] min-h-[250px] lg:h-full lg:w-[42%] lg:min-h-0 [@media(max-height:500px)]:h-full [@media(max-height:500px)]:min-h-0 [@media(max-height:500px)]:w-[42%]`}
          style={{ background: 'linear-gradient(180deg,#0b1a15,#06100c)' }} aria-label={t('lk.showcase')}>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl" style={{ background: `radial-gradient(circle at 50% 38%, ${th.a}, ${th.b} 66%, ${th.c})` }}>
            {/* luz ambiental del color de la rareza del último objeto tocado */}
            <AnimatePresence>
              <motion.div key={lastRar} aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 0%, ${glow}66, transparent 68%), radial-gradient(ellipse at 50% 110%, ${glow}33, transparent 60%)` }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} />
            </AnimatePresence>
            <div className="absolute inset-0 flex items-center justify-between gap-2 px-3">
              {/* tarjeta de jugador */}
              <div className="grid min-w-0 flex-1 justify-items-center gap-1.5 rounded-2xl border border-white/10 bg-black/35 px-2 py-2.5">
                <div className="relative"><AvatarDisc emblem={c.avatar} frame={c.frame} size="size-[56px] lg:size-[84px]" letter={(prof?.name ?? 'T').slice(0, 1).toUpperCase()} /></div>
                <b className="mt-1.5 max-w-full truncate text-[13px] text-white">{prof?.name ?? '—'}</b>
                <small className="max-w-full truncate rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-[1px] font-[var(--font-display)] text-[10px] font-bold text-amber-200">{titleNow}</small>
              </div>
              {/* mesa en miniatura con tapete y carta 3D */}
              <div className="relative grid h-[104px] w-[46%] shrink-0 place-items-center rounded-[26px] border-[5px] border-[#3a2414] shadow-[0_8px_18px_rgba(0,0,0,.55),inset_0_0_0_1px_rgba(212,175,55,.35)] lg:h-[150px]" style={{ background: `radial-gradient(circle at 50% 40%, ${th.a}, ${th.b} 70%, ${th.c})` }}>
                <motion.div key={`card${flash}${c.back}`} className="w-[38px] lg:w-[56px]" style={{ transform: 'perspective(420px) rotateX(24deg) rotateY(-26deg) rotate(-8deg)', transformStyle: 'preserve-3d' }}
                  initial={{ y: -10, opacity: 0 }} animate={{ y: [0, -4, 0], opacity: 1 }} transition={{ y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.3 } }}>
                  <span className="block overflow-hidden rounded-md shadow-[8px_10px_14px_rgba(0,0,0,.55)]" style={{ aspectRatio: '2 / 3' }}><CardBackArt variant={BACKS.find((b) => b.id === c.back)!.variant} seal="" /></span>
                </motion.div>
              </div>
            </div>
            <AnimatePresence>
              {bubble && (
                <motion.span key={bubble.n} className="absolute left-3 top-2 z-10 max-w-[70%] truncate rounded-xl bg-amber-300 px-2.5 py-1 text-[12px] font-extrabold text-amber-950 shadow-[0_4px_14px_rgba(0,0,0,.45)]" initial={{ opacity: 0, scale: 0.6, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>{bubble.text}</motion.span>
              )}
            </AnimatePresence>
            {burst > 0 && <VictoryFx id={c.victory} burst={burst} compact />}
          </div>

          {/* acciones rápidas */}
          <div className="flex shrink-0 gap-1.5">
            <button type="button" className={btn} onClick={() => { setBurst((b) => b + 1); feedback('tap'); }}><Trophy size={13} strokeWidth={1.75} aria-hidden /><span className="truncate [@media(max-height:500px)]:sr-only">{t('lk.test')}</span></button>
            <button type="button" className={btn} onClick={testReaction}><MessageCircle size={13} strokeWidth={1.75} aria-hidden /><span className="truncate [@media(max-height:500px)]:sr-only">{t('lk.testReact')}</span></button>
            <button type="button" className={`${btn} !flex-1`} onClick={() => { cosmetics.randomize(); setFlash((f) => f + 1); feedback('win'); }}><Shuffle size={13} strokeWidth={1.75} aria-hidden /><span className="truncate [@media(max-height:500px)]:sr-only">{t('lk.random')}</span></button>
          </div>
          {/* conjuntos guardados */}
          <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={t('lk.sets')}>
            {Array.from({ length: PRESET_COUNT }, (_, i) => (
              <button key={i} type="button" aria-pressed={slot === i} onClick={() => { setSlot(i); if (c.presets[i]) { cosmetics.loadPreset(i); setFlash((f) => f + 1); feedback('tap'); } }}
                className={`relative flex h-9 min-w-0 flex-1 touch-manipulation items-center justify-center gap-1 rounded-full border px-1.5 text-[11px] font-bold active:scale-95 ${slot === i ? 'border-amber-300 bg-amber-300/15 text-amber-100' : 'border-white/10 bg-white/[0.05] text-stone-300'}`}>
                {t('lk.set')} {i + 1}{c.presets[i] && <span aria-hidden className="size-1.5 rounded-full bg-amber-300" />}
              </button>
            ))}
            <button type="button" onClick={() => { cosmetics.savePreset(slot); feedback('win'); }} className="flex h-9 shrink-0 touch-manipulation items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] px-2.5 text-[11px] font-extrabold text-[#2a1d02] active:scale-95"><Save size={13} strokeWidth={1.75} aria-hidden />{t('lk.save')}</button>
          </div>
        </section>

        {/* ── inventario ── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 bg-[#091511] pb-2">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t('lk.loadout')}>
              {SLOTS.map((k) => (
                <button key={k} ref={(el) => { slotRefs.current[k] = el; }} type="button" role="tab" aria-selected={cat === k} onClick={() => { setCat(k); feedback('tap'); }}
                  className={`relative grid h-[74px] w-[80px] shrink-0 touch-manipulation content-between justify-items-center rounded-2xl border px-1 pb-1.5 pt-1.5 active:scale-95 ${cat === k ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/[0.05]'}`}>
                  <span className="grid h-8 place-items-center"><MiniArt kind={k} equippedId={equippedId(k)} emblem={c.avatar} /></span>
                  <span className="w-full truncate text-center text-[10.5px] font-bold leading-tight text-stone-100">{t(`vip.tab.${k}`)}</span>
                  <span className="rounded-full bg-black/40 px-1.5 text-[9.5px] font-extrabold tabular-nums text-amber-200">{have(k)}/{total(k)}</span>
                </button>
              ))}
            </div>
            <div className="no-scrollbar -mx-1 mt-1 flex items-center gap-1.5 overflow-x-auto px-1" role="group" aria-label={t('lk.filter')}>
              {FILTERS.map((f) => (
                <button key={f} type="button" aria-pressed={rar === f} onClick={() => { setRar(f); feedback('tap'); }}
                  className={`shrink-0 touch-manipulation whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] font-bold active:scale-95 ${rar === f ? 'border-transparent bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] text-[#2a1d02]' : 'border-white/10 bg-white/[0.06] text-stone-200'}`}>
                  {t(FILTER_LABEL[f])}
                </button>
              ))}
            </div>
            <p className="mt-1.5 truncate text-[11px] text-stone-400">{t(`vip.tab.${cat}`)} · <span className="text-stone-200">{slotName(cat)}</span></p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
            {list.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {list.map((it) => {
                  const on = it.id === 'base' ? true : isOn(it);
                  const isNew = c.fresh.includes(`${cat}:${it.id}`);
                  return (
                    <button key={it.id} type="button" onClick={() => tap(it)} aria-pressed={on} aria-label={nameOf(t, cat, it.id, it.name)} disabled={cat === 'reacts'}
                      className={`relative flex min-h-[140px] touch-manipulation flex-col items-center justify-between overflow-hidden rounded-2xl border pt-3 text-center active:scale-[.97] disabled:active:scale-100 ${on ? 'border-transparent' : 'border-white/10'}`} style={{ background: `${RARITY_GLOW[it.rarity]}, #0d1a15` }}>
                      {it.rarity === 'legendario' && (
                        <motion.span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent" initial={{ x: '-150%' }} animate={{ x: '420%' }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }} />
                      )}
                      {on && <motion.span layoutId="locker-equipped-ring" aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-300 shadow-[0_0_14px_rgba(212,175,55,.55)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                      {on && it.id !== 'base' && <span className="absolute left-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-full bg-amber-300 px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wide text-amber-950"><Check size={10} strokeWidth={3} aria-hidden />{t('vip.equipped')}</span>}
                      {isNew && <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-rose-500 px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wide text-white">{t('lk.new')}</span>}
                      {cat === 'reacts' && <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-emerald-900/70 px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wide text-emerald-200">{t('vip.inMenu')}</span>}
                      <span className="relative mt-3 grid place-items-center">
                        {it.id === 'default' ? <AvatarDisc emblem={null} size="size-14" letter={(prof?.name ?? 'T').slice(0, 1).toUpperCase()} />
                          : it.id === 'base' ? <span className="flex min-h-14 items-center gap-1.5 rounded-xl border border-amber-300/30 bg-black/30 px-2.5 text-[11px] font-bold text-amber-200"><Crown size={13} strokeWidth={1.75} aria-hidden />{it.name}</span>
                          : <Art kind={cat} id={it.id} c={c} />}
                      </span>
                      <span className="relative w-full px-1.5 pb-2 pt-1 text-[12px] font-bold leading-tight text-stone-100">{cat === 'titles' || cat === 'reacts' ? '' : nameOf(t, cat, it.id, it.name)}</span>
                      <span aria-hidden className="relative h-1.5 w-full" style={{ background: RARITY_BAR[it.rarity], boxShadow: `0 -3px 10px ${RARITY_BAR[it.rarity]}99` }} />
                    </button>
                  );
                })}
              </div>
            )}
            {(extras === 0 || list.length === 0) && (
              <div className="mt-2.5 grid justify-items-center gap-1.5 rounded-2xl border border-dashed border-white/15 p-3 text-center">
                {list.length === 0 && <p className="text-[12px] text-stone-400">{t('lk.none')}</p>}
                <button type="button" onClick={() => onShop(cat)} className="flex h-10 touch-manipulation items-center gap-1.5 rounded-full bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] px-4 text-[12.5px] font-extrabold text-[#2a1d02] active:scale-95"><Store size={15} strokeWidth={1.75} aria-hidden />{t('lk.getMore')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
