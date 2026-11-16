import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Crown, Link2, Loader2, LogOut, Wifi, WifiOff, X } from 'lucide-react';
import type { GameInfo } from '../../games/registry.ts';
import {
  createRoom, inviteLink, isSupabaseConfigured, joinRoom, normalizeRoomCode, setActiveRoom,
  teamOfSeat, useRoom, ROOM_CODE_LENGTH, isValidRoomCode, type PlayerView, type Room,
} from '../../services/multiplayer.ts';
import { feedback } from '../../store/settings.ts';
import { useWallet } from '../../store/wallet.ts';

const QUICK = ['¡Envido!', '¡Órdago!', '¡Vaya suerte!', '¡Ahí va!', '😎', '🔥', '😤', 'GG'];
const TEAM_COLOR = { A: '#34d399', B: '#fbbf24' } as const;

function PingBars({ ping }: { ping: number | null }) {
  const level = ping === null ? 0 : ping < 90 ? 3 : ping < 220 ? 2 : 1;
  const color = level === 3 ? '#34d399' : level === 2 ? '#fbbf24' : level === 1 ? '#f87171' : '#5b6b62';
  return (
    <span className="flex items-end gap-[2px]" title={ping === null ? 'Midiendo…' : `${ping} ms`} aria-label={ping === null ? 'Ping sin medir' : `Ping ${ping} milisegundos`}>
      {[1, 2, 3].map((i) => <span key={i} style={{ width: 3, height: 3 + i * 3, borderRadius: 1, background: i <= level ? color : '#ffffff22' }} />)}
      <span className="font-mono ml-1 text-[10px]" style={{ color }}>{ping === null ? '···' : `${ping}ms`}</span>
    </span>
  );
}

function SeatCard({ seat, index, teams, player, onSit }: {
  seat: number; index: number; teams: boolean; player: PlayerView | null; onSit: () => void;
}) {
  const team = teams ? teamOfSeat(seat) : null;
  const color = team ? TEAM_COLOR[team] : '#eab308';
  if (!player) {
    return (
      <motion.button type="button" onClick={onSit} whileTap={{ scale: 0.96 }}
        className="flex h-[92px] w-full flex-col items-center justify-center gap-1 rounded-2xl"
        style={{ border: `1.5px dashed ${color}77`, background: '#00000044', color }}
        aria-label={`Sentarse en el asiento ${index + 1}`}>
        <span className="text-lg font-black">+</span>
        <span className="text-[11px] font-bold">Libre · sentarse</span>
      </motion.button>
    );
  }
  return (
    <motion.div layout className="glass-panel flex h-[92px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1"
      style={{ borderColor: `${color}88`, boxShadow: player.isSelf ? `0 0 0 1.5px ${color}, 0 0 20px ${color}44` : undefined }}>
      <div className="flex items-center gap-1.5">
        <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-black" style={{ background: color, color: '#06130e' }}>
          {player.name.slice(0, 1).toUpperCase()}
        </span>
        {player.isHost && <Crown size={14} style={{ color: '#fef08a' }} aria-label="Anfitrión" />}
      </div>
      <span className="max-w-full truncate text-xs font-extrabold">{player.name}{player.isSelf ? ' (tú)' : ''}</span>
      <div className="flex items-center gap-2">
        <span className="rounded-full px-2 py-[1px] text-[10px] font-extrabold"
          style={player.ready ? { background: '#065f46', color: '#a7f3d0' } : { background: '#ffffff14', color: '#9fb3a8' }}>
          {player.ready ? 'Listo' : 'Esperando'}
        </span>
        <PingBars ping={player.ping} />
      </div>
    </motion.div>
  );
}

