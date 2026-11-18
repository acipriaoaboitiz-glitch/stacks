import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { localForced } from './env.ts';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** ¿Hay Supabase configurado y permitido (no forzado a modo local)? */
export const supabaseEnabled: boolean = Boolean(URL && KEY) && !localForced;

let client: SupabaseClient | null = null;
/** Cliente compartido (club social). Nunca lanza: devuelve null si no hay claves o falla la creación. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  try { client ??= createClient(URL!, KEY!, { realtime: { params: { eventsPerSecond: 10 } } }); } catch { client = null; }
  return client;
}

let authed: Promise<boolean> | null = null;
/**
 * Sesión anónima de Supabase Auth: es lo que permite que las políticas RLS distingan a un jugador de otro (`auth.uid()`).
 * Requiere activar «Anonymous sign-ins» en Authentication → Providers del panel de Supabase.
 */
export function ensureAnonAuth(): Promise<boolean> {
  authed ??= (async () => {
    const c = getSupabase();
    if (!c) return false;
    try {
      const { data } = await c.auth.getSession();
      if (data.session) return true;
      const { error } = await c.auth.signInAnonymously();
      return !error;
    } catch { return false; }
  })();
  return authed;
}
