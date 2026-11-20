import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, SkipForward } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { botName, tr, useT } from '../../i18n/index.ts';
import { juice } from '../../services/juice.ts';
import { exitMatch } from '../../services/exitMatch.ts';
import { setActiveRoom } from '../../services/multiplayer.ts';
import { useReplica, useSeating } from '../../services/onlineGame.ts';
import { gameTimeout } from '../../services/timers.ts';
import { botDelay, feedback } from '../../store/settings.ts';
import { wallet } from '../../store/wallet.ts';
import { SeatBadge } from '../mus/app/components/SeatBadge.tsx';
import { Button } from '../mus/app/components/ui.tsx';
import type { SeatInfo } from '../mus/app/game/types.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { PhaseCinematic, ResultOverlay, useCine } from '../shared/kit.tsx';
import { SeriesGems, useSeries } from '../shared/series.tsx';
import { DominoTile } from './DominoTile.tsx';
import { bestLayout, type Cell } from './layout.ts';
import {
  applyDominoAction, botMove, ends, handPips, newRound, playableTiles, sidesFor, teamOf, tileId,
  type DPlayer, type DominoAction, type DominoState, type Tile,
} from './engine.ts';

const WIN_BONUS = 100;
type Slot = 'bottom' | 'right' | 'top' | 'left';
const SLOT: Record<2 | 4, Slot[]> = { 2: ['bottom', 'top'], 4: ['bottom', 'right', 'top', 'left'] };
/** Fichas de la mano: caben las 7 a lo ancho de cualquier pantalla. */
const HAND = 'min(calc(var(--card-w) * 0.56), calc((100vw / var(--z, 1) - 28px) / 7.4))';
const info = (i: number, name: string): SeatInfo => ({ seat: (i % 4) as SeatInfo['seat'], userId: null, name, isBot: true, online: true });
const makePlayers = (n: 2 | 4): DPlayer[] => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: i === 0 ? tr('g.you') : botName(i), human: i === 0 }));

