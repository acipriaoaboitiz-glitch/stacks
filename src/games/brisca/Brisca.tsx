import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { SeatBadge } from '../mus/app/components/SeatBadge.tsx';
import { TableAvatar } from '../mus/app/components/TableAvatar.tsx';
import { Button } from '../mus/app/components/ui.tsx';
import type { Bubble } from '../mus/app/game/describe.ts';
import type { SeatInfo } from '../mus/app/game/types.ts';
import { CardBack } from '../mus/app/components/CardFace.tsx';
import { SUIT_LABEL, type SpanishCard } from '../../engine/deck.ts';
import { aiDelay, feedback } from '../../store/settings.ts';
import { useT } from '../../i18n/index.ts';
import { wallet } from '../../store/wallet.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, FaceCard, briscaDeco, PhaseCinematic, PillBar, ResultOverlay, ScorePair, tilt, useBanner, useCine } from '../shared/kit.tsx';
import {
  botChoose, evaluateBriscaTrick, getBriscaScores, initBriscaGame, playBriscaCard, resolveTrick, sides, type BPlayer, type BriscaState,
} from './engine.ts';

const WIN_BONUS = 100;
const SEAT_NAMES = ['Tú', 'Rival 1', 'Tu pareja', 'Rival 2'];
type Slot = 'bottom' | 'right' | 'top' | 'left';

