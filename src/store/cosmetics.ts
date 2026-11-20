import { useSyncExternalStore } from 'react';
import { setSettings, getSettings, type ThemeId } from './settings.ts';
import { wallet } from './wallet.ts';
import { getProfile, saveProfile } from './profile.ts';

/**
 * Tienda «Club VIP»: dorsos, tapetes, marcos, avatares, efectos de victoria, títulos, reacciones y juegos de fichas y dados.
 * Se compran con fichas virtuales (nunca dinero real) y lo equipado se aplica de verdad en las mesas, el perfil y las salas online.
 */
export type BackId = 'esmeralda' | 'oro' | 'rubi' | 'zafiro' | 'obsidiana' | 'marmol' | 'purpura' | 'lauburu' | 'carbono' | 'montecarlo' | 'neon' | 'eguzkilore' | 'dragon';
export type BackVariant = 'emerald' | 'gold' | 'crimson' | 'midnight' | 'obsidian' | 'marble' | 'purple' | 'lauburu' | 'carbon' | 'montecarlo' | 'neon' | 'eguzkilore' | 'dragon';
export type FrameId = 'aro' | 'corona' | 'llama' | 'diamante' | 'escudo' | 'dragon' | 'as' | 'rey' | 'hielo' | 'laurel' | 'fuegoesm' | 'relampago' | 'galaxia';
export type SetId = 'clasico' | 'lingote' | 'ebano' | 'cristal';
export type AvatarId = 'as_picas' | 'rey_oros' | 'tiburon' | 'lobo' | 'eguzkilore' | 'dragon_imp' | 'corona';
export type VictoryId = 'destello' | 'monedas' | 'fuegos' | 'relampago' | 'cartas' | 'explosion';
export type TitleId = 'intocable' | 'reymus' | 'mentefria' | 'cazador' | 'cinquillo' | 'donordago';
export type ReactionId = 'saca' | 'niconesas' | 'repaso' | 'locura' | 'allin' | 'jugada';

export type Rarity = 'comun' | 'raro' | 'epico' | 'legendario';
export type Kind = 'backs' | 'mats' | 'frames' | 'avatars' | 'wins' | 'titles' | 'reacts' | 'sets';
export const RARITY_NAME: Record<Rarity, string> = { comun: 'Común', raro: 'Raro', epico: 'Épico', legendario: 'Legendario' };
export const RARITY_ORDER: Record<Rarity, number> = { comun: 0, raro: 1, epico: 2, legendario: 3 };

interface Base<I extends string> { id: I; name: string; price: number; rarity: Rarity }