/** Dominó: la cadena serpentea con giros de 90° y se reescala sola para llenar la mesa (móvil o PC). */
function Chain({ s, targets, onEnd }: { s: DominoState; targets: boolean; onEnd: (side: 'L' | 'R') => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = (): void => setDim({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = s.chain.length;
  const fit = useMemo(() => (dim.w && dim.h && n ? bestLayout(s.chain, s.head ?? 0, dim.w - 8, dim.h - 8) : null), [s.chain, s.head, dim.w, dim.h, n]);
  const e = ends(s);
  const cell = fit ? Math.min(fit.cell, 64) : 0;
  const px = (c: Cell, minCol: number, minRow: number, offX: number, offY: number) => ({ x: offX + (c.col - minCol) * cell, y: offY + (c.row - minRow) * cell });
  let body: React.ReactNode = null;
  if (fit && e && cell > 0) {
    const { layout } = fit;
    const offX = (dim.w - layout.cols * cell) / 2; const offY = (dim.h - layout.rows * cell) / 2;
    const short = cell * 0.94;
    body = (
      <>
        {layout.cells.map((c) => {
          const { x, y } = px(c, layout.minCol, layout.minRow, offX, offY);
          return (
            <div key={`${c.i}-${c.va}-${c.vb}`} className="dm-pop pointer-events-none absolute left-0 top-0 grid place-items-center" style={{ width: c.w * cell, height: c.h * cell, transform: `translate3d(${x}px, ${y}px, 0)`, transition: 'transform .28s cubic-bezier(.2,.8,.25,1)' }}>
              <DominoTile a={c.va} b={c.vb} vertical={c.vertical} size={`${short}px`} />
            </div>
          );
        })}
        {targets && ([['L', layout.ghostL, e.left], ['R', layout.ghostR, e.right]] as const).map(([side, g, num]) => {
          const { x, y } = px(g, layout.minCol, layout.minRow, offX, offY);
          return (
            <button key={side} type="button" onClick={() => onEnd(side)} aria-label={`${side === 'L' ? '←' : '→'} ${num}`}
              className="dm-pulse absolute left-0 top-0 grid touch-manipulation place-items-center rounded-[14%/28%] border-2 border-dashed border-[#FCE38A] bg-[#FCE38A]/15 shadow-[0_0_18px_rgba(252,227,138,.55)]"
              style={{ width: g.w * cell * 0.98, height: g.h * cell * 0.98, transform: `translate3d(${x}px, ${y}px, 0)` }}>
              <span className="font-[var(--font-display)] font-extrabold tabular-nums text-[#FCE38A]" style={{ fontSize: cell * 0.62 }}>{num}</span>
            </button>
          );
        })}
      </>
    );
  }
  return <div ref={box} dir="ltr" className="relative h-full w-full overflow-hidden">{body}</div>;
}

export default function Domino() {
  const nav = useNavigate();
  const t = useT();
  const seating = useSeating('domino');
  const online = seating.online;
  const [count, setCount] = useState<2 | 4 | null>(null);
  const [s, setS] = useState<DominoState | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const { cine, show: showCine } = useCine();
  const series = useSeries();
  const { record: recordRound, roundStarted } = series;
  const lastSeq = useRef('');
  const recorded = useRef(0);
  const me = online ? s?.players.find((p) => p.peerId === seating.myPeerId)?.id ?? 'p0' : 'p0';
  const hostLike = !online || seating.isHost;

  const start = (n: 2 | 4) => { setCount(n); setS(newRound(makePlayers(n))); setSel(null); lastSeq.current = ''; recorded.current = 0; series.reset(); };
  const hostStart = () => {
    const humans = seating.humans;
    const n: 2 | 4 = humans.length === 2 && !seating.fillBots ? 2 : 4;
    const players: DPlayer[] = Array.from({ length: n }, (_, i) => i < humans.length
      ? { id: `p${i}`, name: humans[i]!.name, human: true, peerId: humans[i]!.peerId }
      : { id: `p${i}`, name: botName(i - humans.length + 1), human: false });
    setS(newRound(players)); setSel(null); lastSeq.current = ''; recorded.current = 0; series.reset();
  };
  const noS = s === null;
  useEffect(() => { if (online && seating.isHost && noS) hostStart(); }, [online, seating.isHost, noS]); // eslint-disable-line
  const { dispatch } = useReplica<DominoState, DominoAction>(seating, s, setS, applyDominoAction, (st, peer) => st.players.find((q) => q.peerId === peer)?.id ?? null);
  const nextRound = () => {
    if (!s || !hostLike) return;
    const winnerIdx = Math.max(0, s.players.findIndex((p) => p.id === s.result?.winner));
    setS(newRound(s.players, s.round + 1, winnerIdx)); setSel(null); lastSeq.current = '';
  };

  // IA con una pausa natural (750–900 ms).
  useEffect(() => {
    if (!s || s.phase !== 'play' || !hostLike) return;
    const p = s.players[s.turn]!;
    if (p.human) return;
    const id = gameTimeout(() => {
      setS((cur) => {
        if (!cur || cur.phase !== 'play' || cur.players[cur.turn]!.id !== p.id) return cur;
        const m = botMove(cur);
        return applyDominoAction(cur, p.id, m) ?? applyDominoAction(cur, p.id, { k: 'pass' }) ?? cur;
      });
    }, botDelay());
    return () => window.clearTimeout(id);
  }, [s, hostLike]);

  // Sucesos: golpe de ficha, cinemáticas de ¡DOMINÓ! / ¡CIERRE!.
  useEffect(() => {
    const e = s?.event;
    const key = `${e?.seq}:${e?.by}:${e?.text}`;
    if (!s || !e || key === lastSeq.current) return;
    lastSeq.current = key;
    const who = s.players.find((p) => p.id === e.by);
    if (e.kind === 'info') feedback('clack');
    else if (e.kind === 'draw') feedback('draw');
    else if (e.kind === 'pass') feedback('deal');
    if (e.kind === 'domino') juice.cinematic({ title: '¡DOMINÓ!', sub: who?.name, tone: 'gold', good: who?.id === me });
    if (e.kind === 'block') juice.cinematic({ title: '¡CIERRE!', sub: who?.name, tone: 'electric', good: who?.id === me });
  }, [s, me]);

  // Fin de ronda: serie al mejor de 3 y fichas doradas al ganador.
  const myIdx = Math.max(0, s?.players.findIndex((p) => p.id === me) ?? 0);
  useEffect(() => {
    if (s && s.phase === 'play') roundStarted();
    if (!s || s.phase !== 'roundOver' || !s.result || recorded.current === s.round) return;
    recorded.current = s.round;
    const wIdx = s.players.findIndex((p) => p.id === s.result!.winner);
    const mine = teamOf(s, wIdx) === teamOf(s, myIdx);
    recordRound(mine ? 'me' : 'them');
    juice.chips(mine ? 'me' : 'top');
  }, [s, myIdx, recordRound, roundStarted]);
  const champion = series.champion;
  useEffect(() => {
    if (champion === 'me') { wallet.add(WIN_BONUS); wallet.recordWin('domino'); showCine('¡DOMINÓ!', `+${WIN_BONUS}`); }
  }, [champion, showCine]);

  const dispatchMine = (a: DominoAction) => { if (s && s.phase === 'play' && s.players[s.turn]!.id === me) { setSel(null); dispatch(me, a); } };

  if (!s && online) {
    return (
      <GameFrame gameId="domino" onExit={() => { void exitMatch(nav); }} header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">{t('g.domino.name')}</p>}
        felt={<div className="grid h-full place-items-center p-6 text-center"><p className="text-sm font-bold text-stone-300">…</p></div>} bottom={null} />
    );
  }
  if (!s || (!online && !count)) {
    return (
      <GameFrame gameId="domino" header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">{t('g.domino.name')}</p>}
        felt={(
          <div className="grid h-full place-items-center p-6">
            <div className="grid w-full max-w-xs gap-3 text-center">
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-amber-300">{t('a.format')}</h2>
              <Button variant="primary" block onClick={() => start(2)}>{t('dm.f1')}</Button>
              <Button variant="secondary" block onClick={() => start(4)}>{t('dm.f2')}</Button>
              <p className="text-xs text-stone-400">{t('dm.intro')}</p>
            </div>
          </div>
        )} bottom={null} />
    );
  }

  const n = s.players.length as 2 | 4;
  const slots = SLOT[n];
  const myTurn = s.phase === 'play' && s.players[s.turn]!.id === me;
  const hand = s.hands[me]!;
  const playable = myTurn ? new Set(playableTiles(s, me).map(tileId)) : new Set<string>();
  const selTile: Tile | undefined = hand.find((x) => tileId(x) === sel);
  const selSides = myTurn && selTile ? sidesFor(s, selTile) : [];
  const canDraw = myTurn && s.pool.length > 0 && playable.size === 0;
  const canPass = myTurn && s.pool.length === 0 && playable.size === 0;

  const tapTile = (tile: Tile) => {
    if (!myTurn) return;
    const sides = sidesFor(s, tile);
    if (sides.length === 0) { feedback('tap'); return; }
    const open = ends(s);
    if (sides.length === 1 || (open && open.left === open.right)) { dispatchMine({ k: 'play', id: tileId(tile), side: sides[sides.length - 1]! }); return; }
    feedback('tap');
    setSel((cur) => (cur === tileId(tile) ? null : tileId(tile)));
  };
  const playSide = (side: 'L' | 'R') => { if (selTile && sidesFor(s, selTile).includes(side)) dispatchMine({ k: 'play', id: tileId(selTile), side }); };

  const seat = (slot: 'top' | 'left' | 'right') => {
    const k = slots.indexOf(slot);
    if (k === -1) return null;
    const i = (myIdx + k) % n;
    const p = s.players[i]!;
    return <SeatBadge info={info(i, p.name)} tone="them" mano={false} turn={s.turn === i && s.phase === 'play'} deadline={null} cards={s.hands[p.id]!.length} />;
  };
  const e = ends(s);
  const status = s.phase !== 'play' ? '' : myTurn ? (s.mustStart && !s.chain.length ? t('dm.mustStart') : t('dm.yourTurn')) : t('dm.wait', { n: s.players[s.turn]!.name });
  const winnerIdx = s.result ? s.players.findIndex((p) => p.id === s.result!.winner) : -1;
  const winnerMine = winnerIdx >= 0 && teamOf(s, winnerIdx) === teamOf(s, myIdx);
  const labels: [string, string] = n === 4 ? [t('ser.us'), t('ser.them')] : [t('ser.you'), botName(1)];

  // Franja de asientos arriba (izquierda · arriba · derecha) y la cadena ocupa todo el ancho de la mesa debajo
  const felt = (
    <div className="grid h-full grid-cols-[1fr_auto_1fr] grid-rows-[auto_minmax(0,1fr)] gap-x-1 p-[clamp(6px,2vw,16px)]">
      <div className="col-start-1 row-start-1 self-start justify-self-start">{seat('left')}</div>
      <div className="col-start-2 row-start-1 justify-self-center">{seat('top')}</div>
      <div className="col-start-3 row-start-1 self-start justify-self-end">{seat('right')}</div>
      <div className="col-span-3 col-start-1 row-start-2 min-h-0"><Chain s={s} targets={selSides.length === 2} onEnd={playSide} /></div>
    </div>
  );

  const bottom = (
    <>
      <div className="flex w-full items-center justify-between gap-2 text-[11px] text-stone-400">
        <span className="font-mono tabular-nums">{e ? `${e.left} · ${e.right}` : ''}</span>
        <span className="sr-only" aria-live="polite">{status}</span>
      </div>
      {/* Action Rail: altura fija reservada para que la mesa nunca se mueva */}
      <div className="flex min-h-[48px] w-full items-center justify-center gap-2" role="group" aria-label={t('dm.actions')}>
        {selSides.length === 2 && e && (
          <>
            <button type="button" onClick={() => playSide('L')} className="btn btn--gold flex min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 text-[13px] font-bold"><ArrowLeft size={18} strokeWidth={1.75} aria-hidden /><span className="truncate">{t('dm.putL')}</span><b className="tabular-nums">[{e.left}]</b></button>
            <button type="button" onClick={() => playSide('R')} className="btn btn--gold flex min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 text-[13px] font-bold"><b className="tabular-nums">[{e.right}]</b><span className="truncate">{t('dm.putR')}</span><ArrowRight size={18} strokeWidth={1.75} aria-hidden /></button>
          </>
        )}
        {canDraw && selSides.length < 2 && <button type="button" onClick={() => dispatchMine({ k: 'draw' })} className="btn btn--gold flex w-full touch-manipulation items-center justify-center gap-1.5 text-[13px] font-bold"><Download size={16} strokeWidth={1.75} aria-hidden />{t('dm.drawPool', { n: s.pool.length })}</button>}
        {canPass && <button type="button" onClick={() => dispatchMine({ k: 'pass' })} className="btn btn--gold flex w-full touch-manipulation items-center justify-center gap-1.5 text-[13px] font-bold"><SkipForward size={16} strokeWidth={1.75} aria-hidden />{t('dm.passTurn')}</button>}
      </div>
      <div className="no-scrollbar w-full overflow-x-auto overflow-y-hidden pb-1 pt-2" role="group" aria-label={t('dm.hand')}>
        <div className="mx-auto flex w-max items-end gap-[calc(var(--card-w)*0.06)] px-2">
          {hand.map((tile, i) => {
            const id = tileId(tile);
            return (
              <div key={id} className="deal-in" style={{ ['--d' as string]: i }}>
                <DominoTile a={tile[0]} b={tile[1]} vertical size={HAND} selected={sel === id} playable={myTurn && playable.has(id)} dim={myTurn && !playable.has(id)} onClick={myTurn ? () => tapTile(tile) : undefined} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <GameFrame
      gameId="domino" feltTone="emerald"
      onExit={online ? () => { setActiveRoom(null); void exitMatch(nav); } : undefined}
      timer={{
        active: myTurn, id: `${s.turn}:${hand.length}:${s.chain.length}:${s.pool.length}`,
        onTimeout: () => { setSel(null); if (s.phase !== 'play' || s.players[s.turn]!.id !== me) return; dispatch(me, botMove(s)); },
      }}
      header={(
        <div className="grid grid-cols-2 gap-[min(1.8vw,8px)]" role="group" aria-label={t('dm.turn')}>
          <div className="min-w-0 rounded-[13px] border border-white/10 bg-gradient-to-br from-teal-400/10 to-black/30 px-3 py-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-teal-300">{t('dm.turn')}</p>
            <b className="block truncate text-[13px]">{s.phase !== 'play' ? '—' : s.players[s.turn]!.name}</b>
          </div>
          <div className="min-w-0 rounded-[13px] border border-white/10 bg-gradient-to-br from-orange-400/10 to-black/30 px-3 py-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-orange-300">{n === 2 ? t('dm.pool') : t('ser.round', { n: s.round })}</p>
            <b className="block text-[13px] tabular-nums">{n === 2 ? s.pool.length : hand.length}</b>
          </div>
        </div>
      )}
      strip={<SeriesGems entries={[{ key: 'me', label: labels[0], wins: series.wins.me ?? 0 }, { key: 'them', label: labels[1], wins: series.wins.them ?? 0 }]} />}
      felt={felt}
      bottom={bottom}
      overlays={(
        <>
          <PhaseCinematic cine={cine} />
          <AnimatePresence>
            {s.phase === 'roundOver' && s.result && (
              <ResultOverlay
                outcome={champion === null ? undefined : champion === 'me' ? 'win' : 'lose'}
                prize={champion === 'me' ? WIN_BONUS : 0}
                taunt={t('dm.taunt')}
                title={champion !== null ? (champion === 'me' ? t('ser.champion') : t('ser.lost')) : t('ser.roundWin', { w: winnerMine ? labels[0] : labels[1] })}
                actions={[
                  ...(hostLike ? [{ label: champion !== null ? t('ser.newSeries') : t('ser.next'), primary: true, onClick: champion !== null ? (online ? hostStart : () => start(count!)) : nextRound }] : []),
                  { label: t('a.lobby'), onClick: () => { void exitMatch(nav); } },
                ]}
              >
                <ul className="grid gap-1 text-sm">
                  {s.players.map((p) => (
                    <li key={p.id} className="flex justify-between border-b border-white/10 py-1">
                      <span className={p.id === s.result!.winner ? 'font-bold text-amber-300' : ''}>{p.name}</span>
                      <span className="tabular-nums text-stone-300">{s.hands[p.id]!.length} · {handPips(s.hands[p.id]!)} {t('dm.pts')}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-center text-[12px] text-stone-400">{s.result.blocked ? '¡CIERRE!' : '¡DOMINÓ!'} · +{s.result.points} {t('dm.pts')} · {t('ser.round', { n: series.played })}: {series.wins.me ?? 0} – {series.wins.them ?? 0}</p>
                {champion === 'me' && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{WIN_BONUS} fichas</p>}
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      )}
    />
  );
}
