import { useSyncExternalStore } from 'react';

/** Carta que el jugador está tocando o señalando: su nombre y valor se muestran en el dock inferior, nunca encima de la carta. */
let text = '';
const subs = new Set<() => void>();
export const setCardInfo = (t: string): void => { if (t !== text) { text = t; subs.forEach((f) => f()); } };
export const useCardInfo = (): string => useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l); }; }, () => text);