export const BACKS: (Base<BackId> & { variant: BackVariant })[] = [
  { id: 'esmeralda', name: 'Clásico Esmeralda', price: 0, variant: 'emerald', rarity: 'comun' },
  { id: 'rubi', name: 'Rubí Real', price: 1200, variant: 'crimson', rarity: 'comun' },
  { id: 'zafiro', name: 'Zafiro Nocturno', price: 1200, variant: 'midnight', rarity: 'comun' },
  { id: 'oro', name: 'Oro Imperial', price: 1500, variant: 'gold', rarity: 'raro' },
  { id: 'purpura', name: 'Púrpura Real', price: 1600, variant: 'purple', rarity: 'raro' },
  { id: 'obsidiana', name: 'Obsidiana Dragón', price: 1800, variant: 'obsidian', rarity: 'raro' },
  { id: 'carbono', name: 'Fibra de Carbono', price: 2000, variant: 'carbon', rarity: 'raro' },
  { id: 'montecarlo', name: 'Noche de Montecarlo', price: 2400, variant: 'montecarlo', rarity: 'raro' },
  { id: 'marmol', name: 'Mármol & Oro', price: 2200, variant: 'marble', rarity: 'epico' },
  { id: 'lauburu', name: 'Lauburu Dorado', price: 2500, variant: 'lauburu', rarity: 'epico' },
  { id: 'neon', name: 'Neón Esmeralda', price: 3600, variant: 'neon', rarity: 'epico' },
  { id: 'eguzkilore', name: 'Eguzkilore de Oro', price: 4200, variant: 'eguzkilore', rarity: 'epico' },
  { id: 'dragon', name: 'Dragón Imperial', price: 7000, variant: 'dragon', rarity: 'legendario' },
];
/** Tapetes de la tienda (los demás de Ajustes siguen siendo gratuitos). */
export const TAPETES: Base<ThemeId>[] = [
  { id: 'esmeralda', name: 'Esmeralda Club', price: 0, rarity: 'comun' },
  { id: 'burdeos', name: 'Burdeos Casino', price: 1500, rarity: 'comun' },
  { id: 'cuero', name: 'Cuero Coñac', price: 1600, rarity: 'comun' },
  { id: 'azul', name: 'Azul Montecarlo', price: 1800, rarity: 'raro' },
  { id: 'obsidiana', name: 'Obsidiana VIP', price: 2000, rarity: 'raro' },
  { id: 'pizarra', name: 'Pizarra Imperial', price: 2200, rarity: 'raro' },
  { id: 'montecarlo', name: 'Montecarlo Clásico', price: 2600, rarity: 'raro' },
  { id: 'txoko', name: 'Madera de Txoko', price: 2800, rarity: 'raro' },
  { id: 'terciopelo', name: 'Terciopelo Púrpura', price: 3800, rarity: 'epico' },
  { id: 'estrellada', name: 'Noche Estrellada', price: 4000, rarity: 'epico' },
  { id: 'arena', name: 'Arena Dorada VIP', price: 7000, rarity: 'legendario' },
];
export const FRAMES: Base<FrameId>[] = [
  { id: 'aro', name: 'Aro Esmeralda', price: 0, rarity: 'comun' },
  { id: 'escudo', name: 'Escudo Dorado', price: 1200, rarity: 'comun' },
  { id: 'llama', name: 'Llama del Órdago', price: 1500, rarity: 'comun' },
  { id: 'as', name: 'As de Oros', price: 1800, rarity: 'raro' },
  { id: 'corona', name: 'Corona Imperial', price: 2000, rarity: 'raro' },
  { id: 'hielo', name: 'Hielo Ártico', price: 2600, rarity: 'raro' },
  { id: 'laurel', name: 'Laurel de Campeón', price: 2800, rarity: 'raro' },
  { id: 'dragon', name: 'Dragón Jade', price: 2500, rarity: 'epico' },
  { id: 'diamante', name: 'Diamante VIP', price: 3000, rarity: 'epico' },
  { id: 'fuegoesm', name: 'Fuego Esmeralda', price: 4000, rarity: 'epico' },
  { id: 'relampago', name: 'Relámpago Dorado', price: 4200, rarity: 'epico' },
  { id: 'rey', name: 'Rey del Tablero', price: 3500, rarity: 'legendario' },
  { id: 'galaxia', name: 'Galaxia VIP', price: 7500, rarity: 'legendario' },
];
export const SETS: Base<SetId>[] = [
  { id: 'clasico', name: 'Casino Clásico', price: 0, rarity: 'comun' },
  { id: 'ebano', name: 'Ébano & Marfil', price: 1800, rarity: 'raro' },
  { id: 'lingote', name: 'Lingote de Oro', price: 2000, rarity: 'raro' },
  { id: 'cristal', name: 'Cristal Esmeralda', price: 2600, rarity: 'epico' },
];
export const AVATAR_ITEMS: Base<AvatarId>[] = [
  { id: 'as_picas', name: 'As de Picas', price: 600, rarity: 'comun' },
  { id: 'rey_oros', name: 'Rey de Oros', price: 1800, rarity: 'raro' },
  { id: 'tiburon', name: 'Tiburón del Tapete', price: 2000, rarity: 'raro' },
  { id: 'lobo', name: 'Lobo Nocturno', price: 3500, rarity: 'epico' },
  { id: 'eguzkilore', name: 'Eguzkilore Dorado', price: 3800, rarity: 'epico' },
  { id: 'dragon_imp', name: 'Dragón Imperial', price: 6500, rarity: 'legendario' },
  { id: 'corona', name: 'Corona Suprema', price: 8000, rarity: 'legendario' },
];
export const VICTORIES: Base<VictoryId>[] = [
  { id: 'destello', name: 'Destello Clásico', price: 0, rarity: 'comun' },
  { id: 'monedas', name: 'Lluvia de Monedas de Oro', price: 2200, rarity: 'raro' },
  { id: 'fuegos', name: 'Fuegos Artificiales Esmeralda', price: 3800, rarity: 'epico' },
  { id: 'relampago', name: 'Relámpago Dorado', price: 4000, rarity: 'epico' },
  { id: 'cartas', name: 'Tormenta de Cartas', price: 6000, rarity: 'legendario' },
  { id: 'explosion', name: 'Explosión VIP Suprema', price: 8500, rarity: 'legendario' },
];
/** El título que se muestra en el perfil es el propio nombre. */
export const TITLE_ITEMS: Base<TitleId>[] = [
  { id: 'mentefria', name: 'Mente Fría', price: 800, rarity: 'comun' },
  { id: 'cazador', name: 'Cazador de Botes', price: 1000, rarity: 'comun' },
  { id: 'reymus', name: 'Rey del Mus', price: 1800, rarity: 'raro' },
  { id: 'cinquillo', name: 'Maestro del Cinquillo', price: 2000, rarity: 'raro' },
  { id: 'intocable', name: 'El Intocable', price: 3200, rarity: 'epico' },
  { id: 'donordago', name: 'Don Órdago', price: 5000, rarity: 'legendario' },
];
/** Frases rápidas de mesa (el icono vive en `Reactions.tsx`). */
export const REACTION_ITEMS: Base<ReactionId>[] = [
  { id: 'saca', name: '¡A la saca!', price: 500, rarity: 'comun' },
  { id: 'niconesas', name: '¡Ni con esas!', price: 500, rarity: 'comun' },
  { id: 'jugada', name: '¡Buena jugada!', price: 400, rarity: 'comun' },
  { id: 'repaso', name: '¡Vaya repaso!', price: 700, rarity: 'comun' },
  { id: 'locura', name: '¡Qué locura!', price: 900, rarity: 'raro' },
  { id: 'allin', name: '¡All-In sin mirar!', price: 1500, rarity: 'raro' },
];
const PAID_THEMES = new Set<ThemeId>(TAPETES.filter((t) => t.price > 0).map((t) => t.id));