function RoomView({ room, game, onLeave }: { room: Room; game: GameInfo; onLeave: () => void }) {
  const snap = useRoom(room)!;
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const teams = snap.layout.mode === 'teams';
  const cap = snap.layout.capacity;
  // Asientos en cruz: 0 abajo, 1 izquierda, 2 arriba, 3 derecha.
  const cell: Record<number, string> = { 0: 'col-start-2 row-start-3', 1: 'col-start-1 row-start-2', 2: 'col-start-2 row-start-1', 3: 'col-start-3 row-start-2' };
  const copy = async (what: 'code' | 'link') => {
    const text = what === 'code' ? snap.code : inviteLink(snap.code, game.id);
    try { await navigator.clipboard.writeText(text); } catch { /* sin permiso de portapapeles */ }
    feedback('chip');
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1600);
  };
  const missing = snap.layout.min - snap.players.length;
  const hint = snap.canStart ? 'Todo listo' : !snap.me?.isHost ? 'Espera al anfitrión'
    : !snap.fillBots && missing > 0 ? `Faltan ${missing} jugador${missing > 1 ? 'es' : ''}` : 'Esperando a que todos estén listos';

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-panel flex items-center gap-2 rounded-2xl p-3">
        <div className="flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[.25em]" style={{ color: '#fef08a99' }}>Código de sala</p>
          <p className="font-mono text-3xl font-bold tracking-[.18em] gold-text" aria-label={`Código ${snap.code.split('').join(' ')}`}>{snap.code}</p>
        </div>
        <button type="button" className="btn grid place-items-center" style={{ minHeight: 48, width: 48, padding: 0 }}
          onClick={() => copy('code')} aria-label="Copiar código">
          {copied === 'code' ? <Check size={18} /> : <Copy size={18} />}
        </button>
        <button type="button" className="btn gold-foil flex items-center gap-1.5" style={{ minHeight: 48, padding: '0 12px', fontSize: 13 }}
          onClick={() => copy('link')}>
          {copied === 'link' ? <Check size={16} /> : <Link2 size={16} />} {copied === 'link' ? 'Copiado' : 'Invitar'}
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--color-muted)' }}>
        <span className="flex items-center gap-1.5">
          {snap.status === 'online' ? <Wifi size={13} style={{ color: '#34d399' }} /> : snap.status === 'connecting' ? <Loader2 size={13} className="animate-spin" /> : <WifiOff size={13} style={{ color: '#f87171' }} />}
          {snap.status === 'online' ? 'Conectado' : snap.status === 'connecting' ? 'Conectando…' : 'Sin conexión'}
          · {snap.transport === 'supabase' ? 'Supabase en vivo' : snap.fallback ? 'Modo local (Supabase no responde)' : 'Modo local (pestañas del navegador)'}
        </span>
        <span>{snap.players.length}/{cap} jugadores</span>
      </div>

      {/* Mesa */}
      <div className="bg-felt relative rounded-3xl p-3" style={{ border: '1px solid rgba(234,179,8,.25)' }}>
        <div className="grid grid-cols-3 grid-rows-3 items-center gap-2">
          {Array.from({ length: cap }, (_, s) => (
            <div key={s} className={cell[cap === 2 ? (s === 0 ? 0 : 2) : s]}>
              <SeatCard seat={cap === 2 ? (s === 0 ? 0 : 2) : s} index={s} teams={teams} player={snap.seats[s] ?? null}
                onSit={() => room.sitAt(s)} />
            </div>
          ))}
          <div className="col-start-2 row-start-2 grid place-items-center text-center">
            {teams ? (
              <div className="flex flex-col items-center gap-0.5 text-[11px] font-black">
                <span style={{ color: TEAM_COLOR.A }}>EQUIPO A</span>
                <span className="font-display text-base gold-text">VS</span>
                <span style={{ color: TEAM_COLOR.B }}>EQUIPO B</span>
              </div>
            ) : <span className="font-display text-sm font-black gold-text">{game.name}</span>}
          </div>
        </div>
        {teams && <p className="mt-2 text-center text-[10px]" style={{ color: '#f6f1e4aa' }}>Toca un asiento libre para cambiar de pareja · A: ↓↑ · B: ←→</p>}

        {/* Reacciones flotantes */}
        <div className="pointer-events-none absolute inset-x-0 top-1 flex flex-col items-center gap-1" aria-live="polite">
          <AnimatePresence>
            {snap.reactions.map((r) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 14, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -14 }}
                className="glass-panel rounded-full px-3 py-1 text-xs font-extrabold">
                <span style={{ color: '#fde68a' }}>{r.name}:</span> {r.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" aria-label="Reacciones rápidas">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => { feedback('tap'); room.react(q); }}
            className="shrink-0 rounded-full px-3 py-2 text-xs font-extrabold" style={{ background: '#ffffff12', border: '1px solid var(--line-2)' }}>
            {q}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {snap.me?.isHost && (
          <label className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold" style={{ background: '#ffffff0d' }}>
            Rellenar huecos con IA
            <input type="checkbox" checked={snap.fillBots} onChange={(e) => room.setFillBots(e.target.checked)} className="h-5 w-5 accent-yellow-500" />
          </label>
        )}
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <button type="button" className="btn grid place-items-center" style={{ width: 52, padding: 0 }} onClick={onLeave} aria-label="Salir de la sala"><LogOut size={18} /></button>
          {snap.me?.isHost ? (
            <button type="button" className="btn btn--gold" disabled={!snap.canStart} onClick={() => { feedback('big'); room.start(); }}>
              Empezar partida
            </button>
          ) : (
            <button type="button" className={snap.me?.ready ? 'btn' : 'btn btn--gold'} onClick={() => room.setReady(!snap.me?.ready)}>
              {snap.me?.ready ? 'Listo ✓ (tocar para cancelar)' : 'Estoy listo'}
            </button>
          )}
        </div>
        <p className="text-center text-[11px]" style={{ color: 'var(--color-muted)' }}>{hint}</p>
      </div>
    </div>
  );
}

