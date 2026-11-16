import { useSyncExternalStore } from 'react';

/** Fichas virtuales gratuitas (nunca dinero real). Persistidas en localStorage con try/catch. */
export interface WalletState {
  chips: number;
  name: string;
  lastDailyClaim: string; // YYYY-MM-DD
}

const KEY = 'latimba.wallet.v1';
export const START_CHIPS = 1000;
export const DAILY_CHIPS = 500;
export const AD_CHIPS = 250;

const today = (): string => new Date().toISOString().slice(0, 10);

function load(): WalletState {
  const fallback: WalletState = { chips: START_CHIPS, name: 'Jugador', lastDailyClaim: '' };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as Partial<WalletState>;
    return {
      chips: typeof p.chips === 'number' && p.chips >= 0 ? Math.floor(p.chips) : START_CHIPS,
      name: typeof p.name === 'string' && p.name.trim() ? p.name.slice(0, 16) : 'Jugador',
      lastDailyClaim: typeof p.lastDailyClaim === 'string' ? p.lastDailyClaim : '',
    };
  } catch {
    return fallback;
  }
}

let state: WalletState = load();
const listeners = new Set<() => void>();

function set(next: WalletState): void {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* modo privado / sin almacenamiento: seguimos en memoria */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const getWallet = (): WalletState => state;
export const useWallet = (): WalletState => useSyncExternalStore(subscribe, getWallet);

export const canClaimDaily = (s: WalletState = state): boolean => s.lastDailyClaim !== today();

export const wallet = {
  /** Suma (o resta, si es negativo) fichas. Nunca baja de 0. */
  add(n: number): void {
    set({ ...state, chips: Math.max(0, Math.floor(state.chips + n)) });
  },
  /** Resta si hay saldo suficiente. Devuelve false si no alcanza. */
  spend(n: number): boolean {
    if (n <= 0 || n > state.chips) return false;
    set({ ...state, chips: state.chips - n });
    return true;
  },
  claimDaily(): boolean {
    if (!canClaimDaily()) return false;
    set({ ...state, chips: state.chips + DAILY_CHIPS, lastDailyClaim: today() });
    return true;
  },
  /** Recompensa por ver un anuncio (el SDK real se enchufa aquí). */
  claimAd(): void {
    set({ ...state, chips: state.chips + AD_CHIPS });
  },
  setName(name: string): void {
    set({ ...state, name: name.trim().slice(0, 16) || 'Jugador' });
  },
};
