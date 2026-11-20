import { memo, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCw, Shuffle } from 'lucide-react';
import { useT } from '../../i18n/index.ts';
import { juice } from '../../services/juice.ts';
import { exitMatch } from '../../services/exitMatch.ts';
import { setActiveRoom } from '../../services/multiplayer.ts';
import { gameTimeout } from '../../services/timers.ts';
import { botDelay, feedback } from '../../store/settings.ts';
import { wallet } from '../../store/wallet.ts';
import { SeatBadge } from '../mus/app/components/SeatBadge.tsx';
import type { SeatInfo } from '../mus/app/game/types.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { ResultOverlay } from '../shared/kit.tsx';
import { useDuel } from '../shared/duel.ts';
import { MetalDefs, ShipArt } from '../shared/art.tsx';
import { FLEET, applyFlota, botFire, coord, isHoriz, isSunk, newFlota, shipCells, shipsLeft, sizeFor, validPlacement, type FAction, type FState, type Ship, type Shot, type Side } from './engine.ts';

const WIN_BONUS = 100;
const info = (i: number, name: string, human: boolean): SeatInfo => ({ seat: (i % 4) as SeatInfo['seat'], userId: null, name, isBot: !human, online: true });
const LETTERS = 'ABCDEFGHIJ';
const BOARD = 'min(100cqw, 100cqh, calc((100dvh - 150px) / var(--z, 1)), calc((100vw - 40px) / var(--z, 1)), calc(780px / var(--z, 1)))';

interface RadarProps {
  n: number;
  fleet: Ship[];
  shots: Record<number, Shot>;
  /** Mostrar todos los barcos (tu flota) o solo los hundidos (la del rival). */
  reveal: boolean;
  onCell?: (c: number) => void;
  /** Última casilla disparada sobre este tablero, para la onda de radar. */
  pulse: { cell: number; res: 'water' | 'hit' | 'sunk'; key: number } | null;
  dim?: boolean;
  /** Barrido de radar (solo en el tablero rival durante el combate). */
  sweep?: boolean;
  /** Coordenadas A-H / 1-8 en los bordes. */
  labels?: boolean;
  /** Barco seleccionado durante el despliegue. */
  halo?: number[];
}

