import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChipStack } from '../../components/cards/Chip.tsx';
import { TableAvatar } from '../mus/app/components/TableAvatar.tsx';
import { useT } from '../../i18n/index.ts';
import { aiDelay, feedback } from '../../store/settings.ts';
import { wallet } from '../../store/wallet.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, FaceCard, PhaseCinematic, PillBar, ResultOverlay, ScoreStrip, useBanner, useCine, type PillSpec } from '../shared/kit.tsx';
import { BB, START_STACK, act, bestScore, botAct, handName, legal, newPoker, nextHand, pot, type PAction, type PokerState } from './engine.ts';

const WIN_BONUS = 200;
const NAMES = ['Tú', 'Jon', 'Nerea', 'Aitor'];
type Slot = 'bottom' | 'right' | 'top' | 'left';
const SLOT: Slot[] = ['bottom', 'right', 'top', 'left'];
const STREET: Record<string, string> = { preflop: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Showdown' };

function SeatView({ s, i, slot }: { s: PokerState; i: number; slot: Slot }) {
  const x = s.seats[i]!;
  const turn = s.phase === 'betting' && s.turn === i;
  const shown = !!s.result?.shown[i];
  const win = s.result?.wins.find((w) => w.seat === i);
  return (
    <div className={`relative grid min-w-0 justify-items-center gap-[2px] ${x.out ? 'opacity-30' : x.folded ? 'opacity-55' : ''}`} aria-label={`${NAMES[i]}, ${x.stack} fichas`}>
      <div className="relative grid place-items-center rounded-full p-[3px]">
        {turn && <motion.span aria-hidden className="pointer-events-none absolute inset-[-2px] rounded-full border-[1.5px] border-amber-200/80 shadow-[0_0_14px_rgba(242,202,112,.55)]"
          animate={{ opacity: [0.7, 1, 0.7], scale: [0.98, 1.05, 0.98] }} transition={{ duration: 1.6, repeat: Infinity }} />}
        <TableAvatar name={NAMES[i]!} tone="them" className="size-[min(11vw,6dvh,52px)] text-[min(4.4vw,2.4dvh)]" />
        {s.button === i && !x.out && <span title="Dealer" className="absolute -right-1 -top-1 grid size-[17px] place-items-center rounded-full border-2 border-[#0b211a] bg-white text-[9px] font-extrabold text-zinc-900">D</span>}
      </div>
      <span className={`max-w-full truncate text-[11px] font-bold ${turn ? 'text-amber-200' : 'text-stone-200'}`}>{NAMES[i]}</span>
      <span className="font-mono text-[11px] font-bold text-amber-200 tabular-nums">{x.out ? '✕' : x.stack}</span>
      {!x.out && !x.folded && slot !== 'bottom' && (
        <div className="flex">
          {x.hole.map((c, k) => (
            <div key={c.id} style={{ marginLeft: k ? 'calc(var(--card-w) * -0.12)' : 0 }}><FaceCard card={c} faceDown={!shown} scale={0.4} glow={!!win} /></div>
          ))}
        </div>
      )}
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

export default function Poker() {
  const nav = useNavigate();
  const t = useT();
  const [s, setS] = useState<PokerState>(() => newPoker(NAMES.map((name, i) => ({ id: `p${i}`, name, human: i === 0 }))));
  const [raising, setRaising] = useState<number | null>(null);
  const { banner, show } = useBanner(1500);
  const { cine, show: showCine } = useCine();
  const ref = useRef(s);
  ref.current = s;
  const paid = useRef(false);
  const prevCommunity = useRef(0);

  // Turno de los bots.
  useEffect(() => {
    if (s.phase !== 'betting' || s.turn === 0) return;
    const timer = window.setTimeout(() => {
      const cur = ref.current;
      if (cur.phase !== 'betting' || cur.turn === 0) return;
      const nx = act(cur, botAct(cur)) ?? act(cur, { type: 'fold' });
      if (nx) setS(nx);
    }, aiDelay(950 + Math.random() * 500));
    return () => window.clearTimeout(timer);
  }, [s]);

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
      const me = s.result.wins.find((w) => w.seat === 0);
      if (me) { feedback('win'); show(`+${me.amount} ${me.hand ? `· ${me.hand}` : ''}`); }
    }
    if (s.phase === 'gameOver' && !paid.current) {
      paid.current = true;
      if (s.winner === 0) { wallet.add(WIN_BONUS); feedback('win'); showCine('¡CAMPEÓN!', `+${WIN_BONUS} fichas`); }
    }
  }, [s.phase, s.result, s.winner, show, showCine]);

  const me = s.seats[0]!;
  const myTurn = s.phase === 'betting' && s.turn === 0;
  const lg = useMemo(() => (myTurn ? legal(s) : null), [s, myTurn]);
  const send = (a: PAction) => { setRaising(null); const nx = act(s, a); if (nx) setS(nx); };
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
    pills.push({ id: 'next', tone: 'gold', label: t('a.next'), onPress: () => { setS(nextHand(s)); } });
  }

  const status = s.phase === 'handOver' && s.result
    ? s.result.wins.map((w) => `${NAMES[w.seat]} +${w.amount}${w.hand ? ` (${w.hand})` : ''}`).join(' · ')
    : myTurn ? (lg!.canCheck ? 'Tu turno: pasa o apuesta' : `Tu turno: ${lg!.callAmount} para igualar`) : s.phase === 'betting' ? `Juega ${NAMES[s.turn]}…` : '';

  const slotIdx = (slot: Slot): number => SLOT.indexOf(slot);
  const felt = (
    <>
      <div className="grid h-full grid-cols-[minmax(0,.8fr)_minmax(0,2.5fr)_minmax(0,.8fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-1 p-[clamp(6px,2vw,16px)]">
        <div className="col-start-2 row-start-1 justify-self-center"><SeatView s={s} i={slotIdx('top')} slot="top" /></div>
        <div className="col-start-1 row-span-2 row-start-1 self-center justify-self-center"><SeatView s={s} i={slotIdx('left')} slot="left" /></div>
        <div className="col-start-2 row-start-2 grid min-h-0 place-items-center">
          <div className="grid justify-items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1" aria-label={`Bote ${total}`}>
              {total > 0 && <ChipStack amount={Math.min(total, 500)} size={22} />}
              <span className="font-mono text-sm font-bold text-amber-200 tabular-nums">Bote {total}</span>
            </div>
            <div className="flex items-center justify-center gap-[min(1vw,5px)]" aria-label="Cartas comunitarias">
              {Array.from({ length: 5 }, (_, k) => {
                const c = s.community[k];
                return c ? (
                  <motion.div key={c.id} initial={{ y: -30, opacity: 0, rotate: -8 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22, delay: (k >= 3 ? 0 : k * 0.08) }}>
                    <FaceCard card={c} scale={0.5} />
                  </motion.div>
                ) : <span key={k} className="block aspect-[167/243] rounded-[6px] border border-dashed border-white/15" style={{ width: 'calc(var(--card-w) * 0.5)' }} />;
              })}
            </div>
            <span className="rounded-full bg-black/35 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-200/80">{STREET[s.street]} · mano {s.handNo}</span>
          </div>
        </div>
        <div className="col-start-3 row-span-2 row-start-1 self-center justify-self-center"><SeatView s={s} i={slotIdx('right')} slot="right" /></div>
      </div>
      <Banner text={banner} />
    </>
  );

  const bottom = (
    <>
      <div className="relative flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TableAvatar name="Tú" tone="me" className="size-9 text-[15px]" />
          <b className={`truncate text-[13px] ${myTurn ? 'text-amber-200' : 'text-stone-200'}`}>{t('g.you')}</b>
          <span className="font-mono rounded-full border border-white/10 bg-zinc-900/70 px-2 py-[2px] text-[10px] font-bold text-amber-200">{me.stack}{me.bet > 0 ? ` · apuesta ${me.bet}` : ''}</span>
          {s.button === 0 && <span className="grid size-[17px] place-items-center rounded-full bg-white text-[9px] font-extrabold text-zinc-900">D</span>}
        </div>
        <span className="truncate text-right text-[11px] text-stone-400">{myHand || status}</span>
      </div>
      {raising !== null && lg ? (
        <div className="grid w-full max-w-md gap-2 rounded-2xl border border-white/10 bg-zinc-900/75 p-2.5 backdrop-blur-md" role="group" aria-label="Subir apuesta">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {([['½', 0.5], ['Bote', 1]] as const).map(([lab, f]) => (
                <button key={lab} type="button" className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-bold"
                  onClick={() => setRaising(Math.min(lg.maxTo, Math.max(lg.minTo, Math.round((s.currentBet + total * f) / 10) * 10)))}>{lab}</button>
              ))}
              <button type="button" className="rounded-full border border-red-300/40 bg-red-950 px-3 py-1 text-[12px] font-bold" onClick={() => setRaising(lg.maxTo)}>All-in</button>
            </div>
            <b className="font-mono text-lg text-amber-300 tabular-nums">{raising}</b>
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
  const restart = () => { paid.current = false; setS(newPoker(NAMES.map((name, i) => ({ id: `p${i}`, name, human: i === 0 })))); };
  return (
    <GameFrame
      gameId="poker"
      header={<ScoreStrip items={s.seats.map((x, i) => ({ name: NAMES[i]!, value: x.stack, us: i === 0 }))} />}
      felt={felt}
      bottom={bottom}
      overlays={
        <>
          <PhaseCinematic cine={cine} />
          <AnimatePresence>
            {over && (
              <ResultOverlay
                title={s.winner === 0 ? t('g.win') : `Gana ${NAMES[s.winner ?? 0]}`}
                actions={[{ label: t('a.rematch'), primary: true, onClick: restart }, { label: t('a.lobby'), onClick: () => nav('/') }]}
              >
                <ul className="grid gap-1 text-sm">
                  {[...s.seats.keys()].sort((a, b) => s.seats[b]!.stack - s.seats[a]!.stack).map((i) => (
                    <li key={i} className="flex justify-between border-b border-white/10 py-1">
                      <span className={i === s.winner ? 'font-bold text-amber-300' : ''}>{NAMES[i]}</span>
                      <span className="font-mono tabular-nums text-stone-300">{s.seats[i]!.stack} / {START_STACK * 4}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-center text-[11px] text-stone-400">Ciegas {BB / 2}/{BB} · {s.handNo} manos</p>
                {s.winner === 0 && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{WIN_BONUS} fichas de premio</p>}
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
}