interface Props {
  game: GameInfo | null;
  /** Código que llega por enlace de invitación. */
  initialCode?: string;
  onClose: () => void;
  /** Se llama cuando el anfitrión inicia (en todos los clientes). */
  onStart: (room: Room, fillBots: boolean) => void;
}

/** Modal de Sala Online: crear/unirse con código de 5 caracteres, sala de espera y reacciones. */
export function OnlineLobbyModal({ game, initialCode, onClose, onStart }: Props) {
  const { name } = useWallet();
  const [room, setRoom] = useState<Room | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');
  const unsub = useRef<(() => void) | null>(null);
  const started = useRef(false);

  const attach = (r: Room) => {
    unsub.current?.();
    unsub.current = r.onStart((fill) => { started.current = true; onStart(r, fill); });
    setActiveRoom(r);
    setRoom(r);
  };

  const create = async () => {
    if (!game) return;
    setBusy('create'); setError('');
    try { attach(await createRoom(game.id, name)); } catch (e) { setError(e instanceof Error ? e.message : 'Error al crear la sala'); }
    setBusy(null);
  };
  const join = async (c = code) => {
    if (!game) return;
    setBusy('join'); setError('');
    try { attach(await joinRoom(c, game.id, name)); } catch (e) { setError(e instanceof Error ? e.message : 'Error al unirse'); }
    setBusy(null);
  };

  // Reinicia al abrir; entra solo si llega un código por enlace.
  useEffect(() => {
    if (!game) return;
    started.current = false;
    setError('');
    setRoom(null);
    setCode(initialCode ? normalizeRoomCode(initialCode) : '');
    if (initialCode && isValidRoomCode(normalizeRoomCode(initialCode))) void join(normalizeRoomCode(initialCode));
    // eslint-disable-next-line
  }, [game?.id, initialCode]);

  const leave = () => {
    unsub.current?.();
    setActiveRoom(null);
    setRoom(null);
  };
  const close = () => { if (!started.current) leave(); onClose(); };

  return (
    <AnimatePresence>
      {game && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" style={{ background: '#000c' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div role="dialog" aria-modal="true" aria-label={`Sala online de ${game.name}`}
            className="glass-panel w-full max-w-md overflow-y-auto rounded-t-3xl p-4 sm:rounded-3xl"
            style={{ maxHeight: '94dvh', paddingBottom: 'calc(16px + var(--safe-b))' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-3">
              <game.icon size={24} style={{ color: game.accent }} aria-hidden />
              <h2 className="font-display flex-1 text-xl font-black gold-text">{game.name} · Online</h2>
              <button type="button" onClick={close} aria-label="Cerrar" className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: '#ffffff14' }}><X size={18} /></button>
            </div>

            {room ? <RoomView room={room} game={game} onLeave={leave} /> : (
              <div className="flex flex-col gap-3">
                <button type="button" className="btn btn--gold" onClick={create} disabled={busy !== null}>
                  {busy === 'create' ? 'Creando sala…' : 'Crear sala privada'}
                </button>
                <div className="flex items-center gap-3 text-[11px] font-bold" style={{ color: 'var(--color-muted)' }}>
                  <span className="h-px flex-1" style={{ background: 'var(--line-2)' }} />o únete con un código<span className="h-px flex-1" style={{ background: 'var(--line-2)' }} />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input value={code} maxLength={ROOM_CODE_LENGTH} aria-label="Código de sala" placeholder="STK49" autoCapitalize="characters"
                    onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
                    className="font-mono rounded-xl px-3 py-3 text-center text-2xl font-bold tracking-[.3em]"
                    style={{ background: '#00000066', border: `1px solid ${isValidRoomCode(code) ? '#34d399' : 'var(--line-2)'}`, color: 'var(--color-text)' }} />
                  <button type="button" className="btn" disabled={!isValidRoomCode(code) || busy !== null} onClick={() => join()}>
                    {busy === 'join' ? '…' : 'Entrar'}
                  </button>
                </div>
                {error && <p role="alert" className="text-center text-sm font-bold" style={{ color: '#f87171' }}>{error}</p>}
                <p className="text-center text-[11px]" style={{ color: 'var(--color-muted)' }}>
                  {isSupabaseConfigured
                    ? 'Conectado a Supabase Realtime.'
                    : 'Modo local: abre otra pestaña de STACKS para probar la sala. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para jugar en red.'}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
