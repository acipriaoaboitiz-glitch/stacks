/** Motor espacial de animaciones: desde dónde nace una carta o ficha según el asiento (solo `transform` y `opacity`). */
export type SeatSlot = 'bottom' | 'right' | 'top' | 'left';

/** Curva común de vuelo (cubic-bezier(0.22, 1, 0.36, 1)). */
export const FLY_EASE = [0.22, 1, 0.36, 1] as const;

/** Desplazamiento (px) del asiento respecto al centro de la mesa, proporcional a la pantalla. */
export function getSeatVector(slot: SeatSlot): { x: number; y: number } {
  const W = typeof window === 'undefined' ? 360 : window.innerWidth;
  const H = typeof window === 'undefined' ? 640 : window.innerHeight;
  switch (slot) {
    case 'top': return { x: 0, y: -H * 0.26 };
    case 'left': return { x: -W * 0.33, y: -H * 0.03 };
    case 'right': return { x: W * 0.33, y: -H * 0.03 };
    default: return { x: 0, y: H * 0.32 };
  }
}
