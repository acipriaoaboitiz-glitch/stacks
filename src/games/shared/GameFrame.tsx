import { useEffect, useRef, useState, type ReactNode } from 'react';
import { feedback } from '../../store/settings.ts';
import { getActiveRoom, useRoom } from '../../services/multiplayer.ts';
import { useWallet } from '../../store/wallet.ts';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GameCinematic } from '../../components/ui/GameCinematic.tsx';
import { subscribeJuice, type Callout, type ChipBurst, type Cinematic, type Slam } from '../../services/juice.ts';
import { ChipFlight, SlamSparks } from '../../components/ui/TableFx.tsx';
import '../mus/app/mus.css';
import { Toaster } from '../mus/app/components/ui.tsx';
import { GameSettingsProvider } from '../mus/app/lib/settings.tsx';
import { ProfileCard } from "../../components/ui/ProfileModal.tsx";
import { ExitButton, QuickButtons } from '../../components/ui/QuickButtons.tsx';
import { TurnTimer, type TurnTimerSpec } from '../../components/ui/TurnTimer.tsx';
import { EmoteBubble, ReactionButton } from '../../components/ui/Reactions.tsx';
import { RulesModal } from '../../components/ui/RulesModal.tsx';
import { SettingsModal } from '../../components/ui/SettingsModal.tsx';
import { findGame } from '../registry.ts';

const EMERALD_FELT =
  'repeating-linear-gradient(45deg, rgba(255,255,255,.018) 0 2px, transparent 2px 4px), radial-gradient(ellipse at center, #0F3A2A 0%, #0A2A1E 55%, #061810 100%)';
const FELT_BG =
  'repeating-linear-gradient(45deg, rgba(255,255,255,.014) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(0,0,0,.05) 0 1px, transparent 1px 3px), repeating-linear-gradient(45deg, rgba(255,255,255,.014) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(0,0,0,.05) 0 1px, transparent 1px 3px), radial-gradient(ellipse at 50% 52%, var(--tapete-glow), transparent 52%), radial-gradient(ellipse at center, var(--tapete-a), var(--tapete-b) 72%, var(--tapete-c) 100%)';

interface Props {
  gameId: string;
  /** Centro de la cabecera (marcador, saldo…). */
  header: ReactNode;
  /** Franja de estado bajo la cabecera. */
  strip?: ReactNode;
  /** Contenido del tapete (posicionado de forma relativa). */
  felt: ReactNode;
  /** Tu zona: nombre, acciones y mano. */
  bottom: ReactNode;
  /** Capas encima de todo (cartel de fase, resultado…). */
  overlays?: ReactNode;
  onExit?: () => void;
  /** Temporizador de turno de 15 s (si hay turno humano). */
  timer?: TurnTimerSpec;
  /** Tapete esmeralda oscuro de ClubStacks (en lugar del color de Ajustes). */
  feltTone?: 'emerald';
}

/**
 * Marco de mesa (estilo Mus Online): una sola pantalla (100dvh) con salir, marcador y botones rápidos
 * (reglas, sonido, ajustes) arriba; tapete con el color elegido en Ajustes; y tu zona abajo.
 */
export function GameFrame(props: Props) {
  return (
    <GameSettingsProvider>
      <Frame {...props} />
    </GameSettingsProvider>
  );
}

