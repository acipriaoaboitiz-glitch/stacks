import type { LucideIcon } from 'lucide-react';
import { Crown, Diamond, Flame, Layers, Sparkles, Spade, Swords, Zap } from 'lucide-react';

export type GameCategory = 'espanola' | 'francesa' | 'familiar';

export interface GameInfo {
  id: string;
  /** Nombre en español; la interfaz lo traduce con `g.<id>.name`. */
  name: string;
  tagline: string;
  category: GameCategory;
  deck: 'es' | 'fr' | 'uno';
  players: string;
  icon: LucideIcon;
  route: string;
  /** Todos los juegos del catálogo son jugables. */
  playable: true;
  accent: string;
  /** Degradado propio de la tarjeta. */
  tint: [string, string];
  rules: string[];
}

export const GAMES: GameInfo[] = [
  {
    id: 'mus', name: 'Mus', tagline: 'El rey de las mesas vascas', category: 'espanola', deck: 'es', players: '4 · 2 vs 2',
    icon: Crown, route: '/play/mus', playable: true, accent: '#f0c35f', tint: ['#3b2a08', '#0d1a12'],
    rules: [
      'Se juega por parejas (2 contra 2) con 40 cartas; los 3 cuentan como reyes y los 2 como ases (ocho reyes).',
      'Cada jugador recibe 4 cartas y puede pedir mus (descartar y recibir otras) hasta que alguien corte.',
      'Se apuesta en cuatro lances: Grande, Chica, Pares y Juego (o Punto si nadie tiene 31+).',
      '«Órdago» es apostar toda la partida a un solo lance. Gana la pareja que primero llegue a 40 piedras.',
    ],
  },
  {
    id: 'brisca', name: 'Brisca', tagline: 'Triunfo y arrastre', category: 'espanola', deck: 'es', players: '1v1 · 2v2',
    icon: Swords, route: '/play/brisca', playable: true, accent: '#e0605c', tint: ['#3a1212', '#0d1a12'],
    rules: [
      'Se reparten 3 cartas; la carta que queda al fondo del mazo marca el palo de triunfo.',
      'Se gana la baza con el triunfo más alto o, si no hay, con la carta más alta del palo de salida.',
      'Fuerza: As > 3 > Rey > Caballo > Sota > 7 > 6 > 5 > 4 > 2. Valores: As 11, Tres 10, Rey 4, Caballo 3, Sota 2 (120 en total).',
      'Tras cada baza se roba del mazo; con más de 60 puntos ganas.',
    ],
  },
  {
    id: 'escoba', name: 'Escoba', tagline: 'Suma 15 y barre la mesa', category: 'espanola', deck: 'es', players: '2–4 jugadores',
    icon: Sparkles, route: '/play/escoba', playable: true, accent: '#33b786', tint: ['#0d3a24', '#0d1a12'],
    rules: [
      'Valores: 1–7 su número, Sota 8, Caballo 9, Rey 10. Se reparten 3 cartas y 4 quedan en la mesa.',
      'Juegas una carta y te llevas cualquier grupo de cartas de la mesa con las que sume exactamente 15.',
      'Si te llevas todas las cartas de la mesa haces «escoba» y sumas 1 punto.',
      'Al final de la ronda: más cartas, más oros, el 7 de oros (el velo) y más sietes (1 punto cada uno).',
    ],
  },
  {
    id: 'chinchon', name: 'Chinchón', tagline: 'Escaleras, tríos y −10', category: 'espanola', deck: 'es', players: '2–4 jugadores',
    icon: Layers, route: '/play/chinchon', playable: true, accent: '#55d6be', tint: ['#0b3a35', '#0d1a12'],
    rules: [
      'Se reparten 7 cartas. En tu turno robas del mazo o del descarte y descartas una.',
      'Ligas cartas en tríos (mismo número) o escaleras (mismo palo seguidas, 3 o más).',
      'Cierras cuando las cartas sueltas suman 7 puntos o menos. Los demás se anotan sus sueltas.',
      'Cerrar con todo ligado (o Chinchón: 7 cartas seguidas del mismo palo) resta 10. Quien llega a 100 queda eliminado.',
    ],
  },
  {
    id: 'tute', name: 'Tute', tagline: 'Cantes de las 20 y las 40', category: 'espanola', deck: 'es', players: '2 o 4 jugadores',
    icon: Flame, route: '/play/tute', playable: true, accent: '#f29e6b', tint: ['#3d2108', '#0d1a12'],
    rules: [
      'Se reparten 8 cartas; la última del mazo es el triunfo. Hay que asistir al palo, montar y, si no tienes, fallar con triunfo.',
      'Fuerza y valores como en la Brisca (120 puntos) y +10 por la última baza.',
      'Tras ganar una baza puedes cantar «las 20» (Rey y Caballo del mismo palo) o «las 40» (si es el palo de triunfo).',
      'Cuatro reyes o cuatro caballos en la mano son «Tute» y ganan la partida.',
    ],
  },
  {
    id: 'blackjack', name: 'Blackjack 21', tagline: 'Pide, plántate, dobla o divide', category: 'francesa', deck: 'fr', players: 'vs Crupier',
    icon: Spade, route: '/play/blackjack', playable: true, accent: '#f0c35f', tint: ['#3a2f08', '#0d1a12'],
    rules: [
      'Acércate a 21 sin pasarte. Figuras valen 10, el As 1 u 11, el resto su número.',
      'Blackjack (As + 10 en las dos primeras cartas) paga 3 a 2; ganar paga 1 a 1; empate devuelve la apuesta.',
      'Puedes doblar con tus dos primeras cartas y dividir si son del mismo valor.',
      'El crupier pide hasta 17 y se planta con todos los 17 (también con 17 blando).',
    ],
  },
  {
    id: 'poker', name: 'Texas Hold’em', tagline: 'Ciegas, flop, turn y river', category: 'francesa', deck: 'fr', players: 'Mesa de 4',
    icon: Diamond, route: '/play/poker', playable: true, accent: '#e0605c', tint: ['#3d1212', '#0d1a12'],
    rules: [
      'Cada jugador recibe 2 cartas privadas y se juegan 5 comunitarias (flop, turn y river), con ciegas de 10 y 20.',
      'En cada ronda de apuestas puedes pasar, igualar, subir o retirarte.',
      'Gana la mejor mano de cinco cartas entre tus dos y las cinco de la mesa.',
      'Orden: Carta alta < Pareja < Doble pareja < Trío < Escalera < Color < Full < Póker < Escalera de color.',
    ],
  },
  {
    id: 'uno', name: 'Uno', tagline: 'Vacía tu mano el primero', category: 'familiar', deck: 'uno', players: '2–4 jugadores',
    icon: Zap, route: '/play/uno', playable: true, accent: '#f87171', tint: ['#3a1210', '#0d1a12'],
    rules: [
      'Baraja de 108 cartas en cuatro colores: números 0–9, «Salta», «Cambio de sentido», «+2», comodines y «+4».',
      'Se reparten 7 cartas. En tu turno juegas una carta del mismo color, número o símbolo que la de arriba.',
      '«Salta» quita el turno al siguiente, «+2» y «+4» le hacen robar y perder el turno, y el sentido se invierte con «Cambio».',
      'El comodín elige color; el «+4» solo se puede jugar si no tienes cartas del color en juego. Sin jugada, robas una.',
      'Gana quien se queda sin cartas. Al quedarte con una, se canta «¡UNO!».',
    ],
  },
];

export const findGame = (id: string): GameInfo | undefined => GAMES.find((g) => g.id === id);
export const gamesOf = (c: GameCategory): GameInfo[] => GAMES.filter((g) => g.category === c);
