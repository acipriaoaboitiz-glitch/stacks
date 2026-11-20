import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Portal } from './Portal.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Backpack, Check, Gem, Gift, Store, Tag, X } from 'lucide-react';
import { useT } from '../../i18n/index.ts';
import { CardBackArt } from '../cards/FrenchFace.tsx';
import { VictoryFx } from './VictoryFx.tsx';
import { LockerView } from './Locker.tsx';
import {
  BACKS, CATALOG, CHEST_PRICE, CHEST_REFUND, REACTION_ITEMS, TITLE_ITEMS,
  cosmetics, dailyDeal, dealPrice, owns, useCosmetics, type AvatarId, type ChestResult, type FrameId, type Item, type Kind, type VictoryId,
} from '../../store/cosmetics.ts';
import { useProfile } from '../../store/profile.ts';
import { THEMES, feedback, useSettings } from '../../store/settings.ts';
import { useWallet } from '../../store/wallet.ts';
import { useBackClose } from '../../services/backStack.ts';
import { Art, AvatarDisc, RARITY_STYLE, RarityBadge, money, nameOf } from './shopParts.tsx';

export type VipView = 'locker' | 'shop';

type Tab = Kind;
/** Siete categorías de la tienda (+ fichas y dados, que ya tenías). */
const TABS: Tab[] = ['backs', 'mats', 'frames', 'avatars', 'wins', 'titles', 'reacts', 'sets'];

/** Compra / equipar común a todas las categorías. */
function Action({ owned, on, price, chips, onEquip, onBuy, t, passive }: { owned: boolean; on: boolean; price: number; chips: number; onEquip: () => void; onBuy: () => void; t: (k: string) => string; passive?: boolean }) {
  if (owned && passive) return <span className="flex min-h-9 w-full items-center justify-center gap-1 rounded-full bg-emerald-900/50 text-[12px] font-bold text-emerald-200"><Check size={13} strokeWidth={1.75} aria-hidden /> {t('vip.inMenu')}</span>;
  return owned ? (
    <button type="button" disabled={on} onClick={() => { onEquip(); feedback('tap'); }}
      className="flex min-h-9 w-full touch-manipulation items-center justify-center gap-1 rounded-full bg-white/10 text-[12px] font-bold active:scale-95 disabled:bg-emerald-900/50 disabled:text-emerald-200">
      {on ? <><Check size={13} strokeWidth={1.75} aria-hidden /> {t('vip.equipped')}</> : t('vip.equip')}
    </button>
  ) : (
    <button type="button" disabled={chips < price} onClick={onBuy}
      className="min-h-9 w-full touch-manipulation rounded-full bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] text-[12px] font-extrabold tabular-nums text-[#2a1d02] active:scale-95 disabled:opacity-40">
      {money(price)} {t('vip.chipsUnit')}
    </button>
  );
}

