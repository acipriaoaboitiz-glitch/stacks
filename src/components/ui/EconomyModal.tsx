import { AnimatePresence, motion } from 'framer-motion';
import { Check, Gift, LifeBuoy, X } from 'lucide-react';
import { feedback, FAST_EASE } from '../../store/settings.ts';
import { canClaimDaily, canRescue, DAILY_STREAK, nextStreak, RESCUE_BELOW, RESCUE_CHIPS, useWallet, wallet } from '../../store/wallet.ts';

/** Modal del «+» del saldo: bono diario progresivo (racha de 7 días) y rescate de 250 fichas si bajas de 50. */
export function EconomyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const w = useWallet();
  const can = canClaimDaily(w);
  const day = nextStreak(w); // día de la racha que se cobra hoy (o el ya cobrado)
  const rescue = canRescue(w);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 grid place-items-center bg-black/80 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FAST_EASE} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label="Fichas gratis"
            className="glass-panel w-full max-w-sm rounded-3xl p-4" initial={{ scale: 0.94, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={FAST_EASE}
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <Gift size={20} className="text-amber-300" aria-hidden />
              <h2 className="font-display flex-1 text-xl font-black gold-text">Fichas gratis</h2>
              <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: '#ffffff14' }}><X size={16} /></button>
            </div>

            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[.1em] text-amber-300/90">Bono diario · racha de {day} {day === 1 ? 'día' : 'días'}</p>
            <div className="grid grid-cols-7 gap-1.5" aria-label="Racha de bonos diarios">
              {DAILY_STREAK.map((amt, i) => {
                const done = can ? i + 1 < day : i + 1 <= day;
                const today = can && i + 1 === day;
                return (
                  <div key={i} className={`grid justify-items-center rounded-xl border px-0.5 py-1.5 text-center ${today ? 'border-amber-300 bg-amber-300/15' : done ? 'border-emerald-400/40 bg-emerald-900/30' : 'border-white/10 bg-white/5'}`}>
                    <span className="text-[9px] font-bold text-stone-400">Día {i + 1}</span>
                    {done ? <Check size={14} className="my-0.5 text-emerald-300" aria-label="Cobrado" /> : <b className="my-0.5 text-[11px] tabular-nums text-amber-200">{amt}</b>}
                  </div>
                );
              })}
            </div>
            <button type="button" className="btn btn--gold mt-3 w-full" disabled={!can}
              onClick={() => { const n = wallet.claimDaily(); if (n) feedback('win'); }}>
              {can ? `Cobrar bono +${DAILY_STREAK[day - 1]}` : 'Ya cobraste hoy · vuelve mañana'}
            </button>
            <p className="mt-1.5 text-center text-[11px] text-stone-400">Si cobras cada día, el bono sube hasta {DAILY_STREAK[6]} fichas. Si te saltas un día, vuelve a empezar.</p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-teal-300"><LifeBuoy size={14} aria-hidden /> Rescate</p>
              <p className="mb-2 text-[12px] text-stone-300">Si te quedas con menos de {RESCUE_BELOW} fichas, te regalamos {RESCUE_CHIPS} para seguir jugando.</p>
              <button type="button" className="btn w-full" disabled={!rescue} onClick={() => { if (wallet.claimRescue()) feedback('chip'); }}>
                {rescue ? `Rescate +${RESCUE_CHIPS}` : `Disponible con menos de ${RESCUE_BELOW} fichas`}
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-stone-500">Fichas virtuales gratuitas · nunca dinero real</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
