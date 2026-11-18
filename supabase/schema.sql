-- ════════════════════════════════════════════════════════════════════════════════════
-- STACKS · esquema social de Supabase (perfiles, amistades e invitaciones)
-- Ejecútalo UNA vez en Supabase → SQL Editor. Es idempotente (se puede volver a lanzar).
--
-- ANTES: activa «Anonymous sign-ins» en Authentication → Providers (o Settings → Auth).
-- La app inicia sesión anónima y así las políticas RLS saben quién es cada jugador (`auth.uid()`).
-- Sin ese ajuste, todas las llamadas a estas tablas fallan en silencio y la app sigue en modo
-- «presencia + mensajes en vivo» sin persistencia.
--
-- NOTA: las fichas y victorias de `profiles` las declara cada cliente (el juego no tiene servidor
-- autoritativo), así que el «Top global» es orientativo, no a prueba de trampas.
-- ════════════════════════════════════════════════════════════════════════════════════

-- ── Perfiles ──────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  uid         text primary key,                                  -- identificador estable del jugador (UUID generado en el cliente)
  owner       uuid not null default auth.uid(),                  -- usuario de Supabase Auth que lo creó (sesión anónima)
  name        text not null check (char_length(name) between 1 and 16),
  tag         text not null check (tag ~ '^[0-9]{4}$'),          -- #TAG de 4 dígitos
  avatar      int  not null default 0,
  chips       int  not null default 0 check (chips >= 0),
  wins        int  not null default 0 check (wins >= 0),
  updated_at  timestamptz not null default now(),
  constraint profiles_name_tag_unique unique (name, tag)         -- «Apodo#1234» no se repite
);
create index if not exists profiles_chips_idx on public.profiles (chips desc);

-- ── Amistades ─────────────────────────────────────────────────────────────────────────
create table if not exists public.friendships (
  id             uuid primary key default gen_random_uuid(),
  requester_uid  text not null references public.profiles (uid) on delete cascade,
  addressee_uid  text not null references public.profiles (uid) on delete cascade,
  status         text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at     timestamptz not null default now(),
  constraint friendships_pair_unique unique (requester_uid, addressee_uid),
  constraint friendships_no_self check (requester_uid <> addressee_uid)
);
create index if not exists friendships_addressee_idx on public.friendships (addressee_uid);

-- ── Invitaciones a partida ────────────────────────────────────────────────────────────
create table if not exists public.game_invites (
  id          uuid primary key default gen_random_uuid(),
  from_uid    text not null references public.profiles (uid) on delete cascade,
  to_uid      text not null references public.profiles (uid) on delete cascade,
  game        text not null,                                     -- id del juego (uno, poker, presidente…)
  code        text not null check (char_length(code) = 5),       -- código de la sala
  created_at  timestamptz not null default now()
);
create index if not exists game_invites_to_idx on public.game_invites (to_uid, created_at desc);

-- ── Seguridad a nivel de fila (RLS) ───────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.friendships  enable row level security;
alter table public.game_invites enable row level security;

-- ¿Este uid de perfil es mío? (el dueño es el usuario autenticado actual)
create or replace function public.owns_profile(p_uid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where uid = p_uid and owner = auth.uid());
$$;

-- profiles: cualquiera con sesión puede buscar/leer; solo el dueño crea y modifica el suyo.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check (owner = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated using (owner = auth.uid());

-- friendships: solo ven la fila los dos implicados; solo el solicitante la crea (siempre «pending»);
-- solo el destinatario la acepta; cualquiera de los dos puede borrarla (rechazar / eliminar amigo).
drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships for select to authenticated
  using (public.owns_profile(requester_uid) or public.owns_profile(addressee_uid));
drop policy if exists friendships_insert on public.friendships;
create policy friendships_insert on public.friendships for insert to authenticated
  with check (public.owns_profile(requester_uid) and status = 'pending');
drop policy if exists friendships_update on public.friendships;
create policy friendships_update on public.friendships for update to authenticated
  using (public.owns_profile(addressee_uid)) with check (public.owns_profile(addressee_uid));
drop policy if exists friendships_delete on public.friendships;
create policy friendships_delete on public.friendships for delete to authenticated
  using (public.owns_profile(requester_uid) or public.owns_profile(addressee_uid));

-- game_invites: el remitente crea (solo a amigos aceptados) y lo ven remitente y destinatario.
drop policy if exists invites_select on public.game_invites;
create policy invites_select on public.game_invites for select to authenticated
  using (public.owns_profile(from_uid) or public.owns_profile(to_uid));
drop policy if exists invites_insert on public.game_invites;
create policy invites_insert on public.game_invites for insert to authenticated
  with check (
    public.owns_profile(from_uid)
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_uid = from_uid and f.addressee_uid = to_uid) or (f.requester_uid = to_uid and f.addressee_uid = from_uid))
    )
  );
drop policy if exists invites_delete on public.game_invites;
create policy invites_delete on public.game_invites for delete to authenticated using (public.owns_profile(from_uid) or public.owns_profile(to_uid));

-- ── Tiempo real (postgres_changes) ────────────────────────────────────────────────────
-- La presencia en vivo y los avisos usan Realtime Broadcast/Presence y no necesitan nada más.
-- Para recibir cambios de tablas, añádelas a la publicación (ignora el error si ya estaban):
do $$ begin
  begin alter publication supabase_realtime add table public.friendships; exception when others then null; end;
  begin alter publication supabase_realtime add table public.game_invites; exception when others then null; end;
end $$;

-- Limpieza opcional: invitaciones de más de 1 día (programa un cron de Supabase si lo quieres automático).
-- delete from public.game_invites where created_at < now() - interval '1 day';
