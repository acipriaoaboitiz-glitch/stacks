import { useSyncExternalStore } from 'react';
import { PREFS, setPref } from '../games/mus/app/lib/feedback.ts';

export type AnimSpeed = 'normal' | 'rapida';
export const SPEED_FACTOR: Record<AnimSpeed, number> = { normal: 1, rapida: 1.8 };
export type Lang = 'es' | 'eu' | 'en';
export type ThemeId = 'esmeralda' | 'royal' | 'burdeos' | 'obsidiana' | 'purpura';

/** Cinco tapetes: variables CSS del paño (las usan lobby, mesas y la mesa de Mus). */
export const THEMES: Record<ThemeId, { a: string; b: string; c: string; glow: string; swatch: string; hue: number }> = {
  esmeralda: { a: 'rgba(13,49,38,.9)', b: '#0b211a', c: '#091813', glow: 'rgba(18,83,60,.2)', swatch: 'from-emerald-950 via-emerald-900 to-slate-950', hue: .42 },
  royal: { a: 'rgba(10,44,92,.92)', b: '#0a1d3d', c: '#050f24', glow: 'rgba(40,120,200,.22)', swatch: 'from-blue-950 via-sky-900 to-slate-950', hue: .58 },
  burdeos: { a: 'rgba(96,18,36,.92)', b: '#3a0f18', c: '#1f0810', glow: 'rgba(170,50,64,.22)', swatch: 'from-rose-950 via-red-900 to-slate-950', hue: .98 },
  obsidiana: { a: 'rgba(38,38,42,.95)', b: '#18181b', c: '#09090b', glow: 'rgba(120,120,130,.14)', swatch: 'from-zinc-900 via-neutral-900 to-black', hue: .12 },
  purpura: { a: 'rgba(60,32,104,.92)', b: '#1e1245', c: '#0e0a28', glow: 'rgba(124,80,210,.2)', swatch: 'from-purple-950 via-indigo-950 to-slate-950', hue: .75 },
};

export interface Settings { sound: boolean; vibration: boolean; speed: AnimSpeed; theme: ThemeId; lang: Lang; help: boolean }

const KEY = 'stacks.settings.v2';
const DEFAULTS: Settings = { sound: true, vibration: true, speed: 'normal', theme: 'esmeralda', lang: 'es', help: true };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      sound: p.sound !== false,
      vibration: p.vibration !== false,
      speed: p.speed === 'rapida' ? 'rapida' : 'normal',
      theme: p.theme && p.theme in THEMES ? p.theme : 'esmeralda',
      lang: p.lang === 'eu' || p.lang === 'en' ? p.lang : 'es',
      help: p.help !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

let state = load();
const listeners = new Set<() => void>();

function apply(): void {
  try {
    const root = document.documentElement;
    const th = THEMES[state.theme];
    root.style.setProperty('--anim', String(SPEED_FACTOR[state.speed]));
    root.style.setProperty('--tapete-a', th.a);
    root.style.setProperty('--tapete-b', th.b);
    root.style.setProperty('--tapete-c', th.c);
    root.style.setProperty('--tapete-glow', th.glow);
    root.lang = state.lang;
    setPref(PREFS.sound, state.sound); // la mesa de Mus Online comparte el interruptor de sonido
  } catch { /* sin DOM */ }
}
apply();

export function setSettings(patch: Partial<Settings>): void {
  state = { ...state, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento */ }
  apply();
  listeners.forEach((l) => l());
}

export const getSettings = (): Settings => state;
export const useSettings = (): Settings =>
  useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, getSettings);

/** Pausa de la IA ajustada a la velocidad elegida (Normal / Rápida). */
export const aiDelay = (ms: number): number => ms / SPEED_FACTOR[state.speed];

/** Pausa natural antes de que un bot mueva: 400–650 ms (mínimo 250 ms en «Rápida» para que se lea la jugada). */
export const botDelay = (): number => Math.max(350, aiDelay(750 + Math.random() * 150));

/** Transición estándar de las mesas: rápida y suave. */
export const FAST_EASE = { duration: 0.22, ease: 'easeOut' } as const;
/** Cartas en movimiento: solo transform/opacity y como máximo 0,18 s. */
export const CARD_EASE = { duration: 0.18, ease: 'easeOut' } as const;

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

export type Sfx = 'tap' | 'chip' | 'card' | 'deal' | 'thud' | 'trick' | 'win' | 'big' | 'play' | 'turn' | 'draw' | 'impact' | 'defeat';

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

