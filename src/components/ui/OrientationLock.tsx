import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { feedback } from '../../store/settings.ts';

type Lockable = ScreenOrientation & { lock?: (o: string) => Promise<void> };

/** Botón 100 % opcional: bloquea o libera la pantalla en horizontal (juegos de mesa ancha). Solo en pantallas táctiles pequeñas. */
export function OrientationLock() {
  const [locked, setLocked] = useState(false);
  const [note, setNote] = useState('');
  useEffect(() => () => { try { screen.orientation?.unlock?.(); } catch { /* sin soporte */ } }, []);
  const toggle = async (): Promise<void> => {
    feedback('tap');
    const o = screen.orientation as Lockable | undefined;
    try {
      if (locked) { o?.unlock?.(); setLocked(false); return; }
      if (!o?.lock) throw new Error('sin soporte');
      await o.lock('landscape');
      setLocked(true);
    } catch {
      setNote('Tu navegador no permite bloquear la orientación (Safari en iPhone): gira el móvil a mano.');
      window.setTimeout(() => setNote(''), 3200);
    }
  };
  return (
    <span className="relative lg:hidden">
      <button type="button" onClick={() => { void toggle(); }} aria-pressed={locked} aria-label={locked ? 'Liberar orientación' : 'Bloquear en horizontal'} title="Bloquear en horizontal"
        className={`grid size-9 shrink-0 touch-manipulation place-items-center rounded-full border shadow-[0_4px_10px_rgba(0,0,0,.35)] ${locked ? 'border-[#FCE38A] bg-[#FCE38A]/20 text-[#FCE38A]' : 'border-amber-200/20 bg-gradient-to-b from-zinc-800/90 to-zinc-950/90 text-stone-100'}`}>
        <RotateCw size={17} strokeWidth={1.75} aria-hidden />
      </button>
      {note && <span role="status" className="fixed inset-x-4 top-16 z-[60] rounded-xl border border-amber-300/40 bg-[#091511]/95 px-3 py-2 text-center text-[12.5px] font-semibold text-stone-100">{note}</span>}
    </span>
  );
}
