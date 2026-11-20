/**
 * Ritmo propio de cada juego: segundos de turno del jugador (`<TurnTimerBar />`) y cadencia de la IA (ms, mínimo–máximo).
 * Los juegos individuales (Solitario, Mahjong, 2048, Sudoku, Buscaminas) no tienen cuenta atrás: usan cronómetro ascendente.
 */
export interface Pacing { turn: number; aiMin: number; aiMax: number; /** Pausa de lectura al completar una baza o revelar cartas (ms). */ read: number }

const AGIL: Pacing = { turn: 14, aiMin: 650, aiMax: 850, read: 450 };
const CLASICO: Pacing = { turn: 20, aiMin: 950, aiMax: 1250, read: 650 };
const TACTICO: Pacing = { turn: 30, aiMin: 1400, aiMax: 1900, read: 900 };
const PROFUNDO: Pacing = { turn: 45, aiMin: 1000, aiMax: 1000, read: 500 };
const DEFAULT: Pacing = { turn: 15, aiMin: 750, aiMax: 900, read: 500 };

export const GAME_PACING_CONFIG: Record<string, Pacing> = {
  uno: AGIL, presidente: AGIL, tres: AGIL, cuatro: AGIL,
  brisca: CLASICO, escoba: CLASICO, tute: CLASICO, domino: CLASICO, flota: CLASICO, mentiroso: CLASICO,
  poker: TACTICO, mus: TACTICO, blackjack: TACTICO, chinchon: TACTICO, parchis: TACTICO,
  ajedrez: PROFUNDO, damas: PROFUNDO,
};

let active: Pacing = DEFAULT;
export const pacingFor = (gameId: string): Pacing => GAME_PACING_CONFIG[gameId] ?? DEFAULT;
/** La mesa abierta fija el ritmo; `botDelay()` y la barra de turno lo leen. */
export const setActivePacing = (gameId: string | null): void => { active = gameId ? pacingFor(gameId) : DEFAULT; };
export const getPacing = (): Pacing => active;
