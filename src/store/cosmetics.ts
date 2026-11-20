import { useSyncExternalStore } from 'react';
import { setSettings, getSettings, type ThemeId } from './settings.ts';
import { wallet } from './wallet.ts';

/**
 * Tienda «Club VIP»: dorsos de cartas, tapetes, marcos de avatar y juegos de fichas y dados. Se compran con fichas virtuales
 * (nunca dinero real) y lo equipado se aplica de verdad en todas las mesas.
 */
export type BackId = 'esmeralda' | 'oro' | 'rubi' | 'zafiro' | 'obsidiana' | 'marmol' | 'purpura' | 'lauburu';
export type BackVariant = 'emerald' | 'gold' | 'crimson' | 'midnight' | 'obsidian' | 'marble' | 'purple' | 'lauburu';
export type FrameId = 'aro' | 'corona' | 'llama' | 'diamante' | 'escudo' | 'dragon' | 'as' | 'rey';
export type SetId = 'clasico' | 'lingote' | 'ebano' | 'cristal';

export const BACKS: { id: BackId; name: string; price: number; variant: BackVariant }[] = [
  { id: 'esmeralda', name: 'Clásico Esmeralda', price: 0, variant: 'emerald' },
  { id: 'oro', name: 'Oro Imperial', price: 1500, variant: 'gold' },
  { id: 'rubi', name: 'Rubí Real', price: 1200, variant: 'crimson' },
  { id: 'zafiro', name: 'Zafiro Nocturno', price: 1200, variant: 'midnight' },
  { id: 'obsidiana', name: 'Obsidiana Dragón', price: 1800, variant: 'obsidian' },
  { id: 'marmol', name: 'Mármol & Oro', price: 2200, variant: 'marble' },
  { id: 'purpura', name: 'Púrpura Real', price: 1600, variant: 'purple' },
  { id: 'lauburu', name: 'Lauburu Dorado', price: 2500, variant: 'lauburu' },
];
/** Tapetes de la tienda (los demás de Ajustes siguen siendo gratuitos). */
export const TAPETES: { id: ThemeId; name: string; price: number }[] = [
  { id: 'esmeralda', name: 'Esmeralda Club', price: 0 },
  { id: 'obsidiana', name: 'Obsidiana VIP', price: 2000 },
  { id: 'burdeos', name: 'Burdeos Casino', price: 1500 },
  { id: 'azul', name: 'Azul Montecarlo', price: 1800 },
  { id: 'cuero', name: 'Cuero Coñac', price: 1600 },
  { id: 'pizarra', name: 'Pizarra Imperial', price: 2200 },
];
export const FRAMES: { id: FrameId; name: string; price: number }[] = [
  { id: 'aro', name: 'Aro Esmeralda', price: 0 },
  { id: 'corona', name: 'Corona Imperial', price: 2000 },
  { id: 'llama', name: 'Llama del Órdago', price: 1500 },
  { id: 'diamante', name: 'Diamante VIP', price: 3000 },
  { id: 'escudo', name: 'Escudo Dorado', price: 1200 },
  { id: 'dragon', name: 'Dragón Jade', price: 2500 },
  { id: 'as', name: 'As de Oros', price: 1800 },
  { id: 'rey', name: 'Rey del Tablero', price: 3500 },
];
export const SETS: { id: SetId; name: string; price: number }[] = [
  { id: 'clasico', name: 'Casino Clásico', price: 0 },
  { id: 'lingote', name: 'Lingote de Oro', price: 2000 },
  { id: 'ebano', name: 'Ébano & Marfil', price: 1800 },
  { id: 'cristal', name: 'Cristal Esmeralda', price: 2600 },
];
const PAID_THEMES = new Set<ThemeId>(TAPETES.filter((t) => t.price > 0).map((t) => t.id));

interface State { backs: BackId[]; back: BackId; themes: ThemeId[]; frames: FrameId[]; frame: FrameId; sets: SetId[]; set: SetId }
const KEY = 'stacks.cosmetics.v1';
const DEFAULT: State = { backs: ['esmeralda'], back: 'esmeralda', themes: ['esmeralda'], frames: ['aro'], frame: 'aro', sets: ['clasico'], set: 'clasico' };

/** Filtra la lista guardada a ids válidos y garantiza el elemento gratuito. */
const clean = <T extends string>(raw: unknown, valid: readonly { id: T }[], free: T): T[] => {
  const list = (Array.isArray(raw) ? raw : []).filter((x): x is T => valid.some((v) => v.id === x));
  return list.includes(free) ? list : [free, ...list];
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<State>;
      const backs = clean<BackId>(p.backs, BACKS, 'esmeralda');
      const themes = clean<ThemeId>(p.themes, TAPETES, 'esmeralda');
      const frames = clean<FrameId>(p.frames, FRAMES, 'aro');
      const sets = clean<SetId>(p.sets, SETS, 'clasico');
      return {
        backs, themes, frames, sets,
        back: p.back && backs.includes(p.back) ? p.back : 'esmeralda',
        frame: p.frame && frames.includes(p.frame) ? p.frame : 'aro',
        set: p.set && sets.includes(p.set) ? p.set : 'clasico',
      };
    }
  } catch { /* valores por defecto */ }
  return DEFAULT;
}

