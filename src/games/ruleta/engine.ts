/**
 * Ruleta VIP europea (0–36, un solo cero). Mesa compartida: cualquiera puede girar y el anfitrión sortea el número;
 * cada jugador apuesta con sus propias fichas y cobra por su cuenta al caer la bola.
 * Pagos (devuelven la apuesta): pleno ×36 (35 a 1), docena ×3 (2 a 1), rojo/negro/par/impar ×2 (1 a 1). El 0 solo paga al pleno.
 */
export const CHIPS = [10, 25, 50, 100, 500] as const;
/** Orden real de los números en la rueda europea, en el sentido de las agujas del reloj. */
export const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26] as const;
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type Color = 'red' | 'black' | 'green';
export const colorOf = (n: number): Color => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

/**
 * Clave de apuesta: `n:17` pleno · `s:17-20` caballo · `st:4` calle (4-5-6) · `c:17-18-20-21` cuadro · `d1..d3` docena · `col1..col3` columna ·
 * `red` `black` `even` `odd` `lo` (1-18) `hi` (19-36).
 */
export type BetKey = string;
export type Bets = Record<BetKey, number>;

const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);
/** Números que cubre una apuesta (para iluminar el tapete y para cobrar). */
export function covers(key: BetKey): number[] {
  if (key.startsWith('n:')) return [Number(key.slice(2))];
  if (key.startsWith('s:') || key.startsWith('c:')) return key.slice(2).split('-').map(Number);
  if (key.startsWith('st:')) { const r = Number(key.slice(3)); return [r, r + 1, r + 2]; }
  switch (key) {
    case 'red': return range(1, 36).filter((n) => colorOf(n) === 'red');
    case 'black': return range(1, 36).filter((n) => colorOf(n) === 'black');
    case 'even': return range(1, 36).filter((n) => n % 2 === 0);
    case 'odd': return range(1, 36).filter((n) => n % 2 === 1);
    case 'lo': return range(1, 18);
    case 'hi': return range(19, 36);
    case 'd1': return range(1, 12);
    case 'd2': return range(13, 24);
    case 'd3': return range(25, 36);
    case 'col1': return range(1, 36).filter((n) => n % 3 === 1);
    case 'col2': return range(1, 36).filter((n) => n % 3 === 2);
    case 'col3': return range(1, 36).filter((n) => n % 3 === 0);
    default: return [];
  }
}
export const wins = (key: BetKey, n: number): boolean => covers(key).includes(n);
/** Multiplicador que se cobra (incluye la apuesta devuelta): pleno 35:1, caballo 17:1, calle 11:1, cuadro 8:1, docena/columna 2:1, sencilla 1:1. */
export function multiplier(key: BetKey): number {
  if (key.startsWith('n:')) return 36;
  if (key.startsWith('s:')) return 18;
  if (key.startsWith('st:')) return 12;
  if (key.startsWith('c:')) return 9;
  if (key.startsWith('d') || key.startsWith('col')) return 3;
  return 2;
}

export interface Settlement { stake: number; payout: number; net: number; straight: boolean }
export function settle(bets: Bets, n: number): Settlement {
  let stake = 0; let payout = 0; let straight = false;
  for (const [k, amt] of Object.entries(bets)) {
    stake += amt;
    if (wins(k, n)) { payout += amt * multiplier(k); if (k.startsWith('n:')) straight = true; }
  }
  return { stake, payout, net: payout - stake, straight };
}

export interface RouletteState { phase: 'bet' | 'spin'; result: number | null; /** Cambia en cada giro (para disparar la animación una vez). */ spin: number; history: number[] }
export const newTable = (): RouletteState => ({ phase: 'bet', result: null, spin: 0, history: [] });

export type RouletteAction = { k: 'spin' } | { k: 'next' };

export function applyRouletteAction(s: RouletteState, _pid: string, a: RouletteAction): RouletteState | null {
  if (a.k === 'spin') {
    if (s.phase !== 'bet') return null;
    return { ...s, phase: 'spin', result: Math.floor(Math.random() * 37), spin: s.spin + 1 };
  }
  if (s.phase !== 'spin' || s.result === null) return null;
  return { ...s, phase: 'bet', result: null, history: [s.result, ...s.history].slice(0, 12) };
}

/** Ángulo (grados, en sentido horario desde arriba) del centro de la casilla del número `n`. */
export const pocketAngle = (n: number): number => WHEEL.indexOf(n as (typeof WHEEL)[number]) * (360 / WHEEL.length);