function Frame({ gameId, header, strip, felt, bottom, overlays, onExit, timer, feltTone }: Props) {
  const nav = useNavigate();
  const game = findGame(gameId)!;
  const [settings, setSettings] = useState(false);
  const [rules, setRules] = useState(false);
  const [emote, setEmote] = useState<string | null>(null);
  // Game Feel: temblor de mesa (250 ms) y textos de impacto, disparados desde `juice` por cualquier juego.
  const [shaking, setShaking] = useState(false);
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [cinematic, setCinematic] = useState<Cinematic | null>(null);
  const [slamFx, setSlamFx] = useState<Slam | null>(null);
  const [chipFx, setChipFx] = useState<(ChipBurst & { w: number; h: number }) | null>(null);
  const feltRef = useRef<HTMLElement>(null);
  const slamTimer = useRef<number | null>(null);
  const chipTimer = useRef<number | null>(null);
  const cineTimer = useRef<number | null>(null);
  const shakeTimer = useRef<number | null>(null);
  useEffect(() => subscribeJuice({
    onShake: () => { setShaking(false); window.requestAnimationFrame(() => setShaking(true)); if (shakeTimer.current) window.clearTimeout(shakeTimer.current); shakeTimer.current = window.setTimeout(() => setShaking(false), 280); },
    onCinematic: (c) => { setCinematic(c); if (cineTimer.current) window.clearTimeout(cineTimer.current); cineTimer.current = window.setTimeout(() => setCinematic(null), 1650); },
    onSlam: (sl) => { setSlamFx(null); window.requestAnimationFrame(() => setSlamFx(sl)); if (slamTimer.current) window.clearTimeout(slamTimer.current); slamTimer.current = window.setTimeout(() => setSlamFx(null), 700); },
    onChips: (c) => { const r = feltRef.current?.getBoundingClientRect(); setChipFx({ ...c, w: r?.width ?? 320, h: r?.height ?? 420 }); if (chipTimer.current) window.clearTimeout(chipTimer.current); chipTimer.current = window.setTimeout(() => setChipFx(null), 1500); },
    onCallout: (c) => { setCallouts((cur) => [...cur.slice(-1), c]); window.setTimeout(() => setCallouts((cur) => cur.filter((x) => x.id !== c.id)), 1100); },
  }), []);
  // Reacciones compartidas: en una sala de este juego se envían a todos y se ven las de los demás.
  const activeRoom = getActiveRoom();
  const room = activeRoom && activeRoom.gameId === gameId ? activeRoom : null;
  const roomSnap = useRoom(room);
  const { name: myName, winStreak } = useWallet();
  const others = (roomSnap?.reactions ?? []).filter((r) => r.name !== myName);
  const emoteTimer = useRef<number | null>(null);
  const sendEmote = (text: string) => {
    room?.react(text);
    setEmote(text);
    if (emoteTimer.current) window.clearTimeout(emoteTimer.current);
    emoteTimer.current = window.setTimeout(() => setEmote(null), 2200);
  };
  useEffect(() => () => { if (emoteTimer.current) window.clearTimeout(emoteTimer.current); }, []);

  useEffect(() => {
    document.documentElement.classList.add('table-lock');
    return () => document.documentElement.classList.remove('table-lock');
  }, []);

  // Vibración corta al recibir el turno (flanco de subida del turno humano).
  const wasActive = useRef(false);
  const active = Boolean(timer?.active);
  useEffect(() => { if (active && !wasActive.current) feedback('turn'); wasActive.current = active; }, [active]);

  const exit = (): void => { if (onExit) onExit(); else void nav('/'); };

  return (
    <div className="musapp">
      <div className="app">
        <main
          className={`relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden ${shaking ? 'animate-shake' : ''} pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+12px)] text-stone-100 [--card-w:min(21.8vw,11.7dvh,136px)] lg:[--card-w:min(19vw,13dvh,151px)]`}
        >
          <div className="mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col justify-between gap-[min(1.1dvh,8px)] px-[clamp(8px,2.6vw,24px)]">
            <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
              <div className="flex items-center gap-1.5"><ExitButton onClick={exit} /><ProfileCard compact /></div>
              <div className="min-w-0">{header}</div>
              <QuickButtons onRules={() => setRules(true)} onSettings={() => setSettings(true)} />
            </header>
            {timer && <TurnTimer spec={timer} />}
            {strip && <section aria-label="Estado">{strip}</section>}
            <section
              ref={feltRef}
              className={`relative min-h-0 flex-1 overflow-hidden rounded-[clamp(22px,5vw,38px)] border border-[#D4AF37]/20 ring-1 ring-inset ring-white/5 ${slamFx ? 'animate-slam' : ''} shadow-[inset_0_0_60px_rgba(0,0,0,.4),0_10px_30px_rgba(0,0,0,.3)]`}
              style={{ background: feltTone === 'emerald' ? EMERALD_FELT : FELT_BG }}
              aria-label="Mesa de juego"
            >
              {felt}
              {slamFx && <SlamSparks key={slamFx.id} />}
              {chipFx && <ChipFlight key={chipFx.id} target={chipFx.target} n={chipFx.n} w={chipFx.w} h={chipFx.h} />}
              {/* foco cenital suave y viñeta cinematográfica */}
              <div aria-hidden className="pointer-events-none absolute inset-0 z-[15]" style={{ background: 'radial-gradient(ellipse at 50% 42%, rgba(255,236,190,.09) 0%, rgba(255,236,190,0) 55%), radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,.5) 100%)' }} />
              <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 flex flex-col items-center gap-1" aria-live="polite">
                {others.map((r) => (
                  <span key={r.id} className="rounded-full bg-amber-300 px-3 py-1 text-[12px] font-extrabold text-amber-950 shadow-lg">{r.name}: {r.text}</span>
                ))}
              </div>
              {winStreak >= 2 && <span className="pointer-events-none absolute right-2 top-2 z-20 rounded-full border border-orange-300/50 bg-orange-950/90 px-2.5 py-1 text-[11px] font-extrabold text-orange-200">🔥 Racha x{winStreak}</span>}
              <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center" aria-live="assertive">
                <AnimatePresence>
                  {callouts.map((c) => (
                    <motion.div key={c.id} className={`absolute px-3 text-center font-[var(--font-display)] text-[clamp(30px,10vw,52px)] font-black leading-none will-change-transform ${c.tone === 'red' ? 'text-red-400' : c.tone === 'neon' ? 'text-cyan-300' : 'text-amber-300'}`}
                      style={{ textShadow: '0 3px 0 rgba(0,0,0,.7), 0 0 18px currentColor' }}
                      initial={{ scale: 0.3, opacity: 0, y: 20 }} animate={{ scale: [0.3, 1.18, 1], opacity: 1, y: 0 }} exit={{ scale: 1.15, opacity: 0, y: -24 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}>{c.text}</motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <ReactionButton onSend={sendEmote} />
            </section>
            <section className="relative flex min-h-0 flex-col items-center gap-[min(.8dvh,6px)]" aria-label="Tu zona de juego">{bottom}<EmoteBubble text={emote} /></section>
          </div>
          {timer?.active && <div aria-hidden className="turn-glow pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20" style={{ background: 'linear-gradient(to top, rgba(240,195,95,.5), transparent)' }} />}
          {cinematic && <GameCinematic key={cinematic.id} title={cinematic.title} sub={cinematic.sub} tone={cinematic.tone} />}
          {overlays}
        </main>

        <SettingsModal open={settings} onClose={() => setSettings(false)} />
        <RulesModal game={rules ? game : null} onClose={() => setRules(false)} />
        <Toaster />
      </div>
    </div>
  );
}