/** Catálogo plano de todo lo que se puede comprar (para la oferta del día y el cofre). */
export interface Item { kind: Kind; id: string; name: string; price: number; rarity: Rarity }
export const CATALOG: Item[] = [
  ...BACKS.map((x): Item => ({ kind: 'backs', id: x.id, name: x.name, price: x.price, rarity: x.rarity })),
  ...TAPETES.map((x): Item => ({ kind: 'mats', id: x.id, name: x.name, price: x.price, rarity: x.rarity })),
  ...FRAMES.map((x): Item => ({ kind: 'frames', id: x.id, name: x.name, price: x.price, rarity: x.rarity })),
  ...AVATAR_ITEMS.map((x): Item => ({ kind: 'avatars', id: x.id, name: x.name, price: x.price, rarity: x.rarity })),
  ...VICTORIES.map((x): Item => ({ kind: 'wins', id: x.id, name: x.name, price: x.price, rarity: x.rarity })),
  ...TITLE_ITEMS.map((x): Item => ({ kind: 'titles', id: x.id, name: x.name, price: x.price, rarity: x.rarity })),
  ...REACTION_ITEMS.map((x): Item => ({ kind: 'reacts', id: x.id, name: x.name, price: x.price, rarity: x.rarity })),
  ...SETS.map((x): Item => ({ kind: 'sets', id: x.id, name: x.name, price: x.price, rarity: x.rarity })),
];

