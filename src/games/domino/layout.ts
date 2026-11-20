import type { Placed } from './engine.ts';

/**
 * Trazado en serpiente de la cadena del dominó sobre una rejilla de celdas (una ficha = 2 celdas de largo × 1 de ancho).
 * La ficha inicial queda en el centro; el brazo derecho avanza a la derecha y baja con giros de 90° (ficha vertical en el
 * extremo), el izquierdo avanza a la izquierda y sube. Así 20 o más fichas siguen grandes y centradas.
 */
export interface Cell {
  /** Índice en la cadena (−1 = hueco libre al final de un brazo). */
  i: number;
  col: number; row: number;
  /** Tamaño en celdas. */
  w: number; h: number;
  vertical: boolean;
  /** Valores a mostrar: en horizontal (izq, der); en vertical (arriba, abajo). */
  va: number; vb: number;
  turn: boolean;
}
export interface Layout { cells: Cell[]; ghostL: Cell; ghostR: Cell; minCol: number; minRow: number; cols: number; rows: number; k: number }

type Heading = 'r' | 'l';

function walk(count: number, k: number, right: boolean, val: (idx: number) => { near: number; far: number }): Cell[] {
  const half = (k - 1) / 2;
  const out: Cell[] = [];
  const sgn = right ? 1 : -1;
  let heading: Heading = right ? 'r' : 'l';
  let row = 0;
  let c = right ? 2 : -1;
  let cap = half;
  for (let n = 0; n < count; n++) {
    const { near, far } = val(n);
    if (cap > 0) {
      const col = heading === 'r' ? c : c - 1;
      out.push({ i: n, col, row, w: 2, h: 1, vertical: false, va: heading === 'r' ? near : far, vb: heading === 'r' ? far : near, turn: false });
      c += heading === 'r' ? 2 : -2;
      cap--;
    } else {
      // giro de 90°: ficha vertical que ocupa la fila actual y la siguiente
      const top = sgn === 1 ? row : row - 1;
      out.push({ i: n, col: c, row: top, w: 1, h: 2, vertical: true, va: sgn === 1 ? near : far, vb: sgn === 1 ? far : near, turn: true });
      const turnCol = c;
      row += sgn;
      heading = heading === 'r' ? 'l' : 'r';
      c = heading === 'l' ? turnCol - 1 : turnCol + 1;
      cap = k;
    }
  }
  return out;
}

export function layoutChain(chain: readonly Placed[], head: number, k: number): Layout {
  const n = chain.length;
  const h = Math.min(Math.max(head, 0), Math.max(n - 1, 0));
  const rightCount = n ? n - 1 - h : 0;
  const leftCount = n ? h : 0;
  const R = walk(rightCount + 1, k, true, (j) => { const p = chain[h + 1 + j] ?? { a: 0, b: 0 }; return { near: p.a, far: p.b }; });
  const L = walk(leftCount + 1, k, false, (j) => { const p = chain[h - 1 - j] ?? { a: 0, b: 0 }; return { near: p.b, far: p.a }; });
  const cells: Cell[] = [];
  if (n) { const p = chain[h]!; cells.push({ i: h, col: 0, row: 0, w: 2, h: 1, vertical: false, va: p.a, vb: p.b, turn: false }); }
  R.slice(0, rightCount).forEach((c) => cells.push({ ...c, i: h + 1 + c.i }));
  L.slice(0, leftCount).forEach((c) => cells.push({ ...c, i: h - 1 - c.i }));
  const ghostR = { ...R[rightCount]!, i: -1 };
  const ghostL = { ...L[leftCount]!, i: -1 };
  let minCol = Infinity; let minRow = Infinity; let maxCol = -Infinity; let maxRow = -Infinity;
  for (const c of [...cells, ghostL, ghostR]) {
    minCol = Math.min(minCol, c.col); minRow = Math.min(minRow, c.row);
    maxCol = Math.max(maxCol, c.col + c.w); maxRow = Math.max(maxRow, c.row + c.h);
  }
  return { cells, ghostL, ghostR, minCol, minRow, cols: maxCol - minCol, rows: maxRow - minRow, k };
}

/** Elige la longitud de fila que permite el tamaño de celda mayor dentro de W×H. */
export function bestLayout(chain: readonly Placed[], head: number, W: number, H: number, maxCell = 64): { layout: Layout; cell: number } {
  let best: { layout: Layout; cell: number } | null = null;
  for (let k = 3; k <= 21; k += 2) {
    const layout = layoutChain(chain, head, k);
    const cell = Math.min(W / layout.cols, H / layout.rows, maxCell);
    if (!best || cell >= best.cell - 1e-6) best = { layout, cell };
  }
  return best!;
}
