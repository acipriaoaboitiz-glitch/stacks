import { useState } from 'react';
import { Portal } from './Portal.tsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Gem, X } from 'lucide-react';
import { useT } from '../../i18n/index.ts';
import { CardBackArt } from '../cards/FrenchFace.tsx';
import { AvatarFrame } from './AvatarFrame.tsx';
import { DICE } from '../../games/mentiroso/Dice.tsx';
import { BACKS, FRAMES, SETS, TAPETES, chipLook, cosmetics, useCosmetics, type SetId } from '../../store/cosmetics.ts';
import { THEMES, feedback, useSettings } from '../../store/settings.ts';
import { useWallet } from '../../store/wallet.ts';
import { useBackClose } from '../../services/backStack.ts';

type Tab = 'backs' | 'mats' | 'frames' | 'sets';
const TABS: Tab[] = ['backs', 'mats', 'frames', 'sets'];

/** Botón de compra / equipar común a las cuatro categorías. */
function Action({ owned, on, price, chips, onEquip, onBuy, t }: { owned: boolean; on: boolean; price: number; chips: number; onEquip: () => void; onBuy: () => void; t: (k: string) => string }) {
  return owned ? (
    <button type="button" disabled={on} onClick={() => { onEquip(); feedback('tap'); }}
      className="flex min-h-9 w-full touch-manipulation items-center justify-center gap-1 rounded-full bg-white/10 text-[12px] font-bold active:scale-95 disabled:bg-emerald-900/50 disabled:text-emerald-200">
      {on ? <><Check size={13} strokeWidth={1.75} aria-hidden /> {t('vip.equipped')}</> : t('vip.equip')}
    </button>
  ) : (
    <button type="button" disabled={chips < price} onClick={() => { onBuy(); }}
      className="min-h-9 w-full touch-manipulation rounded-full bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] text-[12px] font-extrabold tabular-nums text-[#2a1d02] active:scale-95 disabled:opacity-40">
      {price.toLocaleString('es-ES')} {t('vip.chipsUnit')}
    </button>
  );
}

const card = (on: boolean) => `grid content-between justify-items-center gap-1.5 rounded-2xl border p-2.5 ${on ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/5'}`;

/** Vista previa de un juego de fichas y dados: una ficha y un dado con la paleta del juego. */
function SetPreview({ id }: { id: SetId }) {
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
  // Colores directos (sin degradados con id) para que cada vista previa conserve su propia paleta
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

/** «Club VIP»: cuatro pestañas (dorsos, tapetes, avatares y marcos, fichas y dados) que se compran con fichas virtuales y se aplican en todos los juegos. */
export function VipShopModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBackClose(open, onClose);
  const t = useT();
  const c = useCosmetics();
  const w = useWallet();
  const { theme } = useSettings();
  const [tab, setTab] = useState<Tab>('backs');
  return (
    <Portal><AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={t('vip.title')}
            className="w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/[0.08] bg-[#091511] p-4 shadow-2xl sm:max-w-xl sm:rounded-2xl" style={{ maxHeight: '92dvh', paddingBottom: 'calc(16px + var(--safe-b))' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <Gem size={20} strokeWidth={1.75} className="text-amber-300" aria-hidden />
              <h2 className="flex-1 text-[19px] font-bold tracking-tight text-white">{t('vip.title')}</h2>
              <span className="font-mono text-sm font-bold tabular-nums text-amber-200">{w.chips.toLocaleString('es-ES')}</span>
              <button type="button" onClick={onClose} aria-label={t('a.close')} className="grid size-9 touch-manipulation place-items-center rounded-xl bg-white/10"><X size={16} strokeWidth={1.75} /></button>
            </div>

            {/* pestañas: en móvil se desplazan en horizontal */}
            <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label={t('vip.title')}>
              {TABS.map((k) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); feedback('tap'); }}
                  className={`shrink-0 touch-manipulation whitespace-nowrap rounded-full border px-3.5 py-2 text-[12.5px] font-bold active:scale-95 ${tab === k ? 'border-transparent bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] text-[#2a1d02]' : 'border-white/10 bg-white/[0.06] text-stone-200'}`}>
                  {t(`vip.tab.${k}`)}
                </button>
              ))}
            </div>

            {tab === 'backs' && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BACKS.map((b) => (
                  <div key={b.id} className={card(c.back === b.id)}>
                    <span className="block w-14 overflow-hidden rounded-lg shadow-[0_6px_14px_rgba(0,0,0,.5)]" style={{ aspectRatio: '2 / 3' }}><CardBackArt variant={b.variant} seal="" /></span>
                    <b className="text-center text-[12px] leading-tight">{t(`cb.${b.id}`)}</b>
                    <Action owned={c.backs.includes(b.id)} on={c.back === b.id} price={b.price} chips={w.chips} t={t} onEquip={() => cosmetics.equipBack(b.id)} onBuy={() => { if (cosmetics.buyBack(b.id)) feedback('win'); }} />
                  </div>
                ))}
              </div>
            )}

            {tab === 'mats' && (
              <div className="grid grid-cols-3 gap-2">
                {TAPETES.map((tp) => (
                  <div key={tp.id} className={card(theme === tp.id)}>
                    <span className={`block size-12 rounded-full border-2 border-white/15 bg-gradient-to-br ${THEMES[tp.id].swatch}`} />
                    <b className="text-center text-[11px] leading-tight">{t(`tp.${tp.id}`)}</b>
                    <Action owned={c.themes.includes(tp.id)} on={theme === tp.id} price={tp.price} chips={w.chips} t={t} onEquip={() => cosmetics.equipTheme(tp.id)} onBuy={() => { if (cosmetics.buyTheme(tp.id)) feedback('win'); }} />
                  </div>
                ))}
              </div>
            )}

            {tab === 'frames' && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FRAMES.map((f) => (
                  <div key={f.id} className={card(c.frame === f.id)}>
                    <span className="relative mt-3 grid size-14 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-[#1f6a5e] to-[#154a42] font-[var(--font-display)] text-lg font-bold text-teal-50">
                      T<AvatarFrame id={f.id} />
                    </span>
                    <b className="mt-3 text-center text-[12px] leading-tight">{t(`fr.${f.id}`)}</b>
                    <Action owned={c.frames.includes(f.id)} on={c.frame === f.id} price={f.price} chips={w.chips} t={t} onEquip={() => cosmetics.equipFrame(f.id)} onBuy={() => { if (cosmetics.buyFrame(f.id)) feedback('win'); }} />
                  </div>
                ))}
              </div>
            )}

            {tab === 'sets' && (
              <div className="grid grid-cols-2 gap-2">
                {SETS.map((x) => (
                  <div key={x.id} className={card(c.set === x.id)}>
                    <SetPreview id={x.id} />
                    <b className="text-center text-[12px] leading-tight">{t(`cs.${x.id}`)}</b>
                    <Action owned={c.sets.includes(x.id)} on={c.set === x.id} price={x.price} chips={w.chips} t={t} onEquip={() => cosmetics.equipSet(x.id)} onBuy={() => { if (cosmetics.buySet(x.id)) feedback('win'); }} />
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-center text-[10px] text-stone-500">{t('vip.note')}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence></Portal>
  );
}
