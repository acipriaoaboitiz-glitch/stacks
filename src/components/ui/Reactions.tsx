import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Ban, Crosshair, Clover, EyeOff, Flame, Handshake, Rocket, Smile, Swords, ThumbsUp, X, type LucideIcon } from 'lucide-react';
import { REACTION_ITEMS, useCosmetics, type ReactionId } from '../../store/cosmetics.ts';
import { emoteSound, FAST_EASE, type EmoteId } from '../../store/settings.ts';

export const EMOTES: { id: EmoteId; icon: LucideIcon; label: string; text: string }[] = [
  { id: 'clap', icon: ThumbsUp, label: '¡Buena jugada!', text: '¡Buena jugada!' },
  { id: 'hit', icon: Crosshair, label: '¡Órdago!', text: '¡Órdago!' },
  { id: 'laugh', icon: Clover, label: '¡Qué suerte!', text: '¡Qué suerte!' },
  { id: 'turn', icon: Handshake, label: 'GG', text: 'GG' },
];

/** Reacciones de la tienda VIP: aparecen en tu menú cuando las compras (icono vectorial + frase). */
export const SHOP_EMOTES: Record<ReactionId, { icon: LucideIcon; sound: EmoteId }> = {
  saca: { icon: Rocket, sound: 'hit' }, niconesas: { icon: Ban, sound: 'laugh' }, repaso: { icon: Swords, sound: 'hit' },
  locura: { icon: Flame, sound: 'fire' }, allin: { icon: EyeOff, sound: 'hit' }, jugada: { icon: Award, sound: 'clap' },
};

/** Botón flotante con 4 reacciones rápidas más las que hayas comprado. `onSend` recibe el texto que se muestra en el bocadillo del avatar. */
export function ReactionButton({ onSend }: { onSend: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const mine = useCosmetics().reactions;
  return (
    <div className="relative z-30 flex flex-col items-end gap-1.5">
      <AnimatePresence>
        {open && (
          <motion.div className="absolute right-0 top-full mt-1.5 flex max-w-[min(88vw,300px)] flex-wrap justify-end gap-1 rounded-3xl border border-white/10 bg-zinc-900/95 p-1 shadow-lg" role="group" aria-label="Reacciones rápidas"
            initial={{ opacity: 0, y: -8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }} transition={FAST_EASE}>
            {EMOTES.map((e) => (
              <button key={e.id} type="button" aria-label={e.label} title={e.label}
                onClick={() => { emoteSound(e.id); onSend(e.text); setOpen(false); }}
                className="grid size-9 place-items-center rounded-full text-[18px] transition active:scale-90"><e.icon size={18} strokeWidth={1.75} aria-hidden /></button>
            ))}
            {REACTION_ITEMS.filter((r) => mine.includes(r.id)).map((r) => {
              const sh = SHOP_EMOTES[r.id];
              return (
                <button key={r.id} type="button" aria-label={r.name} title={r.name}
                  onClick={() => { emoteSound(sh.sound); onSend(r.name); setOpen(false); }}
                  className="flex h-9 items-center gap-1 rounded-full bg-amber-300/10 px-2.5 text-[11px] font-bold text-amber-100 transition active:scale-90"><sh.icon size={15} strokeWidth={1.75} aria-hidden />{r.name}</button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" aria-label={open ? 'Cerrar reacciones' : 'Reacciones rápidas'} aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="grid size-9 shrink-0 place-items-center rounded-full border border-amber-300/40 bg-gradient-to-b from-zinc-800/90 to-zinc-950/90 text-amber-200 shadow-[0_4px_10px_rgba(0,0,0,.35)] transition active:scale-90">
        {open ? <X size={17} strokeWidth={1.75} /> : <Smile size={17} strokeWidth={1.75} />}
      </button>
    </div>
  );
}

/** Bocadillo sobre el avatar del jugador. */
export function EmoteBubble({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.span key={text + 'b'} className="pointer-events-none absolute left-1 top-0 z-30 -translate-y-full whitespace-nowrap rounded-xl bg-amber-300 px-2.5 py-1 text-[13px] font-extrabold text-amber-950 shadow-[0_4px_14px_rgba(0,0,0,.45)]"
          initial={{ opacity: 0, scale: 0.6, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -4, transition: { duration: 0.2 } }} transition={FAST_EASE}>
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