/** Radar naval esmeralda y oro: anillos concéntricos, retícula con coordenadas y casillas con agua, impactos y barcos hundidos. */
const Radar = memo(function Radar({ n, fleet, shots, reveal, onCell, pulse, dim, sweep, labels = true, halo }: RadarProps) {
  const m = labels ? 70 : 0;
  const B = n * 100;
  const VB = B + m;
  const cx = (c: number): number => (c % n) * 100 + 50;
  const cy = (c: number): number => Math.floor(c / n) * 100 + 50;
  const pct = (m / VB) * 100;
  return (
    <div className="relative aspect-square h-full w-full" style={{ opacity: dim ? 0.55 : 1, transition: 'opacity .2s' }}>
      <svg viewBox={`0 0 ${VB} ${VB}`} className="absolute inset-0 h-full w-full" shapeRendering="geometricPrecision" aria-hidden="true">
        <MetalDefs />
        <defs>
          <radialGradient id="fl-bg" cx=".5" cy=".5" r=".75"><stop offset="0" stopColor="#0d4a36" /><stop offset=".6" stopColor="#07261c" /><stop offset="1" stopColor="#03120d" /></radialGradient>
          <linearGradient id="fl-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FCE38A" /><stop offset="1" stopColor="#B8860B" /></linearGradient>
        </defs>
        <rect x="2" y="2" width={VB - 4} height={VB - 4} rx="26" fill="url(#fl-bg)" stroke="url(#fl-gold)" strokeWidth="3" />
        {labels && Array.from({ length: n }, (_, i) => (
          <g key={i} fill="#FCE38A" fillOpacity=".85" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize="40" textAnchor="middle">
            <text x={m + i * 100 + 50} y={m / 2 + 14}>{LETTERS[i]}</text>
            <text x={m / 2 + 2} y={m + i * 100 + 64}>{i + 1}</text>
          </g>
        ))}
        <g transform={`translate(${m} ${m})`}>
          {[0.47, 0.35, 0.23, 0.11].map((r) => <circle key={r} cx={B / 2} cy={B / 2} r={B * r} fill="none" stroke="#D4AF37" strokeOpacity=".16" strokeWidth="1.5" />)}
          <path d={`M${B / 2} 12V${B - 12}M12 ${B / 2}H${B - 12}`} stroke="#D4AF37" strokeOpacity=".16" strokeWidth="1.5" />
          {Array.from({ length: n - 1 }, (_, i) => (
            <g key={i}><line x1={(i + 1) * 100} y1="10" x2={(i + 1) * 100} y2={B - 10} stroke="#3fe0a8" strokeOpacity=".22" strokeWidth="1.4" /><line x1="10" y1={(i + 1) * 100} x2={B - 10} y2={(i + 1) * 100} stroke="#3fe0a8" strokeOpacity=".22" strokeWidth="1.4" /></g>
          ))}
          {/* barcos propios, o ajenos ya hundidos */}
          {fleet.map((sh, k) => {
            const sunk = isSunk(sh, shots);
            if (!reveal && !sunk) return null;
            const first = sh.cells[0]!;
            return <ShipArt key={k} kind={sh.kind} len={sh.cells.length} x={cx(first) - 50} y={cy(first) - 50} vertical={!isHoriz(sh)} sunk={sunk} />;
          })}
          {halo && halo.length > 0 && (() => {
            const cols = halo.map((c) => c % n); const rows = halo.map((c) => Math.floor(c / n));
            const x0 = Math.min(...cols) * 100; const y0 = Math.min(...rows) * 100;
            return <rect className="dm-pulse" x={x0 + 4} y={y0 + 4} width={(Math.max(...cols) - Math.min(...cols) + 1) * 100 - 8} height={(Math.max(...rows) - Math.min(...rows) + 1) * 100 - 8} rx="18" fill="#FCE38A" fillOpacity=".12" stroke="#FCE38A" strokeWidth="5" />;
          })()}
          {/* resultados de los disparos */}
          {Object.entries(shots).map(([k, res]) => {
            const c = Number(k);
            return res === 'hit'
              ? (
                <g key={k}>
                  <circle cx={cx(c)} cy={cy(c)} r="32" fill="#ef4444" opacity=".25" /><circle cx={cx(c)} cy={cy(c)} r="25" fill="#991b1b" /><circle cx={cx(c)} cy={cy(c)} r="25" fill="none" stroke="#FCE38A" strokeWidth="5" /><circle cx={cx(c) - 7} cy={cy(c) - 8} r="6" fill="#fff" opacity=".35" />
                  <path d={`M${cx(c) - 12} ${cy(c) - 12}L${cx(c) + 12} ${cy(c) + 12}M${cx(c) + 12} ${cy(c) - 12}L${cx(c) - 12} ${cy(c) + 12}`} stroke="#FFF0B0" strokeWidth="6" strokeLinecap="round" />
                </g>
              )
              : <g key={k}><circle cx={cx(c)} cy={cy(c)} r="24" fill="none" stroke="#38bdf8" strokeOpacity=".7" strokeWidth="5" /><circle cx={cx(c)} cy={cy(c)} r="9" fill="#38bdf8" opacity=".6" /></g>;
          })}
          {/* agua: ondas concéntricas · impacto: explosión con chispas */}
          {pulse && (
            <g key={pulse.key} style={{ pointerEvents: 'none' }}>
              {pulse.res === 'water'
                ? [0, 0.16, 0.32].map((d) => <motion.circle key={d} cx={cx(pulse.cell)} cy={cy(pulse.cell)} r="40" fill="none" stroke="#38bdf8" strokeWidth="5" initial={{ scale: 0.3, opacity: 0.9 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 0.8, delay: d, ease: 'easeOut' }} style={{ transformOrigin: `${cx(pulse.cell)}px ${cy(pulse.cell)}px` }} />)
                : (
                  <>
                    <motion.circle cx={cx(pulse.cell)} cy={cy(pulse.cell)} r="46" fill="#FCE38A" initial={{ scale: 0.15, opacity: 0.95 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }} style={{ transformOrigin: `${cx(pulse.cell)}px ${cy(pulse.cell)}px` }} />
                    <motion.circle cx={cx(pulse.cell)} cy={cy(pulse.cell)} r="46" fill="#ef4444" initial={{ scale: 0.2, opacity: 0.8 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} style={{ transformOrigin: `${cx(pulse.cell)}px ${cy(pulse.cell)}px` }} />
                    {Array.from({ length: 8 }, (_, i) => (
                      <motion.g key={i} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ transformOrigin: `${cx(pulse.cell)}px ${cy(pulse.cell)}px` }}>
                        <motion.line x1={cx(pulse.cell)} y1={cy(pulse.cell)} x2={cx(pulse.cell) + Math.cos((i * Math.PI) / 4) * 28} y2={cy(pulse.cell) + Math.sin((i * Math.PI) / 4) * 28} stroke="#FFF0B0" strokeWidth="6" strokeLinecap="round" initial={{ x: 0, y: 0 }} animate={{ x: Math.cos((i * Math.PI) / 4) * 40, y: Math.sin((i * Math.PI) / 4) * 40 }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                      </motion.g>
                    ))}
                  </>
                )}
            </g>
          )}
        </g>
      </svg>
      {sweep && (
        <motion.div aria-hidden className="pointer-events-none absolute rounded-full" style={{ inset: `${pct + 3}% 3% 3% ${pct + 3}%`, background: 'conic-gradient(from 0deg, rgba(63,224,168,0) 0deg, rgba(63,224,168,.20) 38deg, rgba(63,224,168,0) 40deg)', willChange: 'transform' }} animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }} />
      )}
      {onCell && (
        <div className="absolute grid" style={{ left: `${pct}%`, top: `${pct}%`, right: 0, bottom: 0, gridTemplateColumns: `repeat(${n}, 1fr)`, gridTemplateRows: `repeat(${n}, 1fr)` }} role="grid" aria-label="Radar">
          {Array.from({ length: n * n }, (_, c) => (
            <button key={c} type="button" role="gridcell" aria-label={coord(c, n)} disabled={Boolean(shots[c])} onClick={() => onCell(c)} className="touch-manipulation" />
          ))}
        </div>
      )}
    </div>
  );
});

