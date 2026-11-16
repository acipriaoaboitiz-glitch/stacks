import { useSyncExternalStore } from 'react';
import { PREFS, setPref } from '../games/mus/app/lib/feedback.ts';

export type AnimSpeed = 'normal' | 'rapida';
export const SPEED_FACTOR: Record<AnimSpeed, number> = { normal: 1, rapida: 1.8 };
export type Lang = 'es' | 'eu' | 'en';
export type ThemeId = 'esmeralda' | 'royal' | 'burdeos' | 'obsidiana' | 'purpura';

/** Cinco tapetes: variables CSS del paño (las usan lobby, mesas y la mesa de Mus). */
export const THEMES: Record<ThemeId, { a: string; b: string; c: string; glow: string; swatch: string }> = {
  esmeralda: { a: 'rgba(13,49,38,.9)', b: '#0b211a', c: '#091813', glow: 'rgba(18,83,60,.2)', swatch: 'from-emerald-950 via-emerald-900 to-slate-950' },
  royal: { a: 'rgba(10,44,92,.92)', b: '#0a1d3d', c: '#050f24', glow: 'rgba(40,120,200,.22)', swatch: 'from-blue-950 via-sky-900 to-slate-950' },
  burdeos: { a: 'rgba(96,18,36,.92)', b: '#3a0f18', c: '#1f0810', glow: 'rgba(170,50,64,.22)', swatch: 'from-rose-950 via-red-900 to-slate-950' },
  obsidiana: { a: 'rgba(38,38,42,.95)', b: '#18181b', c: '#09090b', glow: 'rgba(120,120,130,.14)', swatch: 'from-zinc-900 via-neutral-900 to-black' },
  purpura: { a: 'rgba(60,32,104,.92)', b: '#1e1245', c: '#0e0a28', glow: 'rgba(124,80,210,.2)', swatch: 'from-purple-950 via-indigo-950 to-slate-950' },
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

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

export type Sfx = 'tap' | 'chip' | 'card' | 'deal' | 'thud' | 'trick' | 'win' | 'big';

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

/** Respuesta háptica y sonido sintetizado con Web Audio (sin archivos), respetando Ajustes. */
export function feedback(kind: Sfx = 'tap'): void {
  if (state.vibration && 'vibrate' in navigator) {
    try { navigator.vibrate(kind === 'big' || kind === 'win' ? [30, 40, 60] : kind === 'thud' ? 25 : 10); } catch { /* no soportado */ }
  }
  if (!state.sound) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  switch (kind) {
    case 'deal': case 'card': // reparto: roce de naipe
      noise(c, t, 0.09, 3200, 0.18); noise(c, t + 0.035, 0.06, 5200, 0.1); break;
    case 'thud': // golpe en la mesa (Paso / Órdago)
      tone(c, t, 150, 0.22, 0.35, 'sine', 45); noise(c, t, 0.08, 400, 0.25); break;
    case 'trick': // baza ganada
      tone(c, t, 660, 0.16, 0.08); tone(c, t + 0.09, 880, 0.24, 0.08); break;
    case 'win': case 'big': // victoria
      [523, 659, 784, 1046].forEach((fq, k) => tone(c, t + k * 0.09, fq, 0.3, 0.07)); break;
    case 'chip':
      tone(c, t, 1200, 0.05, 0.05, 'square'); noise(c, t, 0.04, 6000, 0.08); break;
    default:
      tone(c, t, 520, 0.05, 0.04);
  }
}
