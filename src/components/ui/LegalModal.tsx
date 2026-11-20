import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Portal } from './Portal.tsx';
import { useBackClose } from '../../services/backStack.ts';

const SECTIONS: { h: string; p: string }[] = [
  { h: 'Quiénes somos', p: 'STACKS (ClubStacks) es un club de juegos de cartas y de mesa para jugar solo, contra la IA o en línea con amigos. Es un proyecto independiente.' },
  { h: 'Fichas 100 % virtuales', p: 'Las fichas de STACKS son virtuales, gratuitas y no tienen ningún valor real: no se pueden comprar, vender, canjear, transferir ni retirar, y no existen premios en dinero ni en especie. En STACKS no hay apuestas con dinero real; los juegos de casino (póker, blackjack, ruleta, bingo) son solo entretenimiento. La app no está dirigida a menores en contextos de juego con dinero porque no lo hay.' },
  { h: 'Cuenta y datos que guardamos', p: 'Puedes jugar como invitado o crear una cuenta (correo o Google). Guardamos tu alias y etiqueta (#1234), avatar, fichas virtuales, victorias, ajustes, cosméticos equipados y lista de amigos. En el dispositivo se almacenan en el navegador (almacenamiento local) y, si inicias sesión, también en nuestra base de datos (Supabase) para recuperarlos en otro dispositivo. No pedimos teléfono, ubicación, contactos ni documentos.' },
  { h: 'Partidas en línea', p: 'En las salas online se comparten con los demás jugadores tu alias, avatar, estado (lobby, jugando, en sala) y las jugadas de la partida, a través de un servicio en tiempo real. No hay chat de texto libre; solo reacciones rápidas predefinidas.' },
  { h: 'Publicidad y analítica', p: 'Si en el futuro se muestran anuncios (por ejemplo con Google AdMob) o se usa analítica, se informará aquí y se pedirá el consentimiento que exija la ley. Esos servicios pueden usar identificadores del dispositivo según sus propias políticas.' },
  { h: 'Tus derechos y cómo borrar tus datos', p: 'Puedes borrar todos los datos locales en Ajustes → «Restablecer datos locales». Para eliminar tu cuenta y los datos guardados en la nube, cierra sesión y escribe al contacto indicado abajo; los eliminaremos en un plazo razonable.' },
  { h: 'Normas de uso', p: 'Están prohibidos el acoso, los alias ofensivos, las trampas y el uso de herramientas automáticas. Podemos suspender cuentas que incumplan estas normas. STACKS se ofrece «tal cual», sin garantía de disponibilidad continua.' },
  { h: 'Contacto', p: 'Para dudas sobre privacidad o para solicitar el borrado de tus datos, contacta con el creador a través de https://ko-fi.com/cipri_11.' },
];

/** Privacidad y Términos (explicación para tiendas de aplicaciones): cuenta, datos de partida y fichas virtuales sin apuestas reales. */
export function LegalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBackClose(open, onClose);
  return (
    <Portal><AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label="Privacidad y Términos" onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/[0.08] bg-[#091511] p-4 shadow-2xl sm:rounded-2xl" style={{ maxHeight: '90dvh', paddingBottom: 'calc(16px + var(--safe-b))' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="flex-1 text-[19px] font-bold tracking-tight text-white">Privacidad y Términos</h2>
              <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-9 touch-manipulation place-items-center rounded-xl bg-white/10"><X size={16} strokeWidth={1.75} /></button>
            </div>
            <div className="grid gap-3.5 text-[13px] leading-relaxed text-white/70">
              {SECTIONS.map((s) => (
                <section key={s.h}><h3 className="mb-0.5 text-[12px] font-bold uppercase tracking-[.1em] text-[#FCE38A]">{s.h}</h3><p>{s.p}</p></section>
              ))}
              <p className="text-[11px] text-white/40">Última actualización: noviembre de 2026.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence></Portal>
  );
}
