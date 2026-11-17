import type { ReactNode } from 'react';

/** Fichas de colores de la bandeja del crupier. */
const TRAY = [
  { c: '#f4f1e6', n: 4 }, { c: '#c0392b', n: 5 }, { c: '#1e8a4c', n: 3 }, { c: '#1b1b1f', n: 4 }, { c: '#d4af37', n: 2 },
];

/**
 * Mesa ovalada de casino: rail de cuero oscuro con brillo en el canto, ribete dorado, fieltro esmeralda con
 * textura de tejido, línea discontinua de apuestas, emblema CLUB STACKS y bandeja de fichas del crupier.
 * Todo con CSS estático (sin filtros ni animaciones): ligero en móvil. Los hijos se colocan sobre la mesa.
 */
export function OvalTable({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full w-full" aria-hidden={false}>
      {/* rail acolchado */}
      <div aria-hidden className="absolute inset-[1.5%_1%] rounded-[50%]"
        style={{ background: 'linear-gradient(180deg,#1b1f1d 0%,#121514 45%,#0b0d0c 100%)', boxShadow: 'inset 0 5px 12px rgba(255,255,255,.09), inset 0 -12px 24px rgba(0,0,0,.85), 0 16px 30px rgba(0,0,0,.55)' }} />
      {/* brillo del canto */}
      <div aria-hidden className="absolute inset-[2.6%_1.8%] rounded-[50%]" style={{ boxShadow: 'inset 0 2px 3px rgba(255,255,255,.14)' }} />
      {/* ribete dorado */}
      <div aria-hidden className="absolute inset-[7%_5.2%] rounded-[50%]" style={{ border: '2.5px solid #D4AF37', boxShadow: '0 0 0 1px rgba(0,0,0,.6), inset 0 0 0 1px rgba(251,224,138,.35)' }} />
      {/* fieltro */}
      <div aria-hidden className="absolute inset-[7.8%_5.9%] overflow-hidden rounded-[50%]"
        style={{ background: 'radial-gradient(ellipse at 50% 46%, #0B2E20 0%, #0A2819 55%, #061A12 100%)', boxShadow: 'inset 0 0 40px rgba(0,0,0,.55)' }}>
        <div className="absolute inset-0 opacity-70" style={{ background: 'repeating-linear-gradient(45deg, rgba(255,255,255,.018) 0 2px, transparent 2px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,.05) 0 2px, transparent 2px 4px)' }} />
      </div>
      {/* línea de apuestas */}
      <div aria-hidden className="absolute inset-[24%_19%] rounded-[50%]" style={{ border: '2px dashed rgba(240,195,95,.22)' }} />
      {/* emblema */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[66%] -translate-x-1/2 text-center font-[var(--font-display)] font-bold leading-none tracking-[.28em]"
        style={{ color: 'rgba(240,195,95,.17)', fontSize: 'clamp(10px,3.2vw,20px)' }}>
        <div>♠ CLUB STACKS ♠</div>
      </div>
      {/* bandeja de fichas del crupier */}
      <div aria-hidden className="absolute left-1/2 top-[29%] flex -translate-x-1/2 items-end gap-[3px] rounded-md px-1.5 py-1"
        style={{ background: 'linear-gradient(180deg,#4a504d,#1c201f)', border: '1px solid #7c817d', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 3px 6px rgba(0,0,0,.5)' }}>
        {TRAY.map((t) => (
          <div key={t.c} className="flex flex-col-reverse gap-[1px]">
            {Array.from({ length: t.n }, (_, i) => (
              <span key={i} className="block rounded-full" style={{ width: 'clamp(9px,2.6vw,14px)', height: 'clamp(3px,.9vw,5px)', background: t.c, border: '1px solid rgba(0,0,0,.45)' }} />
            ))}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}
