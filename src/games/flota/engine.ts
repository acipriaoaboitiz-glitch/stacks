import type { DuelPlayer } from '../shared/duel.ts';
import type { ShipKind } from '../shared/art.tsx';

/**
 * Hundir la Flota PRO: tablero 8×8 (10×10 en nivel Experto) con cinco barcos (Portaaviones 4, Acorazado 3, Submarino 3,
 * Destructor 2 y Patrullera 2). Fase de despliegue (mover y girar tocando) y combate por radar. Tocar un barco permite repetir disparo.
 */
export type { ShipKind };
export const FLEET: { kind: ShipKind; len: number }[] = [
  { kind: 'carrier', len: 4 }, { kind: 'battleship', len: 3 }, { kind: 'submarine', len: 3 }, { kind: 'destroyer', len: 2 }, { kind: 'patrol', len: 2 },
];
export const sizeFor = (mode: string): number => (mode === 'expert' ? 10 : 8);
export type Side = 0 | 1;
export type Shot = 'water' | 'hit';
export interface Ship { kind: ShipKind; cells: number[] }
export interface FState {
  players: DuelPlayer[];
  /** Lado del tablero (8 o 10). */
  n: number;
  /** Flota de cada plaza (índice = plaza). */
  fleets: [Ship[], Ship[]];
  /** Disparos recibidos por el tablero de cada plaza. */
  shots: [Record<number, Shot>, Record<number, Shot>];
  ready: [boolean, boolean];
  phase: 'place' | 'battle' | 'over';
  turn: Side;
  winner: Side | null;
  round: number;
  /** Último disparo (para la onda de radar): quién disparó, a qué casilla y con qué resultado. */
  last: { by: Side; cell: number; res: 'water' | 'hit' | 'sunk' } | null;
  seq: number;
  /** Nivel de la IA (easy dispara al azar). */
  level: string;
}

export const isHoriz = (ship: Ship): boolean => ship.cells.length < 2 || ship.cells[1]! - ship.cells[0]! === 1;
export const coord = (cell: number, n: number): string => `${'ABCDEFGHIJ'[cell % n]}${Math.floor(cell / n) + 1}`;

/** Casillas de un barco de `len` con proa en `anchor` (se ajusta para no salirse del tablero). */
export function shipCells(n: number, len: number, anchor: number, horiz: boolean): number[] {
  let r = Math.floor(anchor / n); let c = anchor % n;
  if (horiz) c = Math.min(c, n - len); else r = Math.min(r, n - len);
  return Array.from({ length: len }, (_, i) => (horiz ? r * n + c + i : (r + i) * n + c));
}

/** ¿Puede ocupar el barco `i` estas casillas (recta, dentro del tablero y sin pisar otro barco)? */
export function validPlacement(fleet: Ship[], i: number, cells: number[], n: number): boolean {
  const ship = fleet[i];
  if (!ship || cells.length !== ship.cells.length) return false;
  if (cells.some((c) => !Number.isInteger(c) || c < 0 || c >= n * n)) return false;
  const horiz = cells.length < 2 || cells[1]! - cells[0]! === 1;
  const step = horiz ? 1 : n;
  for (let k = 1; k < cells.length; k++) if (cells[k]! - cells[k - 1]! !== step) return false;
  if (horiz && Math.floor(cells[0]! / n) !== Math.floor(cells[cells.length - 1]! / n)) return false;
  return !fleet.some((o, j) => j !== i && o.cells.some((c) => cells.includes(c)));
}

/** Flota aleatoria sin solapes. */
export function randomFleet(n: number): Ship[] {
  for (let tries = 0; tries < 300; tries++) {
    const used = new Set<number>();
    const fleet: Ship[] = [];
    let ok = true;
    for (const { kind, len } of FLEET) {
      let placed = false;
      for (let k = 0; k < 80 && !placed; k++) {
        const horiz = Math.random() < 0.5;
        const r = Math.floor(Math.random() * (horiz ? n : n - len + 1));
        const c = Math.floor(Math.random() * (horiz ? n - len + 1 : n));
        const cells = Array.from({ length: len }, (_, i) => (horiz ? r * n + c + i : (r + i) * n + c));
        if (cells.some((x) => used.has(x))) continue;
        cells.forEach((x) => used.add(x));
        fleet.push({ kind, cells });
        placed = true;
      }
      if (!placed) { ok = false; break; }
    }
    if (ok) return fleet;
  }
  return FLEET.map(({ kind, len }, i) => ({ kind, cells: Array.from({ length: len }, (_, k) => i * n + k) }));
}

