import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { setActiveRoom } from '../../services/multiplayer.ts';
import { useReplica, useSeating } from '../../services/onlineGame.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { CASINO_VALUES, CasinoChip, ChipPile } from '../../components/cards/CasinoChip.tsx';
import { TableAvatar } from '../mus/app/components/TableAvatar.tsx';
import { useT } from '../../i18n/index.ts';
import { botDelay, feedback } from '../../store/settings.ts';
import { wallet } from '../../store/wallet.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, FaceCard, PhaseCinematic, PillBar, ResultOverlay, ScoreStrip, useBanner, useCine, type PillSpec } from '../shared/kit.tsx';
import { BB, START_STACK, act, applyPokerAction, bestScore, botAct, handName, legal, newPoker, pot, type PAction, type PPlayer, type PokerAction, type PokerState } from './engine.ts';

const WIN_BONUS = 200;
const NAMES = ['Tú', 'Jon', 'Nerea', 'Aitor', 'Maite', 'Unai'];
type Slot = 'bottom' | 'right' | 'top' | 'left';
const STREET: Record<string, string> = { preflop: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Showdown' };

function SeatView({ s, i, slot }: { s: PokerState; i: number; slot: Slot }) {
  const x = s.seats[i]!;
  const turn = s.phase === 'betting' && s.turn === i;
  const shown = !!s.result?.shown[i];
  const win = s.result?.wins.find((w) => w.seat === i);
  return (
    <div className={`relative grid min-w-0 justify-items-center gap-[2px] ${x.out ? 'opacity-30' : x.folded ? 'opacity-55' : ''}`} aria-label={`${s.players[i]!.name}, ${x.stack} fichas`}>
      <div className="relative grid place-items-center rounded-full p-[3px]">
        {turn && <motion.span aria-hidden className="pointer-events-none absolute inset-[-2px] rounded-full border-[1.5px] border-amber-200/80 shadow-[0_0_14px_rgba(242,202,112,.55)]"
          animate={{ opacity: [0.7, 1, 0.7], scale: [0.98, 1.05, 0.98] }} transition={{ duration: 1.6, repeat: Infinity }} />}
        <TableAvatar name={s.players[i]!.name} tone="them" className="size-[min(11vw,6dvh,52px)] text-[min(4.4vw,2.4dvh)]" />
        {s.button === i && !x.out && <span title="Dealer" className="absolute -right-1 -top-1 grid size-[17px] place-items-center rounded-full border-2 border-[#0b211a] bg-white text-[9px] font-extrabold text-zinc-900">D</span>}
      </div>
      <span className={`max-w-full truncate text-[11px] font-bold ${turn ? 'text-amber-200' : 'text-stone-200'}`}>{s.players[i]!.name}</span>
      <span className="font-mono text-[11px] font-bold text-amber-200 tabular-nums">{x.out ? '✕' : x.stack}</span>
      {!x.out && !x.folded && slot !== 'bottom' && (
        <div className="flex">
          {x.hole.map((c, k) => (
            <div key={c.id} style={{ marginLeft: k ? 'calc(var(--card-w) * -0.12)' : 0 }}><FaceCard card={c} faceDown={!shown} scale={0.4} glow={!!win} /></div>
          ))}
        </div>
      )}
      {x.bet > 0 && !x.out && <ChipPile amount={x.bet} size={15} maxCols={3} />}
      <AnimatePresence>
        {(x.last || x.bet > 0) && !x.out && (
          <motion.span key={`${x.last}-${x.bet}`} initial={{ opacity: 0, y: -4, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
            className={`rounded-full px-2 py-[1px] text-[10px] font-extrabold ${x.folded ? 'bg-zinc-800 text-stone-400' : 'bg-amber-300 text-amber-950'}`}>
            {x.folded ? 'Retirada' : x.bet > 0 ? `${x.last ?? ''} ${x.last?.startsWith('Sube') ? '' : x.bet}`.trim() : x.last}
          </motion.span>
        )}
      </AnimatePresence>
      {win && <span className="rounded-full bg-emerald-600 px-2 py-[1px] text-[10px] font-extrabold text-white">+{win.amount}{win.hand ? ` · ${win.hand}` : ''}</span>}
    </div>
  );
}

interface TableProps {
  s: PokerState;
  setS: Dispatch<SetStateAction<PokerState | null>>;
  dispatch: (a: PokerAction) => void;
  online: boolean;
  myIdx: number;
  hostLike: boolean;
  /** Online: el anfitrión vuelve a repartir la partida. Local: reinicia con el mismo tamaño de mesa. */
  restart: () => void;
  exit: () => void;
}

export default function Poker() {
  const nav = useNavigate();
  const seating = useSeating('poker');
  const online = seating.online;
  const [n, setN] = useState<4 | 6 | null>(null);
  const [s, setS] = useState<PokerState | null>(null);
  const hostLike = !online || seating.isHost;
  const myIdx = online ? Math.max(0, s?.players.findIndex((p) => p.peerId === seating.myPeerId) ?? 0) : 0;
  const meId = s?.players[myIdx]?.id ?? 'p0';
  const local = (size: number): PokerState => newPoker(NAMES.slice(0, size).map((name, i) => ({ id: `p${i}`, name, human: i === 0 })));

  // Online: el anfitrión reparte con los humanos de la sala (2–4) y rellena con bots si está activado.
  const hostStart = () => {
    const humans = seating.humans;
    const size = Math.min(4, Math.max(2, seating.fillBots ? 4 : humans.length));
    const players: PPlayer[] = Array.from({ length: size }, (_, i) => i < humans.length
      ? { id: `p${i}`, name: humans[i]!.name, human: true, peerId: humans[i]!.peerId }
      : { id: `p${i}`, name: NAMES[i - humans.length + 1] ?? `Bot ${i}`, human: false });
    setS(newPoker(players));
  };
  const noS = s === null;
  useEffect(() => { if (online && seating.isHost && noS) hostStart(); }, [online, seating.isHost, noS]); // eslint-disable-line
  const { dispatch } = useReplica<PokerState, PokerAction>(seating, s, setS, applyPokerAction, (st, peer) => st.players.find((q) => q.peerId === peer)?.id ?? null);
  const exit = () => { if (online) setActiveRoom(null); nav('/'); };

  if (online && !s) {
    return (
      <GameFrame gameId="poker" onExit={exit}
        header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">Texas Hold’em</p>}
        felt={<div className="grid h-full place-items-center p-6 text-center"><p className="text-sm font-bold text-stone-300">Conectando con la mesa…</p></div>}
        bottom={null} />
    );
  }
  if (!online && (!n || !s)) {
    return (
      <GameFrame
        gameId="poker"
        header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">Texas Hold’em</p>}
        felt={
          <div className="grid h-full place-items-center p-6">
            <div className="grid w-full max-w-xs gap-3 text-center">
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-amber-300">Elige la mesa</h2>
              <button type="button" className="btn btn--gold" onClick={() => { setN(4); setS(local(4)); }}>Mesa de 4 · tú + 3 IA</button>
              <button type="button" className="btn" onClick={() => { setN(6); setS(local(6)); }}>Mesa de 6 · tú + 5 IA</button>
              <p className="text-xs text-stone-400">No-Limit Hold’em. Ciegas 10/20, 1000 fichas cada uno. 15 s por turno.</p>
            </div>
          </div>
        }
        bottom={null}
      />
    );
  }
  return (
    <PokerTable key={online ? 'online' : n} s={s!} setS={setS} online={online} myIdx={myIdx} hostLike={hostLike} exit={exit}
      dispatch={(a) => dispatch(meId, a)} restart={online ? hostStart : () => setS(local(n!))} />
  );
}

function PokerTable({ s, setS, dispatch, online, myIdx, hostLike, restart, exit }: TableProps) {
  const t = useT();
  const n = s.players.length;
  const nm = (i: number): string => s.players[i]!.name;
  const [raising, setRaising] = useState<number | null>(null);
  const { banner, show } = useBanner(1500);
  const { cine, show: showCine } = useCine();
  const paid = useRef(false);
  const prevCommunity = useRef(0);

  // Turno de los bots (solo el anfitrión, o en local).
  useEffect(() => {
    if (s.phase !== 'betting' || !hostLike || s.players[s.turn]!.human) return;
    const timer = window.setTimeout(() => {
      setS((cur) => {
        if (!cur || cur.phase !== 'betting' || cur.players[cur.turn]!.human) return cur;
        return act(cur, botAct(cur)) ?? act(cur, { type: 'fold' }) ?? cur;
      });
    }, botDelay());
    return () => window.clearTimeout(timer);
  }, [s, hostLike, setS]);

  // Sonidos y avisos.
  useEffect(() => {
    if (s.community.length !== prevCommunity.current) { if (s.community.length > prevCommunity.current) feedback('deal'); prevCommunity.current = s.community.length; }
  }, [s.community.length]);
  const lastBets = useRef(0);
  useEffect(() => {
    const total = pot(s);
    if (total > lastBets.current) feedback('chip');
    lastBets.current = total;
  }, [s]);
  useEffect(() => {
    if (s.phase === 'handOver' && s.result) {
      const mine = s.result.wins.find((w) => w.seat === myIdx);
      if (mine) { feedback('win'); show(`+${mine.amount} ${mine.hand ? `· ${mine.hand}` : ''}`); }
    }
    if (s.phase === 'betting') paid.current = false;
    if (s.phase === 'gameOver' && !paid.current) {
      paid.current = true;
      if (s.winner === myIdx) { wallet.add(WIN_BONUS); wallet.recordWin('poker'); feedback('win'); showCine('¡CAMPEÓN!', `+${WIN_BONUS} fichas`); }
    }
  }, [s.phase, s.result, s.winner, show, showCine, myIdx]);

  const me = s.seats[myIdx]!;
  const myTurn = s.phase === 'betting' && s.turn === myIdx;
  const lg = useMemo(() => (myTurn ? legal(s) : null), [s, myTurn]);
  const send = (a: PAction) => { setRaising(null); if (myTurn) dispatch({ k: 'act', a }); };
  const total = pot(s);
  const myHand = me.hole.length === 2 && s.community.length >= 3 ? handName(bestScore([...me.hole, ...s.community])) : '';

  const pills: PillSpec[] = [];
  if (myTurn && lg && raising === null) {
    pills.push({ id: 'fold', tone: 'danger', label: t('a.fold'), onPress: () => send({ type: 'fold' }) });
    pills.push(lg.canCheck
      ? { id: 'check', tone: 'ok', label: t('a.check'), onPress: () => send({ type: 'check' }) }
      : { id: 'call', tone: 'ok', label: `${t('a.call')} ${lg.callAmount}${lg.callAmount >= me.stack ? ' · all-in' : ''}`, onPress: () => send({ type: 'call' }) });
    if (lg.canRaise) pills.push({ id: 'raise', tone: 'gold', label: `${t('a.raise')}…`, onPress: () => setRaising(lg.minTo) });
  } else if (s.phase === 'handOver') {
    pills.push({ id: 'next', tone: 'gold', label: t('a.next'), onPress: () => dispatch({ k: 'next' }) });
  }

  const status = s.phase === 'handOver' && s.result
    ? s.result.wins.map((w) => `${nm(w.seat)} +${w.amount}${w.hand ? ` (${w.hand})` : ''}`).join(' · ')
    : myTurn ? (lg!.canCheck ? 'Te toca: pasa o apuesta' : `Te toca: ${lg!.callAmount} para igualar`) : s.phase === 'betting' ? `Juega ${nm(s.turn)}…` : '';

  // La posición k (1 = derecha, 2 = arriba, 3 = izquierda…) es el jugador que va k asientos después de mí.
  const seat = (k: number, slot: Slot) => (k < n ? <SeatView s={s} i={(myIdx + k) % n} slot={slot} /> : null);
  const six = n === 6;
  const flip = (c: PokerState['community'][number], k: number) => (
    <motion.div key={c.id} style={{ perspective: 600 }} initial={{ rotateY: 90, y: -24, opacity: 0 }} animate={{ rotateY: 0, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 18, delay: k >= 3 ? 0 : k * 0.12 }}>
      <FaceCard card={c} scale={0.5} />
    </motion.div>
  );
  const felt = (
    <>
      <div className="grid h-full grid-cols-[minmax(0,.8fr)_minmax(0,2.5fr)_minmax(0,.8fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-1 p-[clamp(6px,2vw,16px)]">
        {six ? (
          <>
            <div className="col-start-1 row-start-1 justify-self-center">{seat(4, 'left')}</div>
            <div className="col-start-2 row-start-1 justify-self-center">{seat(3, 'top')}</div>
            <div className="col-start-3 row-start-1 justify-self-center">{seat(2, 'right')}</div>
            <div className="col-start-1 row-start-2 self-center justify-self-center">{seat(5, 'left')}</div>
            <div className="col-start-3 row-start-2 self-center justify-self-center">{seat(1, 'right')}</div>
          </>
        ) : (
          <>
            <div className="col-start-2 row-start-1 justify-self-center">{seat(2, 'top')}</div>
            <div className="col-start-1 row-span-2 row-start-1 self-center justify-self-center">{seat(3, 'left')}</div>
            <div className="col-start-3 row-span-2 row-start-1 self-center justify-self-center">{seat(1, 'right')}</div>
          </>
        )}
        <div className="col-start-2 row-start-2 grid min-h-0 place-items-center">
          <div className="grid justify-items-center gap-2">
            <div className="grid justify-items-center gap-1" aria-label={`Bote ${total}`}>
              <ChipPile amount={s.seats.reduce((a2, x) => a2 + x.committed, 0)} size={22} />
              <span className="font-mono rounded-full border border-white/10 bg-black/35 px-3 py-0.5 text-sm font-bold text-amber-200 tabular-nums">Bote {total}</span>
            </div>
            <div className="flex items-center justify-center gap-[min(1vw,5px)]" aria-label="Cartas comunitarias">
              {Array.from({ length: 5 }, (_, k) => {
                const c = s.community[k];
                return c ? flip(c, k) : <span key={k} className="block aspect-[167/243] border border-dashed border-white/15" style={{ width: 'calc(var(--card-w) * 0.5)' }} />;
              })}
            </div>
            <span className="rounded-full bg-black/35 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-200/80">{STREET[s.street]} · mano {s.handNo}</span>
          </div>
        </div>
      </div>
      <Banner text={banner} />
    </>
  );

  const bottom = (
    <>
      <div className="relative flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TableAvatar name={nm(myIdx)} tone="me" active={myTurn} className="size-9 text-[15px]" />
          <b className={`truncate text-[13px] ${myTurn ? 'text-amber-200' : 'text-stone-200'}`}>{online ? nm(myIdx) : t('g.you')}</b>
          <span className="font-mono rounded-full border border-white/10 bg-zinc-900/70 px-2 py-[2px] text-[10px] font-bold text-amber-200">{me.stack}{me.bet > 0 ? ` · apuesta ${me.bet}` : ''}</span>
          {s.button === myIdx && <span className="grid size-[17px] place-items-center rounded-full bg-white text-[9px] font-extrabold text-zinc-900">D</span>}
        </div>
        <span className="truncate text-right text-[11px] text-stone-400">{myHand || status}</span>
      </div>
      {raising !== null && lg ? (
        <div className="grid w-full max-w-md gap-2 rounded-2xl border border-white/10 bg-zinc-900/75 p-2.5 backdrop-blur-md" role="group" aria-label="Subir apuesta">
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {([['2x BB', () => setRaising(((v: number) => Math.min(lg.maxTo, Math.max(lg.minTo, Math.round(v))))(s.currentBet + BB * 2))], ['½ Bote', () => setRaising(((v: number) => Math.min(lg.maxTo, Math.max(lg.minTo, Math.round(v))))(s.currentBet + total / 2))], ['Bote', () => setRaising(((v: number) => Math.min(lg.maxTo, Math.max(lg.minTo, Math.round(v))))(s.currentBet + total))]] as const).map(([lab, fn]) => (
                <button key={lab} type="button" className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-bold" onClick={fn}>{lab}</button>
              ))}
              <button type="button" className="rounded-full border border-red-300/40 bg-red-950 px-3 py-1 text-[12px] font-bold" onClick={() => setRaising(lg.maxTo)}>All-In</button>
              <button type="button" className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-bold" onClick={() => setRaising(lg.minTo)}>Mín.</button>
            </div>
            <div className="grid justify-items-center"><ChipPile amount={raising} size={22} maxCols={4} /><b className="font-mono text-lg text-amber-300 tabular-nums">{raising}</b></div>
          </div>
          <div className="flex items-center justify-between" role="group" aria-label="Rack de fichas">
            {CASINO_VALUES.map((v) => <CasinoChip key={v} value={v} size={40} onClick={() => setRaising(((v: number) => Math.min(lg.maxTo, Math.max(lg.minTo, Math.round(v))))(raising + v))} disabled={raising >= lg.maxTo} />)}
          </div>
          <input type="range" min={lg.minTo} max={lg.maxTo} step={Math.max(1, Math.min(10, lg.maxTo - lg.minTo))} value={raising} aria-label="Cantidad"
            onChange={(e) => setRaising(Number(e.target.value))} className="w-full accent-amber-400" />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="h-10 rounded-full border border-white/15 bg-white/10 text-[13px] font-bold" onClick={() => setRaising(null)}>{t('a.cancel')}</button>
            <button type="button" className="h-10 rounded-full border border-amber-200 bg-gradient-to-br from-amber-300 to-amber-500 text-[13px] font-extrabold text-amber-950" onClick={() => send({ type: 'raise', to: raising })}>
              {raising >= lg.maxTo ? 'All-in' : `${t('a.raise')} a ${raising}`}
            </button>
          </div>
        </div>
      ) : <PillBar pills={pills} idle={status} />}
      <div className="flex items-end justify-center gap-[min(2vw,10px)] pt-[min(1.4dvh,10px)]" role="group" aria-label="Tus cartas">
        {me.hole.map((c, i) => (
          <FaceCard key={c.id} card={c} scale={0.92} rotate={i === 0 ? -4 : 4} dim={me.folded} />
        ))}
      </div>
    </>
  );

  const over = s.phase === 'gameOver';
  return (
    <GameFrame
      gameId="poker"
      onExit={online ? exit : undefined}
      timer={{ active: myTurn, id: `${s.turn}:${s.street}:${total}`, onTimeout: () => send(lg?.canCheck ? { type: 'check' } : { type: 'fold' }) }}
      header={<ScoreStrip items={(n === 6 ? [myIdx] : s.seats.map((_, i) => i)).map((i) => ({ name: nm(i), value: s.seats[i]!.stack, us: i === myIdx })).concat(n === 6 ? [{ name: "Mano", value: s.handNo, us: false }] : [])} />}
      felt={felt}
      bottom={bottom}
      overlays={
        <>
          <PhaseCinematic cine={cine} />
          <AnimatePresence>
            {over && (
              <ResultOverlay
                title={s.winner === myIdx ? t('g.win') : `Gana ${nm(s.winner ?? 0)}`}
                actions={[...(hostLike ? [{ label: t('a.rematch'), primary: true, onClick: () => { paid.current = false; restart(); } }] : []), { label: t('a.lobby'), onClick: exit }]}
              >
                <ul className="grid gap-1 text-sm">
                  {[...s.seats.keys()].sort((a, b) => s.seats[b]!.stack - s.seats[a]!.stack).map((i) => (
                    <li key={i} className="flex justify-between border-b border-white/10 py-1">
                      <span className={i === s.winner ? 'font-bold text-amber-300' : ''}>{nm(i)}</span>
                      <span className="font-mono tabular-nums text-stone-300">{s.seats[i]!.stack} / {START_STACK * n}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-center text-[11px] text-stone-400">Ciegas {BB / 2}/{BB} · {s.handNo} manos</p>
                {s.winner === myIdx && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{WIN_BONUS} fichas de premio</p>}
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
}