export interface State {
  backs: BackId[]; back: BackId; themes: ThemeId[]; frames: FrameId[]; frame: FrameId; sets: SetId[]; set: SetId;
  avatars: AvatarId[]; avatar: AvatarId | null; victories: VictoryId[]; victory: VictoryId; titles: TitleId[]; reactions: ReactionId[];
}
const KEY = 'stacks.cosmetics.v1';
const DEFAULT: State = {
  backs: ['esmeralda'], back: 'esmeralda', themes: ['esmeralda'], frames: ['aro'], frame: 'aro', sets: ['clasico'], set: 'clasico',
  avatars: [], avatar: null, victories: ['destello'], victory: 'destello', titles: [], reactions: [],
};

/** Filtra la lista guardada a ids válidos (y garantiza el elemento gratuito si lo hay). */
const clean = <T extends string>(raw: unknown, valid: readonly { id: T }[], free?: T): T[] => {
  const list = (Array.isArray(raw) ? raw : []).filter((x, i, a): x is T => valid.some((v) => v.id === x) && a.indexOf(x) === i);
  return free && !list.includes(free) ? [free, ...list] : list;
};

/** Normaliza un estado guardado en el dispositivo o recibido de la nube. */
function normalize(p: Partial<State>): State {
  const backs = clean<BackId>(p.backs, BACKS, 'esmeralda');
  const themes = clean<ThemeId>(p.themes, TAPETES, 'esmeralda');
  const frames = clean<FrameId>(p.frames, FRAMES, 'aro');
  const sets = clean<SetId>(p.sets, SETS, 'clasico');
  const avatars = clean<AvatarId>(p.avatars, AVATAR_ITEMS);
  const victories = clean<VictoryId>(p.victories, VICTORIES, 'destello');
  return {
    backs, themes, frames, sets, avatars, victories,
    titles: clean<TitleId>(p.titles, TITLE_ITEMS),
    reactions: clean<ReactionId>(p.reactions, REACTION_ITEMS),
    back: p.back && backs.includes(p.back) ? p.back : 'esmeralda',
    frame: p.frame && frames.includes(p.frame) ? p.frame : 'aro',
    set: p.set && sets.includes(p.set) ? p.set : 'clasico',
    avatar: p.avatar && avatars.includes(p.avatar) ? p.avatar : null,
    victory: p.victory && victories.includes(p.victory) ? p.victory : 'destello',
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw) as Partial<State>);
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

const itemOf = (kind: Kind, id: string): Item | undefined => CATALOG.find((x) => x.kind === kind && x.id === id);
/** ¿Ya tienes este artículo? */
export const owns = (kind: Kind, id: string, s: State = state): boolean => {
  switch (kind) {
    case 'backs': return s.backs.includes(id as BackId);
    case 'mats': return s.themes.includes(id as ThemeId);
    case 'frames': return s.frames.includes(id as FrameId);
    case 'sets': return s.sets.includes(id as SetId);
    case 'avatars': return s.avatars.includes(id as AvatarId);
    case 'wins': return s.victories.includes(id as VictoryId);
    case 'titles': return s.titles.includes(id as TitleId);
    default: return s.reactions.includes(id as ReactionId);
  }
};