export function newFlota(players: DuelPlayer[], round = 1, n = 8, level = 'normal'): FState {
  return {
    players, n, fleets: [randomFleet(n), randomFleet(n)], shots: [{}, {}], ready: [false, !players[1]!.human], phase: 'place',
    turn: ((round - 1) % 2) as Side, winner: null, round, last: null, seq: 0, level,
  };
}

export const shipAt = (fleet: Ship[], cell: number): Ship | undefined => fleet.find((s) => s.cells.includes(cell));
export const isSunk = (ship: Ship, shots: Record<number, Shot>): boolean => ship.cells.every((c) => shots[c] === 'hit');
export const shipsLeft = (fleet: Ship[], shots: Record<number, Shot>): number => fleet.filter((s) => !isSunk(s, shots)).length;

export type FAction = { k: 'random' } | { k: 'ready' } | { k: 'place'; i: number; cells: number[] } | { k: 'fire'; cell: number };

export function applyFlota(prev: FState, pid: string, a: FAction): FState | null {
  const idx = prev.players.findIndex((p) => p.id === pid) as Side | -1;
  if (idx === -1) return null;
  if (a.k === 'random') {
    if (prev.phase !== 'place' || prev.ready[idx]) return null;
    const fleets: [Ship[], Ship[]] = [prev.fleets[0], prev.fleets[1]];
    fleets[idx] = randomFleet(prev.n);
    return { ...prev, fleets };
  }
  if (a.k === 'place') {
    if (prev.phase !== 'place' || prev.ready[idx] || !validPlacement(prev.fleets[idx], a.i, a.cells, prev.n)) return null;
    const fleets: [Ship[], Ship[]] = [prev.fleets[0], prev.fleets[1]];
    fleets[idx] = fleets[idx].map((sh, j) => (j === a.i ? { kind: sh.kind, cells: [...a.cells] } : sh));
    return { ...prev, fleets };
  }
  if (a.k === 'ready') {
    if (prev.phase !== 'place' || prev.ready[idx]) return null;
    const ready: [boolean, boolean] = [prev.ready[0], prev.ready[1]];
    ready[idx] = true;
    return { ...prev, ready, phase: ready[0] && ready[1] ? 'battle' : 'place' };
  }
  const foe = (1 - idx) as Side;
  if (prev.phase !== 'battle' || prev.turn !== idx || a.cell < 0 || a.cell >= prev.n * prev.n || prev.shots[foe][a.cell]) return null;
  const ship = shipAt(prev.fleets[foe], a.cell);
  const shots: [Record<number, Shot>, Record<number, Shot>] = [{ ...prev.shots[0] }, { ...prev.shots[1] }];
  shots[foe][a.cell] = ship ? 'hit' : 'water';
  const sunk = ship ? isSunk(ship, shots[foe]) : false;
  const won = shipsLeft(prev.fleets[foe], shots[foe]) === 0;
  return {
    ...prev, shots, seq: prev.seq + 1, last: { by: idx, cell: a.cell, res: sunk ? 'sunk' : ship ? 'hit' : 'water' },
    turn: ship ? idx : foe, phase: won ? 'over' : 'battle', winner: won ? idx : null,
  };
}

/** IA: si hay un barco tocado sin hundir, dispara a su alrededor; si no, busca en tablero de ajedrez. En «easy» dispara al azar. */
export function botFire(s: FState, me: Side): number {
  const n = s.n;
  const foe = (1 - me) as Side;
  const shots = s.shots[foe];
  const open = (c: number): boolean => c >= 0 && c < n * n && !shots[c];
  const all = Array.from({ length: n * n }, (_, i) => i).filter(open);
  if (s.level === 'easy') return all[Math.floor(Math.random() * all.length)]!;
  const hot = s.fleets[foe].filter((sh) => !isSunk(sh, shots)).flatMap((sh) => sh.cells.filter((c) => shots[c] === 'hit'));
  if (hot.length) {
    const cands: number[] = [];
    for (const h of hot) {
      const r = Math.floor(h / n); const c = h % n;
      const around = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([rr, cc]) => rr! >= 0 && rr! < n && cc! >= 0 && cc! < n).map(([rr, cc]) => rr! * n + cc!);
      for (const x of around) if (open(x)) cands.push(x);
    }
    // prioriza prolongar una línea de dos o más impactos
    const aligned = cands.filter((x) => hot.some((h) => hot.some((o) => o !== h && ((Math.floor(o / n) === Math.floor(h / n) && Math.floor(x / n) === Math.floor(h / n)) || (o % n === h % n && x % n === h % n)))));
    const pool = aligned.length ? aligned : cands;
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)]!;
  }
  const parity = all.filter((c) => (Math.floor(c / n) + (c % n)) % 2 === 0);
  const pool = parity.length ? parity : all;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