/** «Club VIP»: tienda de cosméticos con vista previa en vivo, oferta del día y Cofre Misterioso. Todo se compra con fichas virtuales y se aplica en las mesas. */
export function VipShopModal({ open, onClose, initialView = 'shop' }: { open: boolean; onClose: () => void; initialView?: VipView }) {
  useBackClose(open, onClose);
  const t = useT();
  const c = useCosmetics();
  const w = useWallet();
  const prof = useProfile();
  const { theme } = useSettings();
  const [view, setView] = useState<VipView>(initialView);
  const [tab, setTab] = useState<Tab>('backs');
  useEffect(() => { if (open) setView(initialView); }, [open, initialView]);
  const [pv, setPv] = useState<{ kind: Kind; id: string } | null>(null);
  const [burst, setBurst] = useState(0);
  const [chest, setChest] = useState<'idle' | 'opening' | ChestResult>('idle');
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const deal = open ? dailyDeal() : null;

  // La pestaña activa se centra sola en la tira horizontal.
  useEffect(() => { tabRefs.current[tab]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [tab]);
  useEffect(() => { if (!open) { setPv(null); setChest('idle'); } }, [open]);

  const nm = (kind: Kind, id: string, fallback: string): string => nameOf(t, kind, id, fallback);
  const priceOf = (it: Item): number => (deal && deal.kind === it.kind && deal.id === it.id ? dealPrice(it.price) : it.price);
  const select = (kind: Kind, id: string): void => { setPv({ kind, id }); if (kind === 'wins') setBurst((b) => b + 1); feedback('tap'); };
  const buy = (it: Item): void => { if (cosmetics.buy(it.kind, it.id, priceOf(it))) { feedback('win'); select(it.kind, it.id); } };
  const equipped = (kind: Kind, id: string): boolean => {
    switch (kind) {
      case 'backs': return c.back === id; case 'mats': return theme === id; case 'frames': return c.frame === id; case 'sets': return c.set === id;
      case 'avatars': return c.avatar === id; case 'wins': return c.victory === id;
      case 'titles': return prof?.title === TITLE_ITEMS.find((x) => x.id === id)?.name; default: return false;
    }
  };

  const openChest = (): void => {
    if (chest === 'opening' || w.chips < CHEST_PRICE) return;
    setChest('opening'); feedback('tap');
    window.setTimeout(() => {
      const r = cosmetics.openChest();
      setChest(r ?? 'idle'); if (r) { feedback('win'); if ('item' in r) select(r.item.kind, r.item.id); }
    }, 800);
  };

  // Lo que muestra la vista previa: lo equipado, salvo el artículo que estés mirando.
  const pvBack = pv?.kind === 'backs' ? BACKS.find((b) => b.id === pv.id)!.variant : BACKS.find((b) => b.id === c.back)!.variant;
  const pvTheme = THEMES[(pv?.kind === 'mats' ? pv.id : theme) as keyof typeof THEMES];
  const pvFrame = (pv?.kind === 'frames' ? pv.id : c.frame) as FrameId;
  const pvEmblem = pv?.kind === 'avatars' ? (pv.id as AvatarId) : c.avatar;
  const pvTitle = pv?.kind === 'titles' ? TITLE_ITEMS.find((x) => x.id === pv.id)!.name : prof?.title ?? 'Jugador VIP';
  const pvWin = (pv?.kind === 'wins' ? pv.id : null) as VictoryId | null;
  const pvReact = pv?.kind === 'reacts' ? REACTION_ITEMS.find((x) => x.id === pv.id)! : null;
  const pvItem = pv ? CATALOG.find((x) => x.kind === pv.kind && x.id === pv.id) : null;

  const card = (it: Item, art: ReactNode, passive?: boolean) => {
    const owned = owns(it.kind, it.id, c); const on = equipped(it.kind, it.id); const price = priceOf(it);
    const isDeal = deal?.kind === it.kind && deal.id === it.id && !owned;
    return (
      <div key={it.id} className={`relative grid content-between justify-items-center gap-1.5 rounded-2xl border p-2.5 ${on ? 'border-amber-300 bg-amber-300/10' : `${RARITY_STYLE[it.rarity].ring} bg-white/5`} ${pv?.kind === it.kind && pv.id === it.id ? 'ring-2 ring-[#FCE38A]/70' : ''}`}>
        {isDeal && <span className="absolute -right-1 -top-1 z-10 rounded-full bg-rose-500 px-2 py-[2px] text-[9px] font-extrabold tracking-wide text-white shadow">{t('vip.dealOff')}</span>}
        <button type="button" onClick={() => select(it.kind, it.id)} aria-label={`${t('vip.preview')}: ${nm(it.kind, it.id, it.name)}`} className="grid touch-manipulation justify-items-center active:scale-95">{art}</button>
        <b className="text-center text-[12px] leading-tight">{nm(it.kind, it.id, it.name)}</b>
        <RarityBadge r={it.rarity} t={t} />
        <Action owned={owned} on={on} price={price} chips={w.chips} t={t} passive={passive} onEquip={() => cosmetics.equip(it.kind, it.id)} onBuy={() => buy(it)} />
      </div>
    );
  };
  const items = (kind: Kind): Item[] => CATALOG.filter((x) => x.kind === kind);
  const cols = (k: Kind): string => (k === 'mats' ? 'grid-cols-3' : k === 'sets' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4');

  return (
    <Portal><AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={t('vip.title')}
            className={`w-full border border-white/[0.08] bg-[#091511] p-4 shadow-2xl ${view === 'locker' ? 'flex h-[100dvh] max-w-md flex-col overflow-hidden sm:h-[min(92dvh,900px)] sm:max-w-3xl sm:rounded-2xl lg:max-w-6xl max-sm:rounded-none [@media(max-height:500px)]:max-w-3xl' : 'max-w-md overflow-y-auto rounded-t-2xl sm:max-w-xl sm:rounded-2xl lg:max-w-3xl'}`} style={view === 'locker' ? { paddingBottom: 'calc(12px + var(--safe-b))' } : { maxHeight: '92dvh', paddingBottom: 'calc(16px + var(--safe-b))' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex shrink-0 items-center gap-2">
              {view === 'locker' ? <Backpack size={20} strokeWidth={1.75} className="text-amber-300" aria-hidden /> : <Gem size={20} strokeWidth={1.75} className="text-amber-300" aria-hidden />}
              <h2 className="flex-1 truncate text-[19px] font-bold tracking-tight text-white">{view === 'locker' ? t('vip.locker') : t('vip.title')}</h2>
              <span className="font-mono text-sm font-bold tabular-nums text-amber-200">{money(w.chips)}</span>
              <button type="button" onClick={onClose} aria-label={t('a.close')} className="grid size-9 touch-manipulation place-items-center rounded-xl bg-white/10"><X size={16} strokeWidth={1.75} /></button>
            </div>

            {/* conmutador: equipar lo que ya tienes | comprar más */}
            <div className="mb-2 grid shrink-0 grid-cols-2 gap-1 rounded-full border border-white/10 bg-black/30 p-1" role="tablist" aria-label={t('vip.title')}>
              {([['locker', Backpack, t('vip.locker')], ['shop', Store, t('vip.shop')]] as const).map(([k, Icon, label]) => (
                <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => { setView(k); feedback('tap'); }}
                  className={`flex h-10 touch-manipulation items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-bold active:scale-95 ${view === k ? 'bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] text-[#2a1d02]' : 'text-stone-200'}`}>
                  <Icon size={15} strokeWidth={1.75} aria-hidden /><span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {view === 'locker' ? <LockerView onShop={(k) => { setTab(k); setView('shop'); }} /> : (<>
            {/* vista previa en vivo */}
            <div className="relative mb-3 h-[150px] overflow-hidden rounded-2xl border border-white/10" style={{ background: `radial-gradient(circle at 50% 30%, ${pvTheme.a}, ${pvTheme.b} 62%, ${pvTheme.c})` }} aria-label={t('vip.preview')}>
              <span className="absolute left-3 top-2 z-10 text-[10px] font-extrabold uppercase tracking-[.14em] text-white/60">{t('vip.preview')}{!pv && ` · ${t('vip.previewHint')}`}</span>
              {pvItem && <span className="absolute right-3 top-2 z-10"><RarityBadge r={pvItem.rarity} t={t} /></span>}
              <div className="absolute inset-0 flex items-center justify-center gap-6 pt-3">
                <div className="relative h-[88px] w-[78px]">
                  <span className="absolute left-0 top-2 block w-[52px] -rotate-12 overflow-hidden rounded-md shadow-[0_6px_14px_rgba(0,0,0,.55)]" style={{ aspectRatio: '2 / 3' }}><CardBackArt variant={pvBack} seal="" /></span>
                  <span className="absolute right-0 top-0 block w-[52px] rotate-6 overflow-hidden rounded-md shadow-[0_6px_14px_rgba(0,0,0,.55)]" style={{ aspectRatio: '2 / 3' }}><CardBackArt variant={pvBack} seal="" /></span>
                </div>
                <div className="grid justify-items-center gap-1">
                  <div className="relative mt-1"><AvatarDisc emblem={pvEmblem} frame={pvFrame} size="size-[60px]" letter={(prof?.name ?? 'T').slice(0, 1).toUpperCase()} /></div>
                  <b className="mt-2 max-w-[120px] truncate text-[12px] text-white">{prof?.name ?? '—'}</b>
                  <small className="max-w-[140px] truncate font-[var(--font-display)] text-[10px] font-bold text-amber-200">{pvTitle}</small>
                </div>
              </div>
              <AnimatePresence>
                {pvReact && (
                  <motion.span key={pvReact.id + burst} className="absolute left-1/2 top-9 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl bg-amber-300 px-2.5 py-1 text-[13px] font-extrabold text-amber-950 shadow-[0_4px_14px_rgba(0,0,0,.45)]" initial={{ opacity: 0, scale: 0.6, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {pvReact.name}
                  </motion.span>
                )}
              </AnimatePresence>
              {pvWin && <VictoryFx id={pvWin} burst={burst} compact />}
            </div>

            {/* oferta del día */}
            {deal && (
              <div className="relative mb-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-rose-400/40 bg-gradient-to-r from-rose-500/15 via-amber-400/10 to-transparent p-2.5">
                <span className="absolute -left-px top-0 flex items-center gap-1 rounded-br-xl bg-rose-500 px-2 py-[2px] text-[10px] font-extrabold tracking-wide text-white"><Tag size={10} strokeWidth={2} aria-hidden />{t('vip.dealOff')}</span>
                <button type="button" onClick={() => { setTab(deal.kind); select(deal.kind, deal.id); }} className="mt-4 grid shrink-0 touch-manipulation place-items-center scale-[.78] active:scale-75"><Art kind={deal.kind} id={deal.id} c={c} /></button>
                <div className="mt-3 min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-rose-200/90">{t('vip.deal')}</p>
                  <b className="block truncate text-[14px] text-white">{nm(deal.kind, deal.id, deal.name)}</b>
                  <div className="mt-0.5 flex items-center gap-2"><RarityBadge r={deal.rarity} t={t} /><s className="text-[11px] tabular-nums text-stone-400">{money(deal.price)}</s></div>
                </div>
                <button type="button" disabled={w.chips < dealPrice(deal.price)} onClick={() => buy(deal)} className="mt-3 min-h-10 shrink-0 touch-manipulation rounded-full bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] px-3.5 text-[13px] font-extrabold tabular-nums text-[#2a1d02] active:scale-95 disabled:opacity-40">{money(dealPrice(deal.price))}</button>
              </div>
            )}

            {/* cofre misterioso */}
            <div className="relative mb-3 flex items-center gap-3 overflow-hidden rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-400/15 via-fuchsia-500/10 to-transparent p-2.5">
              <motion.span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-300/30 to-amber-700/40 text-amber-100"
                animate={chest === 'opening' ? { rotate: [0, -10, 10, -8, 8, 0], scale: [1, 1.12, 1.12, 1.2, 1.3, 1.35] } : { rotate: 0, scale: 1 }} transition={{ duration: 0.8, ease: 'easeInOut' }}>
                <Gift size={28} strokeWidth={1.75} aria-hidden />
              </motion.span>
              <div className="min-w-0 flex-1">
                <b className="block text-[14px] text-white">{t('vip.chest')}</b>
                <p className="text-[11px] leading-snug text-stone-300">{t('vip.chestInfo')}</p>
              </div>
              <button type="button" disabled={w.chips < CHEST_PRICE || chest === 'opening'} onClick={openChest} className="min-h-10 shrink-0 touch-manipulation rounded-full bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] px-3.5 text-[12px] font-extrabold tabular-nums text-[#2a1d02] active:scale-95 disabled:opacity-40">{money(CHEST_PRICE)}</button>
            </div>
            <AnimatePresence>
              {chest !== 'idle' && chest !== 'opening' && (
                <motion.div role="status" className="mb-3 flex items-center gap-3 rounded-2xl border border-amber-300/60 bg-amber-300/10 p-3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
                  {'item' in chest ? (
                    <>
                      <span className="shrink-0 scale-[.8]"><Art kind={chest.item.kind} id={chest.item.id} c={c} /></span>
                      <div className="min-w-0 flex-1"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-amber-300">{t('vip.chest')}</p><b className="block truncate text-[15px] text-white">{nm(chest.item.kind, chest.item.id, chest.item.name)}</b><RarityBadge r={chest.item.rarity} t={t} /></div>
                    </>
                  ) : (
                    <div className="flex-1"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-amber-300">{t('vip.chest')}</p><b className="text-[15px] text-white">{t('vip.chestRefund')} {money(CHEST_REFUND)} {t('vip.chipsUnit')}</b></div>
                  )}
                  <button type="button" onClick={() => setChest('idle')} aria-label={t('a.close')} className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10"><X size={14} strokeWidth={1.75} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* pestañas: en móvil se desplazan en horizontal */}
            <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto scroll-smooth px-1 pb-1" role="tablist" aria-label={t('vip.title')}>
              {TABS.map((k) => (
                <button key={k} ref={(el) => { tabRefs.current[k] = el; }} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); feedback('tap'); }}
                  className={`shrink-0 touch-manipulation whitespace-nowrap rounded-full border px-3.5 py-2 text-[12.5px] font-bold active:scale-95 ${tab === k ? 'border-transparent bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] text-[#2a1d02]' : 'border-white/10 bg-white/[0.06] text-stone-200'}`}>
                  {t(`vip.tab.${k}`)}
                </button>
              ))}
            </div>

            <div className={`grid gap-2 ${cols(tab)}`}>
              {items(tab).map((it) => card(it, <Art kind={it.kind} id={it.id} c={c} />, tab === 'reacts'))}
            </div>
            <p className="mt-3 text-center text-[10px] text-stone-500">{t('vip.note')}</p>
            </>)}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence></Portal>
  );
}

