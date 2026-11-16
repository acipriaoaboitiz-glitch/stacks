import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { feedback } from '../../store/settings.ts';
import { getActiveRoom, useRoom } from '../../services/multiplayer.ts';
import { useWallet } from '../../store/wallet.ts';
import { useNavigate } from 'react-router-dom';
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

const FELT_BG =
  'radial-gradient(ellipse at 50% 52%, var(--tapete-glow), transparent 52%), radial-gradient(ellipse at center, var(--tapete-a), var(--tapete-b) 72%, var(--tapete-c) 100%)';

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

function Frame({ gameId, header, strip, felt, bottom, overlays, onExit, timer }: Props) {
  const nav = useNavigate();
  const game = findGame(gameId)!;
  const [settings, setSettings] = useState(false);
  const [rules, setRules] = useState(false);
  const [emote, setEmote] = useState<string | null>(null);
  // Reacciones compartidas: en una sala de este juego se envían a todos y se ven las de los demás.
  const activeRoom = getActiveRoom();
  const room = activeRoom && activeRoom.gameId === gameId ? activeRoom : null;
  const roomSnap = useRoom(room);
  const myName = useWallet().name;
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
          className="relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+12px)] text-stone-100"
          style={{ '--card-w': 'min(19vw,10.2dvh,118px)' } as CSSProperties}
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
              className="relative min-h-0 flex-1 overflow-hidden rounded-[clamp(22px,5vw,38px)] border border-amber-200/10 shadow-[inset_0_0_60px_rgba(0,0,0,.4),0_10px_30px_rgba(0,0,0,.3)]"
              style={{ background: FELT_BG }}
              aria-label="Mesa de juego"
            >
              {felt}
              <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 flex flex-col items-center gap-1" aria-live="polite">
                {others.map((r) => (
                  <span key={r.id} className="rounded-full bg-amber-300 px-3 py-1 text-[12px] font-extrabold text-amber-950 shadow-lg">{r.name}: {r.text}</span>
                ))}
              </div>
              <ReactionButton onSend={sendEmote} />
            </section>
            <section className="relative flex min-h-0 flex-col items-center gap-[min(.8dvh,6px)]" aria-label="Tu zona de juego">{bottom}<EmoteBubble text={emote} /></section>
          </div>
          {overlays}
        </main>

        <SettingsModal open={settings} onClose={() => setSettings(false)} />
        <RulesModal game={rules ? game : null} onClose={() => setRules(false)} />
        <Toaster />
      </div>
    </div>
  );
}
