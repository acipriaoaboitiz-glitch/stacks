import { useMemo } from 'react';
import {
  feedback, playCardDraw, playCinematicSound, playCardSnap, playChipClink, playDefeatTone, playImpact, playTurnPing, playVictoryFanfare,
} from '../store/settings.ts';

/**
 * Game Feel centralizado. El sonido y la vibración respetan los interruptores globales (Ajustes / botón de sonido).
 * Los efectos visuales (temblor de mesa y textos de impacto) viajan por un pequeño bus que escucha `GameFrame`.
 */
export type CalloutTone = 'gold' | 'neon' | 'red';
export type CinematicTone = 'gold' | 'ruby' | 'emerald' | 'electric';
export interface Cinematic { id: number; title: string; sub?: string; tone: CinematicTone }
export interface Callout { id: number; text: string; tone: CalloutTone }
type Listener = { onShake: () => void; onCallout: (c: Callout) => void; onCinematic?: (c: Cinematic) => void };

const listeners = new Set<Listener>();
let nextId = 1;

export const subscribeJuice = (l: Listener): (() => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const shake = (): void => listeners.forEach((l) => l.onShake());
const callout = (text: string, tone: CalloutTone = 'gold'): void => { const c = { id: nextId++, text, tone }; listeners.forEach((l) => l.onCallout(c)); };

/** Cinemática épica de jugada (≈1,5 s, sin bloquear). `good` = jugada tuya (fanfarria) o castigo (grave). */
const cinematic = (c: { title: string; sub?: string; tone?: CinematicTone; good?: boolean }): void => {
  const full: Cinematic = { id: nextId++, title: c.title, sub: c.sub, tone: c.tone ?? 'gold' };
  playCinematicSound(c.good ?? full.tone !== 'ruby');
  shake();
  listeners.forEach((l) => l.onCinematic?.(full));
};

export const juice = {
  cinematic,
  playCardSnap, playCardDraw, playTurnPing, playImpact, playChipClink, playVictoryFanfare, playDefeatTone,
  /** Texto grande en el centro de la mesa. */
  callout,
  /** Micro-temblor de 250 ms de la mesa. */
  shake,
  /** Jugada fuerte (+2/+4, corte con un 2, Órdago, cierre): golpe grave + temblor + texto. */
  impact(text?: string, tone: CalloutTone = 'gold'): void { playImpact(); shake(); if (text) callout(text, tone); },
  /** Texto de impacto con tintineo de fichas/puntos. */
  points(text: string, tone: CalloutTone = 'gold'): void { playChipClink(); callout(text, tone); },
  feedback,
};

/** Hook de acceso al sistema de Game Feel (las funciones son estables). */
export function useGameJuice(): typeof juice {
  return useMemo(() => juice, []);
}
