import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export const TURN_SECONDS = 15;

export interface TurnTimerSpec {
  /** Hay un turno humano en curso. */
  active: boolean;
  /** Cambia con cada turno/acción para reiniciar la cuenta. */
  id: string | number;
  /** Se llama al llegar a 0 s: debe jugar una acción válida automática (pasar, tirar carta…). */
  onTimeout: () => void;
}

/** Cuenta atrás de 15 s con barra: esmeralda → ámbar → rojo parpadeante en los últimos 4 s. */
export function TurnTimer({ spec }: { spec: TurnTimerSpec }) {
  const [left, setLeft] = useState(TURN_SECONDS);
  const cb = useRef(spec.onTimeout);
  cb.current = spec.onTimeout;

  useEffect(() => {
    if (!spec.active) { setLeft(TURN_SECONDS); return; }
    const end = Date.now() + TURN_SECONDS * 1000;
    setLeft(TURN_SECONDS);
    const i = window.setInterval(() => {
      const l = Math.max(0, (end - Date.now()) / 1000);
      setLeft(l);
      if (l <= 0) { window.clearInterval(i); cb.current(); }
    }, 100);
    return () => window.clearInterval(i);
  }, [spec.active, spec.id]);

  if (!spec.active) return <div className="h-[18px]" />;
  const danger = left <= 4;
  const color = danger ? '#ef4444' : left <= 8 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2" role="timer" aria-label={`${Math.ceil(left)} segundos`}>
      <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full" style={{ width: `${(left / TURN_SECONDS) * 100}%`, background: color, boxShadow: `0 0 8px ${color}` }}
          animate={danger ? { opacity: [1, 0.35, 1] } : { opacity: 1 }} transition={danger ? { duration: 0.6, repeat: Infinity } : undefined} />
      </div>
      <span className="font-mono w-7 text-right text-[11px] font-bold tabular-nums" style={{ color }}>{Math.ceil(left)}s</span>
    </div>
  );
}