/** Ráfaga de ruido filtrada (reparto de naipes, roce sobre el paño). */
function noise(c: AudioContext, at: number, dur: number, freq: number, gain: number): void {
  noiseBuf ??= (() => {
    const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(at, Math.random() * 0.5);
  src.stop(at + dur);
}

function tone(c: AudioContext, at: number, freq: number, dur: number, gain: number, type: OscillatorType = 'triangle', slideTo?: number): void {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + dur);
}

// ─── Game Feel: efectos procedurales (Web Audio, sin archivos, latencia ~0) ─────────────────────
const buzz = (pattern: number | number[]): void => {
  if (!state.vibration || !('vibrate' in navigator)) return;
  try { navigator.vibrate(pattern); } catch { /* iOS / sin soporte */ }
};
/** Ejecuta `fn` con el contexto de audio solo si el sonido global está activo. */
const withAudio = (fn: (c: AudioContext, t: number) => void): void => {
  if (!state.sound) return;
  const c = audio();
  if (c) fn(c, c.currentTime);
};

/** Chasquido seco de una carta contra el tapete (~40 ms). */
export function playCardSnap(): void { buzz([12]); withAudio((c, t) => { noise(c, t, 0.04, 3400, 0.26); tone(c, t, 190, 0.035, 0.12, 'sine', 120); }); }
/** Robar: barrido ascendente corto (~60 ms). */
export function playCardDraw(): void { buzz(8); withAudio((c, t) => { tone(c, t, 420, 0.06, 0.06, 'sine', 780); noise(c, t, 0.05, 5200, 0.06); }); }
/** Tu turno: campanilla doble con quinta limpia. */
export function playTurnPing(): void { buzz([20, 40, 20]); withAudio((c, t) => { tone(c, t, 880, 0.28, 0.045, 'sine'); tone(c, t + 0.005, 1320, 0.28, 0.03, 'sine'); tone(c, t + 0.11, 1320, 0.3, 0.04, 'sine'); tone(c, t + 0.115, 1980, 0.3, 0.025, 'sine'); }); }
/** Jugada fuerte (+4, corte, Órdago, cierre): golpe grave con sub-bass (~120 ms). */
export function playImpact(): void { buzz([45]); withAudio((c, t) => { tone(c, t, 120, 0.12, 0.5, 'sine', 42); noise(c, t, 0.08, 320, 0.3); }); }
/** Fichas / puntos: tintineo metálico 1200 → 1800 Hz. */
export function playChipClink(): void { buzz(6); withAudio((c, t) => { tone(c, t, 1200, 0.09, 0.07, 'triangle', 1800); tone(c, t + 0.05, 1500, 0.09, 0.06, 'triangle', 2100); noise(c, t, 0.03, 7000, 0.06); }); }
/** Victoria: arpegio Do-Mi-Sol-Do con brillo. */
export function playVictoryFanfare(): void {
  buzz([30, 50, 30, 50, 80]);
  withAudio((c, t) => {
    [523, 659, 784, 1046].forEach((fq, k) => { tone(c, t + k * 0.075, fq, 0.32, 0.07, 'triangle'); tone(c, t + k * 0.075, fq * 2, 0.22, 0.02, 'sine'); });
    tone(c, t + 0.34, 2093, 0.4, 0.03, 'sine');
  });
}
/** Cinemática de jugada: golpe grave + acorde brillante (jugada tuya) o grave sombrío (castigo). */
export function playCinematicSound(good: boolean): void {
  buzz([25, 35, 30]);
  withAudio((c, t) => {
    tone(c, t, 110, 0.2, 0.5, 'sine', 40); noise(c, t, 0.1, 300, 0.32);
    if (good) { [523, 659, 784, 1046].forEach((f, k) => tone(c, t + 0.06 + k * 0.045, f, 0.45, 0.06, 'triangle')); tone(c, t + 0.3, 2093, 0.5, 0.03, 'sine'); }
    else { tone(c, t + 0.05, 196, 0.5, 0.07, 'sawtooth', 110); tone(c, t + 0.05, 185, 0.5, 0.05, 'sawtooth', 104); }
  });
}

/** Derrota: dos notas graves descendentes y suaves. */
export function playDefeatTone(): void { buzz([60, 40, 60]); withAudio((c, t) => { tone(c, t, 233, 0.3, 0.06, 'sine'); tone(c, t + 0.22, 175, 0.42, 0.06, 'sine'); }); }

/** Respuesta háptica y sonido de las acciones de las mesas (los juegos llaman siempre a esta función). */
export function feedback(kind: Sfx = 'tap'): void {
  switch (kind) {
    case 'play': case 'card': playCardSnap(); return;
    case 'draw': playCardDraw(); return;
    case 'turn': playTurnPing(); return;
    case 'thud': case 'impact': playImpact(); return;
    case 'chip': playChipClink(); return;
    case 'win': case 'big': playVictoryFanfare(); return;
    case 'defeat': playDefeatTone(); return;
    case 'deal': // reparto y avisos de otros: solo roce, sin vibrar
      withAudio((c, t) => { noise(c, t, 0.07, 3200, 0.14); }); return;
    case 'trick': buzz(10); withAudio((c, t) => { tone(c, t, 660, 0.16, 0.08); tone(c, t + 0.09, 880, 0.24, 0.08); }); return;
    default: buzz(10); withAudio((c, t) => { tone(c, t, 520, 0.05, 0.04); });
  }
}

export type EmoteId = 'clap' | 'laugh' | 'fire' | 'turn' | 'hit';

/** Sonido corto de cada reacción rápida (sintetizado, sin archivos). */
export function emoteSound(id: EmoteId): void {
  if (state.vibration && 'vibrate' in navigator) { try { navigator.vibrate(id === 'hit' ? [20, 30, 30] : 15); } catch { /* no soportado */ } }
  if (!state.sound) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  switch (id) {
    case 'clap': [0, 0.11, 0.22, 0.31].forEach((d) => noise(c, t + d, 0.07, 2600, 0.22)); break;
    case 'laugh': [620, 560, 620, 540, 600].forEach((f, k) => tone(c, t + k * 0.09, f, 0.08, 0.06, 'square')); break;
    case 'fire': noise(c, t, 0.5, 900, 0.16); tone(c, t, 180, 0.5, 0.05, 'sawtooth', 520); break;
    case 'turn': tone(c, t, 880, 0.1, 0.06); tone(c, t + 0.16, 880, 0.1, 0.06); break;
    case 'hit': tone(c, t, 220, 0.18, 0.3, 'sine', 70); tone(c, t + 0.1, 1175, 0.2, 0.06); break;
  }
}