/** Añade el artículo a tu colección y lo equipa (las reacciones se añaden a tu menú de mesa). */
function addOwned(kind: Kind, id: string, equip: boolean): void {
  switch (kind) {
    case 'backs': set({ ...state, backs: [...state.backs, id as BackId], back: equip ? (id as BackId) : state.back }); break;
    case 'mats': set({ ...state, themes: [...state.themes, id as ThemeId] }); if (equip) setSettings({ theme: id as ThemeId }); break;
    case 'frames': set({ ...state, frames: [...state.frames, id as FrameId], frame: equip ? (id as FrameId) : state.frame }); break;
    case 'sets': set({ ...state, sets: [...state.sets, id as SetId], set: equip ? (id as SetId) : state.set }); break;
    case 'avatars': set({ ...state, avatars: [...state.avatars, id as AvatarId], avatar: equip ? (id as AvatarId) : state.avatar }); break;
    case 'wins': set({ ...state, victories: [...state.victories, id as VictoryId], victory: equip ? (id as VictoryId) : state.victory }); break;
    case 'titles': {
      set({ ...state, titles: [...state.titles, id as TitleId] });
      const p = getProfile(); const it = itemOf('titles', id);
      if (equip && p && it) saveProfile({ ...p, title: it.name });
      break;
    }
    default: set({ ...state, reactions: [...state.reactions, id as ReactionId] });
  }
}

/** Equipa un artículo que ya tienes. */
function equip(kind: Kind, id: string): void {
  if (kind === 'avatars' && id === 'default') { set({ ...state, avatar: null }); return; } // vuelve a la letra inicial
  if (!owns(kind, id)) return;
  switch (kind) {
    case 'backs': set({ ...state, back: id as BackId }); break;
    case 'mats': setSettings({ theme: id as ThemeId }); break;
    case 'frames': set({ ...state, frame: id as FrameId }); break;
    case 'sets': set({ ...state, set: id as SetId }); break;
    case 'avatars': set({ ...state, avatar: id as AvatarId }); break;
    case 'wins': set({ ...state, victory: id as VictoryId }); break;
    case 'titles': { const p = getProfile(); const it = itemOf('titles', id); if (p && it) saveProfile({ ...p, title: it.name }); break; }
    default: break;
  }
}

/** Oferta del día: un artículo de pago que aún no tienes, elegido por la fecha (el mismo para todos los dispositivos ese día). */
export const DEAL_DISCOUNT = 0.25;
export const dealPrice = (price: number): number => Math.round(price * (1 - DEAL_DISCOUNT));
export function dailyDeal(date: Date = new Date()): Item | null {
  // El punto de partida solo depende de la fecha; si ese artículo ya es tuyo se pasa al siguiente (la oferta no cambia al comprar otras cosas).
  const pool = CATALOG.filter((x) => x.price >= 1000);
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  const start = (day * 2654435761 >>> 0) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const it = pool[(start + i) % pool.length]!;
    if (!owns(it.kind, it.id)) return it;
  }
  return null;
}

export const CHEST_PRICE = 1500;
export const CHEST_REFUND = 2000;
export type ChestResult = { item: Item } | { chips: number };

