import type { Card } from './club.ts';
import { ensureAnonAuth, getSupabase } from './supabase.ts';

/**
 * Persistencia social en Supabase (tablas de `supabase/schema.sql`): perfiles, amistades e invitaciones.
 * Todo es «mejor esfuerzo»: si no hay Supabase, no hay sesión anónima o las tablas aún no existen, cada función devuelve un valor
 * vacío y la app sigue con presencia + mensajes en vivo y el estado guardado en localStorage.
 */
export interface DbProfile extends Card { chips: number; wins: number }
export interface DbFriendship { requester_uid: string; addressee_uid: string; status: 'pending' | 'accepted' }
export interface DbInvite { from_uid: string; to_uid: string; game: string; code: string; created_at: string }

let broken = false;
/** ¿Se puede usar la base de datos ahora mismo? */
async function client() {
  if (broken) return null;
  const c = getSupabase();
  if (!c) return null;
  return (await ensureAnonAuth()) ? c : null;
}
const fail = (err: { code?: string; message?: string } | null): boolean => {
  if (!err) return false;
  // Tabla inexistente o sin permisos: se desactiva la capa de base de datos hasta recargar.
  if (err.code === '42P01' || err.code === 'PGRST205' || err.code === '42501' || /relation|schema cache|permission/i.test(err.message ?? '')) broken = true;
  return true;
};

export async function dbUpsertProfile(card: Card, chips: number, wins: number): Promise<'ok' | 'conflict' | 'off'> {
  const c = await client();
  if (!c) return 'off';
  const { error } = await c.from('profiles').upsert({ uid: card.uid, name: card.name, tag: card.tag, avatar: card.avatar, chips, wins, updated_at: new Date().toISOString() }, { onConflict: 'uid' });
  if (error?.code === '23505') return 'conflict'; // (name, tag) ya existe: hay que sortear otro TAG
  return fail(error) ? 'off' : 'ok';
}

const toProfile = (r: Record<string, unknown>): DbProfile => ({
  uid: String(r.uid), name: String(r.name), tag: String(r.tag), avatar: Number(r.avatar ?? 0), chips: Number(r.chips ?? 0), wins: Number(r.wins ?? 0),
});

/** Busca por «Apodo#TAG» (exacto), por TAG suelto o por parte del apodo. */
export async function dbSearch(q: string): Promise<DbProfile[]> {
  const c = await client();
  if (!c) return [];
  const raw = q.trim();
  const hash = raw.indexOf('#');
  const bareTag = /^\d{4}$/.test(raw);
  const name = bareTag ? '' : (hash >= 0 ? raw.slice(0, hash) : raw).trim().replace(/[%,()]/g, '');
  const tag = bareTag ? raw : hash >= 0 ? raw.slice(hash + 1).trim() : '';
  let query = c.from('profiles').select('uid,name,tag,avatar,chips,wins').limit(8);
  if (tag) query = query.eq('tag', tag);
  if (name) query = query.ilike('name', `${name}%`);
  const { data, error } = await query;
  if (fail(error) || !data) return [];
  return data.map(toProfile);
}

export async function dbTop(limit = 30): Promise<DbProfile[]> {
  const c = await client();
  if (!c) return [];
  const { data, error } = await c.from('profiles').select('uid,name,tag,avatar,chips,wins').order('chips', { ascending: false }).limit(limit);
  if (fail(error) || !data) return [];
  return data.map(toProfile);
}

export async function dbRequest(from: string, to: string): Promise<void> {
  const c = await client();
  if (!c) return;
  const { error } = await c.from('friendships').upsert({ requester_uid: from, addressee_uid: to, status: 'pending' }, { onConflict: 'requester_uid,addressee_uid', ignoreDuplicates: true });
  fail(error);
}
export async function dbSetFriendship(requester: string, addressee: string, status: 'accepted' | 'removed'): Promise<void> {
  const c = await client();
  if (!c) return;
  const q = status === 'removed'
    ? c.from('friendships').delete().or(`and(requester_uid.eq.${requester},addressee_uid.eq.${addressee}),and(requester_uid.eq.${addressee},addressee_uid.eq.${requester})`)
    : c.from('friendships').update({ status }).eq('requester_uid', requester).eq('addressee_uid', addressee);
  const { error } = await q;
  fail(error);
}
export async function dbLoadFriendships(me: string): Promise<{ rows: DbFriendship[]; profiles: Record<string, DbProfile> }> {
  const c = await client();
  if (!c) return { rows: [], profiles: {} };
  const { data, error } = await c.from('friendships').select('requester_uid,addressee_uid,status').or(`requester_uid.eq.${me},addressee_uid.eq.${me}`);
  if (fail(error) || !data) return { rows: [], profiles: {} };
  const rows = data as DbFriendship[];
  const ids = [...new Set(rows.flatMap((r) => [r.requester_uid, r.addressee_uid]).filter((u) => u !== me))];
  const profiles: Record<string, DbProfile> = {};
  if (ids.length) {
    const { data: ps, error: e2 } = await c.from('profiles').select('uid,name,tag,avatar,chips,wins').in('uid', ids);
    if (!fail(e2) && ps) for (const p of ps) profiles[String(p.uid)] = toProfile(p);
  }
  return { rows, profiles };
}

export async function dbInvite(from: string, to: string, game: string, code: string): Promise<void> {
  const c = await client();
  if (!c) return;
  const { error } = await c.from('game_invites').insert({ from_uid: from, to_uid: to, game, code });
  fail(error);
}

/** Cambios en vivo (`postgres_changes`) de las amistades y las invitaciones dirigidas a este jugador. */
export function dbSubscribe(me: string, onFriendship: (r: DbFriendship) => void, onInvite: (r: DbInvite) => void): () => void {
  let off = () => {};
  void client().then((c) => {
    if (!c) return;
    const ch = c.channel(`social:${me}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_uid=eq.${me}` }, (p) => { if (p.new && 'status' in p.new) onFriendship(p.new as DbFriendship); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `requester_uid=eq.${me}` }, (p) => { if (p.new && 'status' in p.new) onFriendship(p.new as DbFriendship); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_invites', filter: `to_uid=eq.${me}` }, (p) => onInvite(p.new as DbInvite))
      .subscribe();
    off = () => { void c.removeChannel(ch); };
  });
  return () => off();
}
