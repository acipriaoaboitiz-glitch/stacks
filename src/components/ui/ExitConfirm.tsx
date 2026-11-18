import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '../../i18n/index.ts';
import { useBackClose } from '../../services/backStack.ts';

/**
 * Se monta dentro de cada mesa: el botón/gesto «Atrás» de Android no saca de golpe de una partida en curso;
 * abre este aviso y solo sale si el jugador lo confirma. (Un segundo «Atrás» lo cierra y sigues jugando.)
 */
export function ExitConfirm({ onExit }: { onExit: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  useBackClose(true, () => setOpen(true));
  useBackClose(open, () => setOpen(false));
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.div role="alertdialog" aria-modal="true" aria-label={t('exit.title')}
            className="w-full max-w-xs rounded-3xl border border-amber-500/30 bg-[#05140E] p-5 text-center shadow-[0_24px_70px_rgba(0,0,0,.65)]"
            initial={{ scale: 0.94, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-[var(--font-display)] text-xl font-bold text-amber-300">{t('exit.title')}</h2>
            <p className="mt-1 text-[13px] text-stone-300">{t('exit.body')}</p>
            <div className="mt-4 grid gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn btn--gold touch-manipulation">{t('exit.stay')}</button>
              <button type="button" onClick={() => { setOpen(false); onExit(); }} className="btn touch-manipulation">{t('exit.leave')}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