function makePlayers(count: 2 | 4): BPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`, human: i === 0, name: count === 2 ? (i === 0 ? 'Tú' : 'Bot') : SEAT_NAMES[i]!,
  }));
}
/** Sentido de juego antihorario: abajo → derecha → arriba → izquierda. */
const SLOT: Record<2 | 4, Slot[]> = { 2: ['bottom', 'top'], 4: ['bottom', 'right', 'top', 'left'] };
const DIR: Record<Slot, { x: number; y: number }> = { bottom: { x: 0, y: 1 }, right: { x: 1, y: 0 }, top: { x: 0, y: -1 }, left: { x: -1, y: 0 } };

/** Las cartas de la baza se agrupan y se deslizan hacia el montón del ganador. */
const trickVariants: Variants = {
  exit: (slot: Slot) => ({
    x: DIR[slot].x * 230, y: DIR[slot].y * 260, scale: 0.35, opacity: 0, rotate: 0,
    transition: { duration: 0.55, ease: [0.4, 0, 0.9, 0.4] },
  }),
};

const info = (i: number, name: string): SeatInfo => ({ seat: (i % 4) as SeatInfo['seat'], userId: null, name, isBot: true, online: true });

export default function Brisca() {
  const nav = useNavigate();
  const t = useT();
  // ?mode=1v1 | 2v2 arranca al instante (botón «Jugar contra la IA» del lobby).
  const [params] = useSearchParams();
  const preset = params.get('mode') === '1v1' ? 2 : params.get('mode') === '2v2' ? 4 : null;
  const [count, setCount] = useState<2 | 4 | null>(preset);
  const [s, setS] = useState<BriscaState | null>(() => (preset ? initBriscaGame(makePlayers(preset)) : null));
  const [bubbles, setBubbles] = useState<Record<string, Bubble | undefined>>({});
  const { banner, show } = useBanner();
  const { cine, show: showCine } = useCine();
  const paidRef = useRef(false);

  const start = (n: 2 | 4) => { setCount(n); setS(initBriscaGame(makePlayers(n))); setBubbles({}); paidRef.current = false; };

  useEffect(() => {
    if (!s) return;
    if (s.phase === 'trickDone') {
      const ev = evaluateBriscaTrick(s.currentTrick, s.trumpSuit);
      const winner = s.players.find((p) => p.id === ev.winnerId)!;
      const t = window.setTimeout(() => {
        feedback('trick');
        if (ev.points > 0) {
          show(`+${ev.points} PUNTOS`);
          const at = Date.now();
          setBubbles((b) => ({ ...b, [winner.id]: { text: `+${ev.points}`, tone: 'good', at } }));
          window.setTimeout(() => setBubbles((b) => (b[winner.id]?.at === at ? { ...b, [winner.id]: undefined } : b)), 2200);
        }
        setS((cur) => (cur ? resolveTrick(cur) : cur));
      }, aiDelay(1200));
      return () => window.clearTimeout(t);
    }
    if (s.phase !== 'playing') return;
    const p = s.players[s.turnIndex]!;
    if (p.human) return;
    const t = window.setTimeout(() => {
      setS((cur) => (cur && cur.phase === 'playing' && cur.players[cur.turnIndex]!.id === p.id
        ? playBriscaCard(cur, p.id, botChoose(cur, p.id)) : cur));
    }, aiDelay(850));
    return () => window.clearTimeout(t);
  }, [s, show]);

  useEffect(() => {
    if (s?.phase !== 'finished' || paidRef.current) return;
    paidRef.current = true;
    const { mine, theirs } = sides(s);
    if (mine > theirs) { wallet.add(WIN_BONUS); feedback('win'); showCine('¡VICTORIA!', `+${WIN_BONUS} fichas`); }
  }, [s, showCine]);

  const played = s?.currentTrick.length ?? 0;
  useEffect(() => { if (played > 0) feedback('deal'); }, [played]);

  const play = useCallback((c: SpanishCard) => {
    setS((cur) => (cur && cur.phase === 'playing' && cur.players[cur.turnIndex]!.human ? playBriscaCard(cur, 'p0', c.id) : cur));
  }, []);

  if (!count || !s) {
    return (
      <GameFrame
        gameId="brisca"
        header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">Brisca</p>}
        felt={
          <div className="grid h-full place-items-center p-6">
            <div className="grid w-full max-w-xs gap-3 text-center">
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-amber-300">{t('a.format')}</h2>
              <Button variant="primary" block onClick={() => start(2)}>1 vs 1 · contra la IA</Button>
              <Button variant="secondary" block onClick={() => start(4)}>2 vs 2 · con compañero IA</Button>
              <p className="text-xs text-stone-400">Gana quien sume más de 60 de los 120 puntos. La carta de la pinta marca el triunfo.</p>
            </div>
          </div>
        }
        bottom={null}
      />
    );
  }

  const slots = SLOT[count];
  const slotOf = (id: string): Slot => slots[s.players.findIndex((p) => p.id === id)]!;
  const myTurn = s.phase === 'playing' && s.players[s.turnIndex]!.human;
  const done = s.phase === 'finished';
  const sc = getBriscaScores(s);
  const { mine, theirs } = sides(s);
  const winnerSlot: Slot = s.lastTrickWinner ? slotOf(s.lastTrickWinner) : 'bottom';
  const decided = s.phase === 'trickDone' ? evaluateBriscaTrick(s.currentTrick, s.trumpSuit).winnerId : null;
  const seat = (slot: 'top' | 'left' | 'right') => {
    const i = slots.indexOf(slot);
    if (i === -1) return null;
    const p = s.players[i]!;
    return { p, i, hand: s.hands[p.id]!.length, active: s.turnIndex === i && s.phase === 'playing' };
  };
  const badge = (x: NonNullable<ReturnType<typeof seat>>, side: 'below' | 'left' | 'right') => (
    <SeatBadge info={info(x.i, x.p.name)} tone={count === 4 ? (x.i % 2 === 0 ? 'us' : 'them') : 'them'} mano={false}
      turn={x.active} bubble={bubbles[x.p.id]} deadline={null} cards={x.hand} bubbleSide={side} />
  );
  const top = seat('top'), left = seat('left'), right = seat('right');
  const off = (slot: Slot) => {
    const sx = count === 4 ? 0.58 : 0;
    const sy = count === 4 ? 0.62 : 0.34;
    return { bottom: { x: 0, y: sy }, top: { x: 0, y: -sy }, right: { x: sx, y: 0 }, left: { x: -sx, y: 0 } }[slot];
  };
  const status = done ? '' : s.phase === 'trickDone' ? 'Baza completa…' : myTurn ? 'Tu turno: toca una carta' : `Juega ${s.players[s.turnIndex]!.name}…`;
  const myTricks = Math.round(s.wonCards.p0!.length / s.players.length);

  const felt = (
    <>
      <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-1 p-[clamp(6px,2vw,16px)]">
        <div className="col-start-2 row-start-1 justify-self-center">{top && badge(top, 'below')}</div>
        <div className="col-start-1 row-span-2 row-start-1 self-center justify-self-center">{left && badge(left, 'left')}</div>
        <div className="relative col-start-2 row-start-2 min-h-0" aria-label="Baza en mesa">
          <AnimatePresence custom={winnerSlot}>
            {s.currentTrick.map((t) => {
              const slot = slotOf(t.playerId);
              const o = off(slot);
              const human = s.players.find((p) => p.id === t.playerId)!.human;
              return (
                <motion.div key={t.card.id} className="absolute left-1/2 top-1/2" custom={winnerSlot} variants={trickVariants} exit="exit"
                  style={{ marginLeft: `calc(var(--card-w) * ${-0.36 + o.x})`, marginTop: `calc(var(--card-w) * ${-0.57 + o.y})`, zIndex: 2 }}
                  initial={human ? false : { x: DIR[slot].x * 160, y: DIR[slot].y * 160, opacity: 0, scale: 1.15 }}
                  animate={{ x: 0, y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 22 }}>
                  <FaceCard card={t.card} scale={0.72} layoutId={t.card.id} rotate={tilt(t.card.id)} glow={decided === t.playerId} {...briscaDeco(t.card, s.trumpSuit)} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="col-start-3 row-span-2 row-start-1 self-center justify-self-center">{right && badge(right, 'right')}</div>
      </div>

      {/* Mazo y triunfo, en la esquina del tapete */}
      <div className="absolute left-[clamp(6px,2vw,14px)] top-[clamp(6px,2vw,14px)] z-10 flex items-center gap-1.5" aria-label={`Quedan ${s.deck.length} cartas; triunfo ${SUIT_LABEL[s.trumpSuit]}`}>
        {/* La muestra (triunfo) va atravesada bajo el mazo: es la última carta que se roba */}
        <div className="relative h-[calc(var(--card-w)*.4*1.583)] w-[calc(var(--card-w)*.84)]">
          <div className="absolute top-0 z-0" style={{ left: 'calc(var(--card-w) * .3165)' }}>
            <FaceCard card={s.trumpCard} scale={0.4} rotate={90} aura />
          </div>
          <div className="absolute left-0 top-0 z-10 aspect-[12/19] w-[calc(var(--card-w)*.4)]">
            {[2, 1, 0].map((k) => (
              <span key={k} className="absolute inset-0 overflow-hidden rounded-[6px] shadow-[0_4px_8px_rgba(0,0,0,.4)]" style={{ transform: `translate(${k * 2}px, ${-k * 2}px)` }}><CardBack /></span>
            ))}
          </div>
        </div>
        <span className="font-mono text-[10px] text-amber-200/80">{s.deck.length}</span>
      </div>
      <Banner text={banner} />
    </>
  );

  const bottom = (
    <>
      <div className="relative flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TableAvatar name="Tú" tone="me" className="size-9 text-[15px]" />
          <b className={`truncate text-[13px] ${myTurn ? 'text-amber-200' : 'text-stone-200'}`}>Tú</b>
          <span className="rounded-full border border-white/10 bg-zinc-900/70 px-2 py-[2px] text-[10px] font-bold text-stone-300">{myTricks} bazas</span>
        </div>
        <span className="text-[11px] text-stone-400">Triunfo: <b className="text-amber-200">{SUIT_LABEL[s.trumpSuit]}</b></span>
      </div>
      <PillBar pills={[]} idle={status} />
      <div className="flex items-end justify-center gap-[min(2vw,12px)] pt-[min(3.4dvh,26px)]" role="group" aria-label="Tu mano">
        {s.hands.p0!.map((c, i, arr) => (
          <FaceCard key={c.id} card={c} layoutId={c.id} rotate={(i - (arr.length - 1) / 2) * 1.8} dim={!myTurn} {...briscaDeco(c, s.trumpSuit)}
            onClick={myTurn ? () => play(c) : undefined} />
        ))}
      </div>
    </>
  );

  return (
    <GameFrame
      gameId="brisca"
      header={<ScorePair labels={count === 4 ? ['Nosotros', 'Ellos'] : ['Tú', 'Bot']} values={[mine, theirs]} target={120} />}
      felt={felt}
      bottom={bottom}
      overlays={
        <>
          <PhaseCinematic cine={cine} />
          <AnimatePresence>
            {done && (
              <ResultOverlay
                title={mine > theirs ? '¡Ganas la partida!' : mine < theirs ? 'Pierdes la partida' : 'Empate a 60'}
                actions={[
                  { label: t('a.rematch'), primary: true, onClick: () => start(count) },
                  { label: 'Cambiar formato', onClick: () => { setCount(null); setS(null); } },
                  { label: t('a.lobby'), onClick: () => nav('/') },
                ]}
              >
                <ScorePair labels={sc.mode === 'teams' ? [sc.teamA.label, sc.teamB.label] : ['Tú', 'Bot']} values={[mine, theirs]} target={120} />
                {mine > theirs && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{WIN_BONUS} fichas de premio</p>}
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
}
