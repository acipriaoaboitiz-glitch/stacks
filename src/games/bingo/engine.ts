/**
 * Mega Bingo VIP: bingo español de 90 bolas. Cada cartón es de 3×9 con 15 números (5 por fila, 1–3 por columna: la columna c lleva
 * los números 10c…10c+9). Premio de Línea (una fila completa) y de Bingo (los 15 números). El motor es puro:
 * `applyBingo(estado, pid, acción) → estado | null`; las bolas las saca el anfitrión con `drawBall`.
 */
export type Card = number[]; // 27 casillas (fila · 9 + columna); 0 = hueco

export interface BPlayer { id: string; name: string; human: boolean; peerId?: string; cards: Card[]; marks: number[] }
export interface BState {
  players: BPlayer[];
  /** Bolas sacadas, en orden. */
  drawn: number[];
  bag: number[];
  /** Fichas apostadas por cartón y bote acumulado. */
  bet: number;
  pot: number;
  lineBy: string | null;
  bingoBy: string | null;
  phase: 'play' | 'over';
  event: { seq: number; text: string } | null;
}

export const BET = 10;
export const LINE_SHARE = 0.2;
const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; } return r; };
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** Cartón válido: 5 números por fila, entre 1 y 3 por columna y números ascendentes dentro de cada columna. */
export function newCard(): Card {
  for (let tries = 0; tries < 5000; tries++) {
    const rows = [0, 1, 2].map(() => shuffle(range(9)).slice(0, 5));
    const per = range(9).map((c) => rows.filter((r) => r.includes(c)).length);
    if (per.some((n) => n < 1 || n > 3)) continue;
    const card: Card = new Array(27).fill(0);
    for (let c = 0; c < 9; c++) {
      const lo = c === 0 ? 1 : c * 10; const hi = c === 8 ? 90 : c * 10 + 9;
      const nums = shuffle(range(hi - lo + 1).map((i) => lo + i)).slice(0, per[c]!).sort((a, b) => a - b);
      let k = 0;
      for (let r = 0; r < 3; r++) if (rows[r]!.includes(c)) card[r * 9 + c] = nums[k++]!;
    }
    return card;
  }
  return [1, 0, 21, 0, 41, 0, 61, 0, 81, 0, 11, 0, 31, 0, 51, 0, 71, 0, 0, 0, 22, 0, 42, 0, 62, 0, 82, 0];
}

export function newBingo(players: { id: string; name: string; human: boolean; peerId?: string; cards: number }[], bet = BET): BState {
  const ps: BPlayer[] = players.map((p) => ({ id: p.id, name: p.name, human: p.human, peerId: p.peerId, cards: range(p.cards).map(newCard), marks: [] }));
  const total = ps.reduce((n, p) => n + p.cards.length, 0);
  return { players: ps, drawn: [], bag: shuffle(range(90).map((i) => i + 1)), bet, pot: total * bet, lineBy: null, bingoBy: null, phase: 'play', event: null };
}

let seq = 0;
const say = (s: BState, text: string): void => { s.event = { seq: ++seq, text }; };

export const cardNumbers = (c: Card): number[] => c.filter((n) => n > 0);
export const rowNumbers = (c: Card, r: number): number[] => c.slice(r * 9, r * 9 + 9).filter((n) => n > 0);
/** Cuántos números faltan para completar una fila (mínimo) o el cartón. */
export const missingLine = (c: Card, marks: readonly number[]): number => Math.min(...[0, 1, 2].map((r) => rowNumbers(c, r).filter((n) => !marks.includes(n)).length));
export const missingBingo = (c: Card, marks: readonly number[]): number => cardNumbers(c).filter((n) => !marks.includes(n)).length;
export const hasLine = (c: Card, marks: readonly number[]): boolean => missingLine(c, marks) === 0;

/** El anfitrión saca la siguiente bola. */
export function drawBall(prev: BState): BState | null {
  if (prev.phase !== 'play' || prev.bag.length === 0) return null;
  const s = structuredClone(prev);
  const n = s.bag.shift()!;
  s.drawn.push(n);
  for (const p of s.players) if (!p.human) p.marks.push(n); // las IA marcan al instante
  say(s, `Bola ${n}`);
  if (s.bag.length === 0 && !s.bingoBy) s.phase = 'over';
  return s;
}

export type BAction = { k: 'mark'; n: number } | { k: 'line'; card: number } | { k: 'bingo'; card: number };

export function applyBingo(prev: BState, pid: string, a: BAction): BState | null {
  const idx = prev.players.findIndex((p) => p.id === pid);
  if (idx < 0 || prev.phase !== 'play') return null;
  const p = prev.players[idx]!;
  if (a.k === 'mark') {
    if (!prev.drawn.includes(a.n) || p.marks.includes(a.n)) return null;
    const s = structuredClone(prev);
    s.players[idx]!.marks.push(a.n);
    return s;
  }
  const card = p.cards[a.card];
  if (!card) return null;
  const marks = p.marks.filter((n) => prev.drawn.includes(n));
  if (a.k === 'line') {
    if (prev.lineBy || !hasLine(card, marks)) return null;
    const s = structuredClone(prev);
    s.lineBy = pid;
    say(s, `¡LÍNEA de ${p.name}!`);
    return s;
  }
  if (prev.bingoBy || missingBingo(card, marks) !== 0) return null;
  const s = structuredClone(prev);
  s.bingoBy = pid;
  if (!s.lineBy) s.lineBy = pid; // un Bingo sin Línea cantada se lleva también la línea
  s.phase = 'over';
  say(s, `¡BINGO de ${p.name}!`);
  return s;
}

export const linePrize = (s: BState): number => Math.round(s.pot * LINE_SHARE);
/** Prima VIP: un Bingo cantado antes de la bola 38 se lleva un 50 % extra sobre el premio. */
export const VIP_BALL = 38;
export const baseBingoPrize = (s: BState): number => s.pot - linePrize(s);
export const vipBonus = (s: BState): number => (s.drawn.length <= VIP_BALL ? Math.round(baseBingoPrize(s) * 0.5) : 0);
export const bingoPrize = (s: BState): number => baseBingoPrize(s) + vipBonus(s);

/** IA: marca todo al instante y canta en cuanto puede (el anfitrión añade una pausa natural). */
export function botClaims(s: BState, pid: string): BAction | null {
  const p = s.players.find((q) => q.id === pid);
  if (!p || s.phase !== 'play') return null;
  const marks = s.drawn;
  for (let i = 0; i < p.cards.length; i++) if (missingBingo(p.cards[i]!, marks) === 0) return { k: 'bingo', card: i };
  if (!s.lineBy) for (let i = 0; i < p.cards.length; i++) if (hasLine(p.cards[i]!, marks)) return { k: 'line', card: i };
  return null;
}
