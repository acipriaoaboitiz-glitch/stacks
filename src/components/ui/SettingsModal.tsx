import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Check, Gauge, HelpCircle, Languages, Palette, Smartphone, Volume2, X } from 'lucide-react';
import { useT } from '../../i18n/index.ts';
import { feedback, setSettings, THEMES, useSettings, type AnimSpeed, type Lang, type ThemeId } from '../../store/settings.ts';

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <motion.button type="button" role="switch" aria-checked={on} aria-label={label} whileTap={{ scale: 0.92 }}
      onClick={() => { onChange(!on); feedback('tap'); }}
      className="relative h-8 w-14 shrink-0 rounded-full border border-white/15"
      style={{ background: on ? 'linear-gradient(135deg,#fcd34d,#f59e0b)' : 'rgba(255,255,255,.12)' }}>
      <motion.span className="absolute top-[3px] h-6 w-6 rounded-full shadow" style={{ background: on ? '#451a03' : '#9fb3a8' }}
        animate={{ left: on ? 28 : 3 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </motion.button>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2.5">
      <h3 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-amber-300/90">{icon}{title}</h3>
      {children}
    </section>
  );
}

const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: 'es', label: 'ES', name: 'Español' }, { id: 'eu', label: 'EU', name: 'Euskara' }, { id: 'en', label: 'EN', name: 'English' },
];
const SPEEDS: AnimSpeed[] = ['normal', 'rapida'];

/** Ajustes globales (engranaje): tapete, idioma y experiencia de juego, con efecto en tiempo real. */
export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettings();
  const t = useT();
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={t('set.title')}
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-amber-500/30 bg-slate-900/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,.65)]"
            initial={{ y: 24, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center">
              <h2 className="flex-1 font-[var(--font-display)] text-xl font-bold text-amber-300">{t('set.title')}</h2>
              <motion.button type="button" onClick={onClose} aria-label={t('set.close')} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
                className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/10"><X size={18} /></motion.button>
            </div>

            <div className="grid gap-5">
              <Section icon={<Palette size={14} />} title={t('set.table')}>
                <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={t('set.table')}>
                  {(Object.keys(THEMES) as ThemeId[]).map((id) => (
                    <motion.button key={id} type="button" role="radio" aria-checked={s.theme === id} aria-label={t(`th.${id}`)} title={t(`th.${id}`)}
                      whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }} onClick={() => { setSettings({ theme: id }); feedback('tap'); }}
                      className="grid justify-items-center gap-1">
                      <span className={`relative grid size-12 place-items-center rounded-full bg-gradient-to-br ${THEMES[id].swatch} border-2 shadow-[inset_0_2px_6px_rgba(255,255,255,.12),0_4px_10px_rgba(0,0,0,.4)] ${s.theme === id ? 'border-amber-300' : 'border-white/15'}`}>
                        {s.theme === id && <Check size={18} className="text-amber-300" />}
                      </span>
                    </motion.button>
                  ))}
                </div>
                <p className="text-[12px] font-semibold text-stone-300">{t(`th.${s.theme}`)}</p>
              </Section>

              <Section icon={<Languages size={14} />} title={t('set.lang')}>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('set.lang')}>
                  {LANGS.map((l) => (
                    <motion.button key={l.id} type="button" role="radio" aria-checked={s.lang === l.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setSettings({ lang: l.id }); feedback('tap'); }}
                      className={`h-11 rounded-xl border text-[13px] font-bold ${s.lang === l.id ? 'border-amber-200 bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950' : 'border-white/10 bg-white/5 text-stone-200'}`}>
                      <span className="font-mono">{l.label}</span> <span className="text-[11px] opacity-80">{l.name}</span>
                    </motion.button>
                  ))}
                </div>
              </Section>

              <Section icon={<Gauge size={14} />} title={t('set.game')}>
                <div className="flex items-center gap-3"><Volume2 size={18} className="text-amber-300" /><span className="flex-1 text-sm font-bold">{t('set.sound')}</span>
                  <Toggle on={s.sound} onChange={(v) => setSettings({ sound: v })} label={t('set.sound')} /></div>
                <div className="flex items-center gap-3"><Smartphone size={18} className="text-amber-300" /><span className="flex-1 text-sm font-bold">{t('set.vibration')}</span>
                  <Toggle on={s.vibration} onChange={(v) => setSettings({ vibration: v })} label={t('set.vibration')} /></div>
                <div className="flex items-center gap-3"><HelpCircle size={18} className="text-amber-300" />
                  <span className="flex-1"><b className="block text-sm">{t('set.help')}</b><small className="text-[11px] text-stone-400">{t('set.helpSub')}</small></span>
                  <Toggle on={s.help} onChange={(v) => setSettings({ help: v })} label={t('set.help')} /></div>
                <div>
                  <p className="mb-1.5 text-sm font-bold">{t('set.speed')}</p>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('set.speed')}>
                    {SPEEDS.map((sp) => (
                      <motion.button key={sp} type="button" role="radio" aria-checked={s.speed === sp} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setSettings({ speed: sp }); feedback('tap'); }}
                        className={`h-11 rounded-xl border text-[13px] font-bold ${s.speed === sp ? 'border-amber-200 bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950' : 'border-white/10 bg-white/5 text-stone-200'}`}>
                        {sp === 'normal' ? t('set.normal') : t('set.fast')}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </Section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