let state: State = load();
const listeners = new Set<() => void>();
function set(next: State): void {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento */ }
  listeners.forEach((l) => l());
}

/** ¿Se puede usar este tapete? Los gratuitos siempre; los de pago solo si se compraron. */
export const themeUnlocked = (id: ThemeId): boolean => !PAID_THEMES.has(id) || state.themes.includes(id);

export const cosmetics = {
  /** Compra con fichas. Devuelve false si ya lo tienes o no te alcanza. */
  buyBack(id: BackId): boolean {
    const b = BACKS.find((x) => x.id === id);
    if (!b || state.backs.includes(id) || !wallet.spend(b.price)) return false;
    set({ ...state, backs: [...state.backs, id], back: id });
    return true;
  },
  equipBack(id: BackId): void { if (state.backs.includes(id)) set({ ...state, back: id }); },
  buyTheme(id: ThemeId): boolean {
    const t = TAPETES.find((x) => x.id === id);
    if (!t || state.themes.includes(id) || !wallet.spend(t.price)) return false;
    set({ ...state, themes: [...state.themes, id] });
    setSettings({ theme: id });
    return true;
  },
  equipTheme(id: ThemeId): void { if (themeUnlocked(id)) setSettings({ theme: id }); },
  buyFrame(id: FrameId): boolean {
    const f = FRAMES.find((x) => x.id === id);
    if (!f || state.frames.includes(id) || !wallet.spend(f.price)) return false;
    set({ ...state, frames: [...state.frames, id], frame: id });
    return true;
  },
  equipFrame(id: FrameId): void { if (state.frames.includes(id)) set({ ...state, frame: id }); },
  buySet(id: SetId): boolean {
    const x = SETS.find((v) => v.id === id);
    if (!x || state.sets.includes(id) || !wallet.spend(x.price)) return false;
    set({ ...state, sets: [...state.sets, id], set: id });
    return true;
  },
  equipSet(id: SetId): void { if (state.sets.includes(id)) set({ ...state, set: id }); },
  /** Al iniciar sesión en otro dispositivo: lo equipado en la nube pasa a ser tuyo (la nube solo guarda lo equipado, no la lista de compras). */
  hydrate(cardBack: string, table: string): void {
    const back = (cardBack === 'emerald' ? 'esmeralda' : cardBack) as BackId;
    const theme = (table === 'emerald' ? 'esmeralda' : table) as ThemeId;
    const backs = BACKS.some((b) => b.id === back) && !state.backs.includes(back) ? [...state.backs, back] : state.backs;
    const themes = TAPETES.some((x) => x.id === theme) && !state.themes.includes(theme) ? [...state.themes, theme] : state.themes;
    set({ ...state, backs, themes, back: backs.includes(back) ? back : state.back });
    if (themes.includes(theme)) setSettings({ theme });
  },
  reset(): void { try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } set(DEFAULT); if (!themeUnlocked(getSettings().theme)) setSettings({ theme: 'esmeralda' }); },
};

// Si un tapete de pago no está comprado (datos antiguos), se vuelve al gratuito.
if (!themeUnlocked(getSettings().theme)) setSettings({ theme: 'esmeralda' });

export const getCosmetics = (): State => state;
/** Suscripción sin React (sincronización con la nube). */
export const subscribeCosmetics = (l: () => void): (() => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
/** Datos para guardar en la nube: lo que llevas equipado. */
export const equippedForCloud = (): { card_back: string; table: string } => ({ card_back: state.back === 'esmeralda' ? 'emerald' : state.back, table: getSettings().theme === 'esmeralda' ? 'emerald' : getSettings().theme });
export const useCosmetics = (): State => useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, getCosmetics);
/** Variante de dorso equipada (los componentes de cartas la leen con este hook para actualizarse al instante). */
export function useCardBack(): BackVariant {
  const c = useCosmetics();
  return BACKS.find((b) => b.id === c.back)!.variant;
}
/** Marco de avatar equipado. */
export const useFrame = (): FrameId => useCosmetics().frame;
/** Juego de fichas y dados equipado. */
export const useChipSet = (): SetId => useCosmetics().set;

/** Paleta de una ficha de casino según el juego equipado (`k` = posición de la ficha en su rack). */
export function chipLook<T extends { base: string; ring: string; ink: string }>(set: SetId, k: number, look: T): T {
  switch (set) {
    case 'lingote': { const bases = ['#8a6410', '#b8860b', '#d4af37', '#e9c75a', '#f6dd85']; return { ...look, base: bases[k % 5]!, ring: '#fff0b0', ink: '#2a1d02' }; }
    case 'ebano': return k % 2 === 0 ? { ...look, base: '#17130f', ring: '#f3ead2', ink: '#f3ead2' } : { ...look, base: '#f3ead2', ring: '#17130f', ink: '#17130f' };
    case 'cristal': { const bases = ['#0b7a57', '#0f9f6e', '#13b981', '#2fd49a', '#6ee7b7']; return { ...look, base: bases[k % 5]!, ring: '#d1fae5', ink: '#ffffff' }; }
    default: return look;
  }
}