/** Barcos del rival: a flote en acero y dorado; hundidos, con su silueta tachada en rojo. */
function EnemyStatus({ fleet, shots, afloatLabel, sunkLabel }: { fleet: Ship[]; shots: Record<number, Shot>; afloatLabel: string; sunkLabel: string }) {
  const left = shipsLeft(fleet, shots);
  return (
    <div className="grid min-w-0 flex-1 gap-1.5 rounded-2xl border border-white/[0.08] bg-[#091511] p-2.5">
      <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-[.12em]">
        <span className="text-emerald-300">{afloatLabel} <b className="tabular-nums text-white">{left}</b></span>
        <span className="text-red-400">{sunkLabel} <b className="tabular-nums text-white">{fleet.length - left}</b></span>
      </div>
      {FLEET.map(({ kind, len }, k) => {
        const sh = fleet[k]!;
        const sunk = isSunk(sh, shots);
        return (
          <svg key={kind} viewBox={`0 0 ${len * 100} 100`} className="h-[18px] w-auto max-w-full" style={{ aspectRatio: `${len} / 1`, opacity: sunk ? 0.9 : 1 }} shapeRendering="geometricPrecision" aria-label={`${kind}${sunk ? ' ✕' : ''}`}>
            <MetalDefs />
            <ShipArt kind={kind} len={len} x={0} y={10} vertical={false} sunk={sunk} />
            {sunk && <path d={`M10 8L${len * 100 - 10} 96M${len * 100 - 10} 8L10 96`} stroke="#ef4444" strokeWidth="14" strokeLinecap="round" />}
          </svg>
        );
      })}
    </div>
  );
}

