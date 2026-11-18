import type { LucideIcon } from 'lucide-react';
import { CircleDot, Grid3x3, LayoutGrid, Ship, Columns2, Crown, Diamond, Dices, Flame, Hash, Landmark, Layers, Sparkles, Spade, Swords, Zap } from 'lucide-react';

/** Secciones del lobby: Baraja Española · Casino & Cartas · Duelos & Mesa. */
export type GameCategory = 'espanola' | 'casino' | 'duelos';

export interface GameInfo {
  id: string;
  /** Nombre en español; la interfaz lo traduce con `g.<id>.name`. */
  name: string;
  tagline: string;
  category: GameCategory;
  /** 'none' = juegos de mesa sin baraja (dominó, dados, ruleta). */
  deck: 'es' | 'fr' | 'uno' | 'none';
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
      '«Órdago» es apostar toda la partida a un solo lance. Gana el chico la pareja que primero llegue a 40 piedras; quien gane 2 chicos gana la partida.',
    ],
  },
  {
    id: 'brisca', name: 'Brisca', tagline: 'Triunfo y arrastre', category: 'espanola', deck: 'es', players: '1v1 · 2v2',
    icon: Swords, route: '/play/brisca', playable: true, accent: '#e0605c', tint: ['#3a1212', '#0d1a12'],
    rules: [
      'Se reparten 3 cartas; la carta que queda al fondo del mazo marca el palo de triunfo.',
      'Se gana la baza con el triunfo más alto o, si no hay, con la carta más alta del palo de salida.',
      'Fuerza: As > 3 > Rey > Caballo > Sota > 7 > 6 > 5 > 4 > 2. Valores: As 11, Tres 10, Rey 4, Caballo 3, Sota 2 (120 en total).',
      'Tras cada baza se roba del mazo. Al acabar las cartas, quien tenga más puntos gana la ronda; gana la partida quien gane 2 rondas (al mejor de 3).',
    ],
  },
  {
    id: 'escoba', name: 'Escoba', tagline: 'Suma 15 y barre la mesa', category: 'espanola', deck: 'es', players: '2–4 jugadores',
    icon: Sparkles, route: '/play/escoba', playable: true, accent: '#33b786', tint: ['#0d3a24', '#0d1a12'],
    rules: [
      'Valores: 1–7 su número, Sota 8, Caballo 9, Rey 10. Se reparten 3 cartas y 4 quedan en la mesa.',
      'Juegas una carta y te llevas cualquier grupo de cartas de la mesa con las que sume exactamente 15.',
      'Si te llevas todas las cartas de la mesa haces «escoba» y sumas 1 punto.',
      'Al final de la ronda: más cartas, más oros, el 7 de oros (el velo), el setenta (mejor carta de cada palo: 7 = 21, 6 = 18, As = 16, 5 = 15…) y cada escoba (1 punto cada uno). Se juega a 15 puntos o al mejor de 3 rondas.',
    ],
  },
  {
    id: 'chinchon', name: 'Chinchón', tagline: 'Escaleras, tríos y −10', category: 'espanola', deck: 'es', players: '2–4 jugadores',
    icon: Layers, route: '/play/chinchon', playable: true, accent: '#55d6be', tint: ['#0b3a35', '#0d1a12'],
    rules: [
      'Se reparten 7 cartas. En tu turno robas del mazo o del descarte y descartas una.',
      'Ligas cartas en tríos (mismo número) o escaleras (mismo palo seguidas, 3 o más).',
      'Cierras cuando las cartas sueltas suman 7 puntos o menos. Los demás se anotan sus sueltas.',
      'Quien cierra gana la ronda y resta 10 puntos (25 con Chinchón: 7 cartas seguidas del mismo palo). Quien llega a 100 queda eliminado.',
    ],
  },
  {
    id: 'tute', name: 'Tute', tagline: 'Cantes de las 20 y las 40', category: 'espanola', deck: 'es', players: '2 o 4 jugadores',
    icon: Flame, route: '/play/tute', playable: true, accent: '#f29e6b', tint: ['#3d2108', '#0d1a12'],
    rules: [
      'Se reparten 8 cartas; la última del mazo es el triunfo. Hay que asistir al palo, montar y, si no tienes, fallar con triunfo.',
      'Fuerza y valores como en la Brisca (120 puntos) y +10 por la última baza.',
      'Tras ganar una baza puedes cantar «las 20» (Rey y Caballo del mismo palo) o «las 40» (si es el palo de triunfo).',
      'Cuatro reyes o cuatro caballos en la mano son «Tute» y ganan la ronda. Gana la partida quien gane 2 rondas (al mejor de 3).',
    ],
  },
  {
    id: 'blackjack', name: 'Blackjack 21', tagline: 'Pide, plántate, dobla o divide', category: 'casino', deck: 'fr', players: 'vs Crupier',
    icon: Spade, route: '/play/blackjack', playable: true, accent: '#f0c35f', tint: ['#3a2f08', '#0d1a12'],
    rules: [
      'Acércate a 21 sin pasarte. Figuras valen 10, el As 1 u 11, el resto su número.',
      'Blackjack (As + 10 en las dos primeras cartas) paga 3 a 2; ganar paga 1 a 1; empate devuelve la apuesta.',
      'Puedes doblar con tus dos primeras cartas y dividir si son del mismo valor.',
      'El crupier pide hasta 17 y se planta con todos los 17 (también con 17 blando).',
    ],
  },
  {
    id: 'poker', name: 'Póker', tagline: 'Ciegas, flop, turn y river', category: 'casino', deck: 'fr', players: 'Mesa de 4',
    icon: Diamond, route: '/play/poker', playable: true, accent: '#e0605c', tint: ['#3d1212', '#0d1a12'],
    rules: [
      'Cada jugador recibe 2 cartas privadas y se juegan 5 comunitarias (flop, turn y river), con ciegas de 10 y 20.',
      'En cada ronda de apuestas puedes pasar, igualar, subir o retirarte.',
      'Gana la mejor mano de cinco cartas entre tus dos y las cinco de la mesa.',
      'Orden: Carta alta < Pareja < Doble pareja < Trío < Escalera < Color < Full < Póker < Escalera de color.',
    ],
  },
  {
    id: 'uno', name: 'Uno', tagline: 'Vacía tu mano el primero', category: 'casino', deck: 'uno', players: '2–4 jugadores',
    icon: Zap, route: '/play/uno', playable: true, accent: '#f87171', tint: ['#3a1210', '#0d1a12'],
    rules: [
      'Baraja de 108 cartas en cuatro colores: números 0–9, «Salta», «Cambio de sentido», «+2», comodines y «+4».',
      'Se reparten 7 cartas. En tu turno juegas una carta del mismo color, número o símbolo que la de arriba.',
      '«Salta» quita el turno al siguiente, «+2» y «+4» le hacen robar y perder el turno, y el sentido se invierte con «Cambio».',
      'El comodín elige color; el «+4» solo se puede jugar si no tienes cartas del color en juego. Sin jugada, robas una.',
      'Gana la ronda quien se queda sin cartas; al quedarte con una, se canta «¡UNO!». Gana la partida quien gane 2 rondas (al mejor de 3).',
    ],
  },
  {
    id: 'presidente', name: 'COME💩', tagline: 'De mendigo a rey de la mesa', category: 'espanola', deck: 'es', players: '4 jugadores',
    icon: Landmark, route: '/play/comemierda', playable: true, accent: '#d4af37', tint: ['#2e2608', '#0d1a12'],
    rules: [
      'Baraja española de 40 cartas repartida entre 4 jugadores (10 cada uno). Jerarquía de mayor a menor: 2 > As > Rey > Caballo > Sota > 7 > 6 > 5 > 4 > 3.',
      'Primera ronda: empieza obligado quien tenga el 3 de oros y sale soltando ese 3 (solo, o junto a todos los demás treses que tenga: pareja, trío o póker). Se juega siempre una carta, una pareja, un trío o un póker del mismo valor.',
      'El siguiente jugador debe superar el valor con la misma cantidad de cartas, o pasar. Un 2 corta la mesa al instante: se limpia el centro y vuelve a salir quien lo tiró.',
      'Si todos pasan o alguien corta con un 2, se limpia la mesa y vuelve a salir quien ganó la baza.',
      'Según el orden en que te quedas sin cartas: 1º Rey, 2º, 3º y 4º COME💩. En la ronda siguiente COME💩 entrega sus 2 mejores cartas al Rey, y el Rey le da sus 2 peores. Después sale COME💩, con libertad para tirar cualquier carta o combinación. La serie dura 3 rondas.',
    ],
  },
  {
    id: 'seises', name: 'Los Seises', tagline: 'Escaleras al corte por palos', category: 'espanola', deck: 'es', players: '2–4 jugadores',
    icon: Hash, route: '/play/seises', playable: true, accent: '#e6b94d', tint: ['#33280a', '#0d1a12'],
    rules: [
      'Baraja española de 40 cartas repartida entre todos los jugadores. Empieza quien tiene el 6 de oros y lo coloca en la mesa.',
      'En tu turno colocas otro 6 (abre un palo) o la carta inmediatamente superior o inferior de un palo ya abierto: 5 o 7 sobre el 6, y así hasta el As y el Rey (tras el 7 va la Sota).',
      'Si no tienes ninguna jugada, pasas. Solo puedes pasar si de verdad no puedes colocar nada.',
      'Quien se queda sin cartas gana la ronda y resta 10 puntos. Los demás suman sus cartas: As 1, del 2 al 7 su valor, Sota 10, Caballo 11 y Rey 12.',
      'Cuando alguien llega a 150 puntos acaba la partida y gana quien menos puntos tiene.',
    ],
  },
  {
    id: 'domino', name: 'Dominó', tagline: 'Marfil, doble seis y cierre', category: 'duelos', deck: 'none', players: '1v1 · 2v2',
    icon: Columns2, route: '/play/domino', playable: true, accent: '#f1e7c6', tint: ['#2d2a1c', '#0d1a12'],
    rules: [
      'Se juega con 28 fichas (del doble blanco al doble seis). Cada jugador recibe 7 fichas; en 1v1 las 14 restantes forman el pozo, y en 2v2 se juega por parejas.',
      'Abre la ronda quien tenga el doble más alto (el 6-6). Después, en tu turno colocas una ficha cuyo número coincida con uno de los dos extremos de la cadena. Toca la ficha y, si encaja por los dos lados, elige Izquierda o Derecha.',
      'Si no puedes jugar, en 1v1 robas del pozo hasta tener una ficha jugable; si el pozo está vacío (o en 2v2), pasas.',
      '¡DOMINÓ! gana quien se queda sin fichas; ¡CIERRE! si nadie puede mover, gana quien menos puntos tenga en la mano. El ganador suma los puntos de las fichas rivales. Gana la partida quien gane 2 rondas (al mejor de 3).',
    ],
  },
  {
    id: 'mentiroso', name: 'El Mentiroso', tagline: 'Dados, faroles y cubiletes', category: 'duelos', deck: 'none', players: '2–4 jugadores',
    icon: Dices, route: '/play/mentiroso', playable: true, accent: '#d4af37', tint: ['#2a1d0a', '#0d1a12'],
    rules: [
      'Cada jugador tiene 5 dados bajo su cubilete. Toca tu cubilete para levantarlo y ver tus dados en secreto.',
      'En tu turno subes la apuesta sobre cuántos dados de una cara hay en TODA la mesa («cuatro 5s»): más cantidad, o la misma cantidad con una cara mayor.',
      'O cantas «¡MENTIROSO!» si crees que la apuesta anterior es mentira: se destapan todos los cubiletes y se cuentan los dados. Si hay menos de los apostados pierde un dado quien apostó; si hay igual o más, lo pierdes tú.',
      '«¡EXACTO!» (si hay justo los dados apostados recuperas uno; si no, pierdes uno). Quien pierde el duelo empieza la ronda siguiente. Gana el último jugador con dados.',
    ],
  },
  {
    id: 'ruleta', name: 'Ruleta VIP', tagline: 'Pleno, docenas y golpe de suerte', category: 'casino', deck: 'none', players: 'Mesa compartida',
    icon: CircleDot, route: '/play/ruleta', playable: true, accent: '#c0213a', tint: ['#3a0f18', '#0d1a12'],
    rules: [
      'Ruleta europea con 37 casillas (0–36). Elige una ficha de 10, 50, 100 o 500 y toca el tablero para apostar; puedes repartir varias apuestas.',
      'Pleno a un número paga ×36 (35 a 1). Docena (1–12, 13–24, 25–36) paga ×3. Rojo/Negro y Par/Impar pagan ×2. El 0 solo paga al pleno.',
      'Pulsa «Girar Ruleta»: la rueda y la bola frenan hasta que la bola cae en una casilla y se cobran las apuestas ganadoras.',
      'Deshacer quita la última ficha, Borrar retira todas y Repetir vuelve a colocar las apuestas de la jugada anterior. Fichas virtuales, nunca dinero real.',
    ],
  },
  {
    id: 'tres', name: '3 en Raya', tagline: 'Serie al mejor de 3', category: 'duelos', deck: 'none', players: '1v1',
    icon: Grid3x3, route: '/play/tres', playable: true, accent: '#d4af37', tint: ['#2b1d0f', '#0d1a12'],
    rules: [
      'Tablero de 3×3. Uno juega con la X (oro) y el otro con la O (marfil); se turnan para colocar una ficha en una casilla libre.',
      'Gana la ronda quien alinee tres fichas propias en horizontal, vertical o diagonal. Un rayo dorado marca la línea ganadora.',
      'Si se llena el tablero sin línea hay tablas y la ronda no puntúa. Cada ronda abre uno distinto.',
      'Gana la partida quien gane 2 rondas (al mejor de 3).',
    ],
  },
  {
    id: 'cuatro', name: '4 en Raya', tagline: 'Deja caer, conecta cuatro', category: 'duelos', deck: 'none', players: '1v1',
    icon: LayoutGrid, route: '/play/cuatro', playable: true, accent: '#e23a52', tint: ['#2a1016', '#0d1a12'],
    rules: [
      'Tablero vertical de 7 columnas por 6 filas. Toca una columna para soltar tu ficha (oro o rubí): cae hasta la casilla libre más baja.',
      'Gana la ronda quien conecte cuatro fichas propias seguidas en horizontal, vertical o diagonal. Las cuatro se iluminan con un halo dorado.',
      'Si se llena el tablero sin conexión hay tablas. Cada ronda abre uno distinto.',
      'Gana la partida quien gane 2 rondas (al mejor de 3).',
    ],
  },
  {
    id: 'flota', name: 'Hundir la Flota', tagline: 'Radar 7×7, duelo rápido', category: 'duelos', deck: 'none', players: '1v1',
    icon: Ship, route: '/play/flota', playable: true, accent: '#34d399', tint: ['#08291f', '#0d1a12'],
    rules: [
      'Cada jugador tiene 4 barcos de 4, 3, 2 y 2 casillas en un tablero de 7×7. Pulsa «Aleatorio» para recolocar tu flota y «Listo» cuando te guste.',
      'En tu turno toca una casilla del radar rival para disparar. Una onda azul indica agua y un destello oro y carmesí indica tocado.',
      'Si tocas un barco repites disparo; si fallas, pasa el turno. Un barco con todas sus casillas tocadas queda hundido.',
      'Gana quien hunda primero toda la flota rival. Partidas de 2 a 3 minutos.',
    ],
  },
];

export const findGame = (id: string): GameInfo | undefined => GAMES.find((g) => g.id === id);
export const gamesOf = (c: GameCategory): GameInfo[] => GAMES.filter((g) => g.category === c);
