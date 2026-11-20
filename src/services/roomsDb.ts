import { dbClient, dbFail, T } from './socialDb.ts';

/**
 * Registro de salas en `stacks_rooms` (código, juego, anfitrión, estado y jugadores). El juego en vivo (jugadas, turnos) viaja por el
 * canal Realtime `stacks:CODIGO` de la sala, que es lo que necesita latencia baja; esta tabla permite descubrir y cerrar salas.
 * Mejor esfuerzo: sin Supabase, sin sesión o sin la tabla, la sala funciona igual solo con el canal.
 */
export interface RoomPlayerRow { name: string; seat: number; host: boolean }

export async function dbCreateRoom(code: string, game: string, hostId: string, maxPlayers: number, isPublic = false): Promise<void> {
  const c = await dbClient();
  if (!c) return;
  const { error } = await c.from(T.rooms).upsert({ code, game_type: game, host_id: hostId, status: 'waiting', max_players: maxPlayers, is_public: isPublic, players: [], game_state: {} }, { onConflict: 'code' });
  dbFail(error);
}

export async function dbUpdateRoom(code: string, patch: { status?: 'waiting' | 'playing' | 'closed'; players?: RoomPlayerRow[]; game_state?: unknown }): Promise<void> {
  const c = await dbClient();
  if (!c) return;
  const { error } = await c.from(T.rooms).update(patch).eq('code', code);
  dbFail(error);
}

/** Cierra la sala (la borra): el anfitrión se va y no queda nada colgado en la base de datos. */
export async function dbCloseRoom(code: string): Promise<void> {
  const c = await dbClient();
  if (!c) return;
  const { error } = await c.from(T.rooms).delete().eq('code', code);
  dbFail(error);
}

/** ¿Existe una sala abierta con ese código? (null = no se puede comprobar). */
export async function dbRoomOpen(code: string): Promise<boolean | null> {
  const c = await dbClient();
  if (!c) return null;
  const { data, error } = await c.from(T.rooms).select('status').eq('code', code).maybeSingle();
  if (dbFail(error)) return null;
  return Boolean(data && data.status !== 'closed');
}

/** Instantánea del estado de la partida (la guarda el anfitrión) para que un jugador que recarga recupere su asiento, su mano y el turno. */
export async function dbSaveState(code: string, state: unknown): Promise<void> {
  const c = await dbClient();
  if (!c) return;
  const { error } = await c.from(T.rooms).update({ game_state: state as never }).eq('code', code);
  dbFail(error);
}

/** Última instantánea guardada (null = no hay o no se puede leer). */
export async function dbLoadState(code: string): Promise<unknown | null> {
  const c = await dbClient();
  if (!c) return null;
  const { data, error } = await c.from(T.rooms).select('game_state, status').eq('code', code).maybeSingle();
  if (dbFail(error) || !data || data.status === 'closed') return null;
  const st = data.game_state as Record<string, unknown> | null;
  return st && Object.keys(st).length > 0 ? st : null;
}

/**
 * Partida rápida: busca una sala pública abierta del juego con huecos libres (activa en los últimos 2 minutos).
 * Devuelve su código, null si no hay ninguna, o undefined si no se puede consultar la base de datos.
 */
export async function dbFindPublic(game: string): Promise<string | null | undefined> {
  const c = await dbClient();
  if (!c) return undefined;
  const { data, error } = await c.from(T.rooms).select('code, players, max_players, updated_at').eq('game_type', game).eq('is_public', true).eq('status', 'waiting').order('updated_at', { ascending: false }).limit(10);
  if (dbFail(error)) return undefined;
  const fresh = Date.now() - 120_000;
  const hit = (data ?? []).find((r) => new Date(r.updated_at as string).getTime() > fresh && (Array.isArray(r.players) ? r.players.length : 0) < Number(r.max_players));
  return hit ? (hit.code as string) : null;
}