export default function Flota() {
  const nav = useNavigate();
  const t = useT();
  const [params] = useSearchParams();
  const mode = ['easy', 'normal', 'expert'].includes(params.get('mode') ?? '') ? params.get('mode')! : 'normal';
  const d = useDuel<FState, FAction>('flota', (p) => newFlota(p, 1, sizeFor(mode), mode), applyFlota);
  const { s, setS, me, myIdx, hostLike, dispatch, online } = d;
  const paid = useRef(false);
  const [selShip, setSelShip] = useState<number | null>(null);

  // La IA coloca su flota (ya viene aleatoria) y, en cuanto empieza el combate, dispara con pausa natural.
  useEffect(() => {
    if (!s || !hostLike || s.phase !== 'battle') return;
    const p = s.players[s.turn]!;
    if (p.human) return;
    const id = gameTimeout(() => setS((cur) => {
      if (!cur || cur.phase !== 'battle' || cur.players[cur.turn]!.id !== p.id) return cur;
      return applyFlota(cur, p.id, { k: 'fire', cell: botFire(cur, cur.turn) }) ?? cur;
    }), botDelay());
    return () => window.clearTimeout(id);
  }, [s, hostLike, setS]);

  // Sonido y vibración de cada disparo.
  const seq = s?.seq ?? 0;
  const last = s?.last ?? null;
  useEffect(() => {
    if (!seq || !last) return;
    feedback(last.res === 'water' ? 'whoosh' : last.res === 'sunk' ? 'thud' : 'impact');
    if (last.res !== 'water') { try { navigator.vibrate?.(last.res === 'sunk' ? [40, 40, 90] : 35); } catch { /* sin vibración */ } }
  }, [seq]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fin de partida: premio, victoria y cinemática ¡FLOTA HUNDIDA!.
  const winner = s?.winner ?? null;
  useEffect(() => {
    if (winner === null || paid.current) return;
    paid.current = true;
    juice.chips(winner === myIdx ? 'me' : 'top');
    if (winner === myIdx) { wallet.add(WIN_BONUS); wallet.recordWin('flota'); juice.cinematic({ title: '¡FLOTA HUNDIDA!', sub: `+${WIN_BONUS}`, tone: 'gold', good: true }); }
    else juice.cinematic({ title: '¡FLOTA HUNDIDA!', tone: 'ruby', good: false });
  }, [winner, myIdx]);

  if (!s) {
    return (
      <GameFrame gameId="flota" onExit={() => { void exitMatch(nav); }} header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">{t('g.flota.name')}</p>}
        felt={<div className="grid h-full place-items-center"><span className="size-6 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" aria-hidden /></div>} bottom={null} />
    );
  }
  const n = s.n;
  const foeIdx = (1 - myIdx) as Side;
  const foe = s.players[foeIdx]!;
  const mine = s.players[myIdx]!;
  const placing = s.phase === 'place';
  const myTurn = s.phase === 'battle' && s.turn === myIdx;
  const iAmReady = s.ready[myIdx];
  const myFleet = s.fleets[myIdx];
  const fire = (cell: number) => { if (myTurn) dispatch(me, { k: 'fire', cell }); };
  // La onda aparece en el tablero que recibió el disparo.
  const pulseOn = (board: Side) => (last && s.phase !== 'place' && last.by !== board ? { cell: last.cell, res: last.res, key: s.seq } : null);

  // Despliegue: tocar un barco lo selecciona (otra vez, lo gira); tocar agua con un barco elegido lo mueve allí.
  const rotate = (i: number): void => {
    const sh = myFleet[i]; if (!sh) return;
    const cells = shipCells(n, sh.cells.length, sh.cells[0]!, !isHoriz(sh));
    if (validPlacement(myFleet, i, cells, n)) { feedback('wood'); dispatch(me, { k: 'place', i, cells }); } else feedback('thud');
  };
  const placeTap = (c: number): void => {
    if (!placing || iAmReady) return;
    const hit = myFleet.findIndex((sh) => sh.cells.includes(c));
    if (hit >= 0) { if (selShip === hit) rotate(hit); else { feedback('tap'); setSelShip(hit); } return; }
    if (selShip === null) return;
    const sh = myFleet[selShip]!;
    const cells = shipCells(n, sh.cells.length, c, isHoriz(sh));
    if (validPlacement(myFleet, selShip, cells, n)) { feedback('wood'); dispatch(me, { k: 'place', i: selShip, cells }); } else feedback('thud');
  };

  return (
    <GameFrame
      gameId="flota" feltTone="emerald"
      onExit={online ? () => { setActiveRoom(null); void exitMatch(nav); } : undefined}
      timer={{ active: myTurn, id: `${s.seq}`, onTimeout: () => { if (myTurn) dispatch(me, { k: 'fire', cell: botFire(s, myIdx) }); } }}
      header={(
        <div className="grid grid-cols-2 gap-[min(1.8vw,8px)]" role="group">
          <div className="min-w-0 rounded-[13px] border border-white/10 bg-gradient-to-br from-teal-400/10 to-black/30 px-3 py-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-teal-300">{t('fl.shots')}</p>
            <b className="block text-[13px] tabular-nums">{Object.keys(s.shots[foeIdx]).length} <span className="text-[10px] font-semibold text-white/40">{n}×{n}</span></b>
          </div>
          <div className="min-w-0 rounded-[13px] border border-white/10 bg-gradient-to-br from-orange-400/10 to-black/30 px-3 py-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-orange-300">{t('fl.ships')}</p>
            <b className="block text-[13px] tabular-nums">{shipsLeft(s.fleets[foeIdx], s.shots[foeIdx])} · {shipsLeft(myFleet, s.shots[myIdx])}</b>
          </div>
        </div>
      )}
      felt={(
        <div dir="ltr" className="relative flex h-full min-h-0 flex-col items-center gap-2 p-[clamp(8px,2.4vw,18px)] lg:flex-row lg:justify-center lg:gap-5">
          <div className="lg:absolute lg:left-5 lg:top-4 lg:z-10 max-lg:landscape:absolute max-lg:landscape:left-2 max-lg:landscape:top-1 max-lg:landscape:z-10"><SeatBadge info={info(foeIdx, foe.name, foe.human)} tone="them" mano={false} turn={s.phase === 'battle' && s.turn === foeIdx} deadline={null} cards={0} /></div>
          {placing ? (
            <div className="min-h-0 w-full flex-1 [container-type:size] lg:self-stretch"><div className="mx-auto" style={{ width: BOARD, height: BOARD }}><Radar n={n} fleet={myFleet} shots={s.shots[myIdx]} reveal pulse={null} dim={iAmReady} onCell={iAmReady ? undefined : placeTap} halo={selShip !== null ? myFleet[selShip]?.cells : undefined} /></div></div>
          ) : (
            <>
              <div className="min-h-0 w-full flex-[2.2] [container-type:size] lg:flex-1 lg:self-stretch"><div className="mx-auto" style={{ width: BOARD, height: BOARD }}>
                <Radar n={n} fleet={s.fleets[foeIdx]} shots={s.shots[foeIdx]} reveal={s.phase === 'over'} sweep={s.phase === 'battle'} onCell={myTurn ? fire : undefined} pulse={pulseOn(foeIdx)} />
              </div></div>
              <div className="flex w-full shrink-0 items-stretch gap-2.5 lg:w-[calc(230px/var(--z,1))] lg:flex-col">
                <div className="aspect-square w-[min(34vw,26dvh)] shrink-0 lg:w-[min(100%,calc(24dvh/var(--z,1)))] lg:self-center"><Radar n={n} fleet={myFleet} shots={s.shots[myIdx]} reveal pulse={pulseOn(myIdx)} labels={false} /></div>
                <EnemyStatus fleet={s.fleets[foeIdx]} shots={s.shots[foeIdx]} afloatLabel={t('fl.afloat')} sunkLabel={t('fl.sunk')} />
              </div>
            </>
          )}
        </div>
      )}
      bottom={(
        <div className="grid w-full justify-items-center gap-1.5">
          <SeatBadge info={info(myIdx, mine.name, true)} tone="me" mano={false} turn={myTurn || (placing && !iAmReady)} deadline={null} cards={0} />
          {/* Action Rail de altura fija */}
          <div className="flex min-h-[52px] w-full items-center justify-center gap-2" role="group" aria-label={t('fl.actions')}>
            {placing ? (
              iAmReady
                ? <span className="size-5 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" aria-label="…" />
                : (
                  <>
                    <button type="button" onClick={() => { feedback('tap'); setSelShip(null); dispatch(me, { k: 'random' }); }} className="flex h-12 min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-3 text-[13px] font-bold text-white active:scale-95"><Shuffle size={16} strokeWidth={1.75} aria-hidden /><span className="truncate">{t('fl.random')}</span></button>
                    <button type="button" disabled={selShip === null} onClick={() => { if (selShip !== null) rotate(selShip); }} className="flex h-12 touch-manipulation items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-[13px] font-bold text-white active:scale-95 disabled:opacity-40"><RotateCw size={16} strokeWidth={1.75} aria-hidden /><span className="max-sm:sr-only">{t('fl.rotate')}</span></button>
                    <button type="button" onClick={() => { feedback('chip'); dispatch(me, { k: 'ready' }); }} className="flex h-12 min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] px-4 text-[14px] font-extrabold text-[#2a1d02] active:scale-95"><Check size={17} strokeWidth={2} aria-hidden />{t('fl.ready')}</button>
                  </>
                )
            ) : <p className="text-center text-[12px] font-bold tabular-nums text-stone-400">{last ? `${last.by === myIdx ? '→' : '←'} ${coord(last.cell, n)}` : ''}</p>}
          </div>
          {placing && !iAmReady && <p className="text-center text-[11px] text-stone-400">{t('fl.hint')}</p>}
        </div>
      )}
      overlays={(
        <AnimatePresence>
          {s.phase === 'over' && (
            <ResultOverlay
              outcome={winner === myIdx ? 'win' : 'lose'} prize={winner === myIdx ? WIN_BONUS : 0} taunt=""
              title={winner === myIdx ? t('ser.champion') : t('ser.lost')}
              actions={[
                ...(hostLike ? [{ label: t('ser.newSeries'), primary: true, onClick: () => { paid.current = false; setSelShip(null); d.restart(); } }] : []),
                { label: t('a.lobby'), onClick: () => { void exitMatch(nav); } },
              ]}
            >
              <p className="text-center text-sm tabular-nums text-stone-300">{Object.keys(s.shots[foeIdx]).length}</p>
            </ResultOverlay>
          )}
        </AnimatePresence>
      )}
    />
  );
}