export const cosmetics = {
  /** Compra con fichas (con `price` se aplica una oferta). Devuelve false si ya lo tienes o no te alcanza. */
  buy(kind: Kind, id: string, price?: number): boolean {
    const it = itemOf(kind, id);
    if (!it || owns(kind, id) || !wallet.spend(price ?? it.price)) return false;
    addOwned(kind, id, true);
    return true;
  },
  equip,
  /** Taquilla: equipa al azar un artículo de cada categoría entre los que ya posees. */
  randomize(): void {
    const kinds: Kind[] = ['backs', 'mats', 'frames', 'avatars', 'wins', 'titles', 'sets'];
    for (const k of kinds) {
      const mine = CATALOG.filter((x) => x.kind === k && owns(k, x.id));
      if (mine.length > 0) equip(k, mine[Math.floor(Math.random() * mine.length)]!.id);
    }
  },
  /** Cofre Misterioso VIP: un artículo Raro, Épico o Legendario que aún no tengas; si ya lo tienes todo, devuelve fichas. */
  openChest(): ChestResult | null {
    if (!wallet.spend(CHEST_PRICE)) return null;
    const pool = CATALOG.filter((x) => RARITY_ORDER[x.rarity] >= 1 && !owns(x.kind, x.id));
    if (pool.length === 0) { wallet.add(CHEST_REFUND); return { chips: CHEST_REFUND }; }
    // más probabilidad de Raro que de Épico y de Épico que de Legendario
    const w = (r: Rarity): number => (r === 'raro' ? 6 : r === 'epico' ? 3 : 1);
    let roll = Math.random() * pool.reduce((n, x) => n + w(x.rarity), 0);
    const item = pool.find((x) => (roll -= w(x.rarity)) < 0) ?? pool[pool.length - 1]!;
    addOwned(item.kind, item.id, true);
    return { item };
  },
  /** Al iniciar sesión en otro dispositivo: lo equipado en la nube pasa a ser tuyo y, si la nube guarda la colección, se fusiona con la local. */
  hydrate(cardBack: string, table: string, cloud?: unknown): void {
    const back = (cardBack === 'emerald' ? 'esmeralda' : cardBack) as BackId;
    const theme = (table === 'emerald' ? 'esmeralda' : table) as ThemeId;
    let cur = state;
    if (cloud && typeof cloud === 'object') {
      const c = normalize(cloud as Partial<State>);
      const merge = <T extends string>(a: T[], b: T[]): T[] => [...new Set([...a, ...b])];
      cur = normalize({
        ...c, backs: merge(cur.backs, c.backs), themes: merge(cur.themes, c.themes), frames: merge(cur.frames, c.frames), sets: merge(cur.sets, c.sets),
        avatars: merge(cur.avatars, c.avatars), victories: merge(cur.victories, c.victories), titles: merge(cur.titles, c.titles), reactions: merge(cur.reactions, c.reactions),
      });
    }
    const backs = BACKS.some((b) => b.id === back) && !cur.backs.includes(back) ? [...cur.backs, back] : cur.backs;
    const themes = TAPETES.some((x) => x.id === theme) && !cur.themes.includes(theme) ? [...cur.themes, theme] : cur.themes;
    set({ ...cur, backs, themes, back: backs.includes(back) ? back : cur.back });
    if (themes.includes(theme)) setSettings({ theme });
  },
  reset(): void { try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } set(DEFAULT); if (!themeUnlocked(getSettings().theme)) setSettings({ theme: 'esmeralda' }); },
};

// Si un tapete de pago no está comprado (datos antiguos), se vuelve al gratuito.
if (!themeUnlocked(getSettings().theme)) setSettings({ theme: 'esmeralda' });

export const getCosmetics = (): State => state;
/** Suscripción sin React (sincronización con la nube). */
export const subscribeCosmetics = (l: () => void): (() => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
/** Datos para guardar en la nube: lo equipado y toda tu colección (`cosmetics` es una columna jsonb). */
export const equippedForCloud = (): { card_back: string; table: string; cosmetics: State } => ({
  card_back: state.back === 'esmeralda' ? 'emerald' : state.back,
  table: getSettings().theme === 'esmeralda' ? 'emerald' : getSettings().theme,
  cosmetics: state,
});
export const useCosmetics = (): State => useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, getCosmetics);
/** Variante de dorso equipada (los componentes de cartas la leen con este hook para actualizarse al instante). */
export function useCardBack(): BackVariant {
  const c = useCosmetics();
  return BACKS.find((b) => b.id === c.back)!.variant;
}
/** Marco de avatar equipado. */
export const useFrame = (): FrameId => useCosmetics().frame;
/** Emblema de avatar equipado (`null` = el de siempre). */
export const useEmblem = (): AvatarId | null => useCosmetics().avatar;
/** Efecto de victoria equipado. */
export const useVictory = (): VictoryId => useCosmetics().victory;
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
