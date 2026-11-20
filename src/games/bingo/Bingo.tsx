import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { botName, tr, useT } from '../../i18n/index.ts';
import { juice } from '../../services/juice.ts';
import { exitMatch } from '../../services/exitMatch.ts';
import { setActiveRoom } from '../../services/multiplayer.ts';
import { useReplica, useSeating } from '../../services/onlineGame.ts';
import { gameInterval, gameTimeout } from '../../services/timers.ts';
import { feedback } from '../../store/settings.ts';
import { wallet, useWallet } from '../../store/wallet.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { HudPills } from '../shared/hud.tsx';
import { ResultOverlay } from '../shared/kit.tsx';
import { Button } from '../mus/app/components/ui.tsx';
import { BET, applyBingo, bingoPrize, botClaims, drawBall, hasLine, linePrize, missingBingo, missingLine, newBingo, type BAction, type BState, type Card } from './engine.ts';

const WIN_BONUS = 0;
type Speed = 'pausado' | 'normal' | 'turbo';
const SPEEDS: { id: Speed; label: string; ms: number }[] = [{ id: 'pausado', label: 'Pausado 3.2s', ms: 3200 }, { id: 'normal', label: 'Normal 2.2s', ms: 2200 }, { id: 'turbo', label: 'Turbo 1.3s', ms: 1300 }];

/** Bombo giratorio dorado: gira mientras salen bolas. */
const Drum = memo(function Drum({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" shapeRendering="geometricPrecision" aria-hidden="true">
      <defs>
        <linearGradient id="bg-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF0B0" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#8a6410" /></linearGradient>
        <radialGradient id="bg-glass" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#1b5a45" /><stop offset="1" stopColor="#06231a" /></radialGradient>
      </defs>
      <ellipse cx="50" cy="94" rx="30" ry="4" fill="#000" opacity=".45" />
      <path d="M30 92 L40 74 H60 L70 92 Z" fill="url(#bg-gold)" stroke="#6b4a08" strokeWidth="1.2" />
      <circle cx="50" cy="46" r="38" fill="url(#bg-glass)" stroke="url(#bg-gold)" strokeWidth="4" />
      <g className={spinning ? 'orbit-spin' : ''} style={{ transformOrigin: '50px 46px', animationDuration: '2.4s' }}>
        {[0, 45, 90, 135].map((r) => <line key={r} x1="50" y1="12" x2="50" y2="80" stroke="url(#bg-gold)" strokeWidth="2.2" transform={`rotate(${r} 50 46)`} />)}
        {[[36, 34, '#e11d48'], [60, 40, '#2563eb'], [44, 62, '#16a34a'], [64, 60, '#eab308'], [50, 28, '#f1e7c6']].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r="6" fill={c as string} stroke="#fff" strokeWidth="1" />)}
      </g>
      <circle cx="50" cy="46" r="38" fill="none" stroke="#fff" strokeOpacity=".15" strokeWidth="1" />
      <circle cx="50" cy="46" r="6" fill="url(#bg-gold)" stroke="#6b4a08" />
    </svg>
  );
});

const Ball = ({ n, big }: { n: number; big?: boolean }) => (
  <span className={`grid shrink-0 place-items-center rounded-full border-2 border-[#fff6c4] font-extrabold tabular-nums text-[#2a1d02] shadow-[0_3px_6px_rgba(0,0,0,.5)] ${big ? 'size-14 text-2xl' : 'size-8 text-[13px]'}`} style={{ background: 'radial-gradient(circle at 35% 30%, #fffbe0, #f0c35f 70%, #b8860b)' }}>{n}</span>
);

/** Cartón 3×9: toca un número cantado para marcarlo con una ficha. */
const CardView = memo(function CardView({ card, drawn, marks, onMark, idx }: { card: Card; drawn: readonly number[]; marks: readonly number[]; onMark: (n: number) => void; idx: number }) {
  return (
    <div className="mx-auto w-full max-w-[520px] rounded-xl border border-amber-300/30 bg-[#0a1a14] p-1.5 shadow-[0_4px_10px_rgba(0,0,0,.4)]" aria-label={`Cartón ${idx + 1}`}>
      <div className="grid grid-cols-9 gap-[3px]">
        {card.map((n, i) => {
          if (!n) return <span key={i} className="h-[clamp(30px,7vw,40px)] rounded-md bg-black/25" />;
          const marked = marks.includes(n) && drawn.includes(n);
          const pending = drawn.includes(n) && !marked;
          return (
            <button key={i} type="button" onClick={() => onMark(n)} aria-label={String(n)} aria-pressed={marked}
              className={`relative grid h-[clamp(30px,7vw,40px)] touch-manipulation place-items-center rounded-md border text-[clamp(12px,3.6vw,17px)] font-extrabold tabular-nums active:scale-95 ${pending ? 'border-amber-200 bg-[#f6eed6] text-[#2a1d02] shadow-[0_0_8px_rgba(252,227,138,.8)]' : 'border-black/20 bg-[#f6eed6] text-[#2a1d02]'}`}>
              {n}
              {marked && <span aria-hidden className="absolute inset-[8%] rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #fb7185, #be123c 70%, #4c0519)', opacity: 0.92, boxShadow: '0 1px 3px rgba(0,0,0,.6)' }} />}
              {marked && <span aria-hidden className="absolute z-10 text-white [text-shadow:0_1px_2px_#000]">{n}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default function Bingo() {
  const nav = useNavigate();
  const t = useT();
  const w = useWallet();
  const seating = useSeating('bingo');
  const online = seating.online;
  const hostLike = !online || seating.isHost;
  const [s, setS] = useState<BState | null>(null);
  const [n, setN] = useState<1 | 2 | 3 | 4 | null>(null);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [auto, setAuto] = useState(true);
  const [note, setNote] = useState('');
  const paid = useRef({ line: false, bingo: false, buy: false });
  const lastSeq = useRef(0);
  const me = online ? s?.players.find((p) => p.peerId === seating.myPeerId)?.id ?? 'p0' : 'p0';

  const begin = (cards: number) => {
    const cost = cards * BET;
    if (!wallet.spend(cost)) return;
    paid.current = { line: false, bingo: false, buy: true };
    const bots = [1, 2, 3].map((i) => ({ id: `p${i}`, name: botName(i), human: false, cards: 1 + Math.floor(Math.random() * 3) }));
    setN(cards as 1 | 2 | 3 | 4);
    setS(newBingo([{ id: 'p0', name: tr('g.you'), human: true, cards }, ...bots]));
  };
  // Online: el anfitrión reparte 2 cartones a cada humano y rellena con IA
  const hostStart = () => {
    const humans = seating.humans;
    const ps = [...humans.map((h, i) => ({ id: `p${i}`, name: h.name, human: true, peerId: h.peerId, cards: 2 })),
      ...Array.from({ length: Math.max(0, 4 - humans.length) }, (_, i) => ({ id: `p${humans.length + i}`, name: botName(i + 1), human: false, cards: 2 }))];
    setS(newBingo(ps));
  };
  const noS = s === null;
  useEffect(() => { if (online && seating.isHost && noS) hostStart(); }, [online, seating.isHost, noS]); // eslint-disable-line
  const { dispatch } = useReplica<BState, BAction>(seating, s, setS, applyBingo, (st, peer) => st.players.find((q) => q.peerId === peer)?.id ?? null);

  // Online: cada cliente paga su entrada una vez
  useEffect(() => {
    if (!online || !s || paid.current.buy) return;
    paid.current.buy = true;
    const mine = s.players.find((p) => p.id === me);
    if (mine) wallet.spend(Math.min(w.chips, mine.cards.length * s.bet));
  }, [online, s, me]); // eslint-disable-line

  // El anfitrión saca una bola cada X segundos
  const playing = !!s && s.phase === 'play';
  useEffect(() => {
    if (!playing || !hostLike) return;
    const ms = SPEEDS.find((x) => x.id === speed)!.ms;
    const id = gameInterval(() => setS((cur) => (cur ? drawBall(cur) ?? cur : cur)), ms);
    return () => window.clearInterval(id);
  }, [playing, hostLike, speed]);

  // Las IA cantan en cuanto pueden, con una pausa natural
  const ballCount = s?.drawn.length ?? 0;
  useEffect(() => {
    if (!s || !hostLike || s.phase !== 'play') return;
    const ids: number[] = [];
    for (const p of s.players) {
      if (p.human) continue;
      const claim = botClaims(s, p.id);
      if (claim) ids.push(gameTimeout(() => setS((cur) => (cur ? applyBingo(cur, p.id, claim) ?? cur : cur)), 500 + Math.random() * 900));
    }
    return () => ids.forEach((x) => window.clearTimeout(x));
  }, [ballCount, hostLike]); // eslint-disable-line

  // Auto-marcado
  const myMarks = s?.players.find((p) => p.id === me)?.marks;
  useEffect(() => {
    if (!auto || !s || s.phase !== 'play') return;
    const mine = s.players.find((p) => p.id === me);
    if (!mine) return;
    const have = new Set(mine.cards.flatMap((c) => c));
    const next = s.drawn.find((d) => have.has(d) && !mine.marks.includes(d));
    if (next !== undefined) dispatch(me, { k: 'mark', n: next });
  }, [auto, ballCount, myMarks?.length]); // eslint-disable-line

  // Avisos y premios
  useEffect(() => {
    const e = s?.event;
    if (!s || !e || e.seq === lastSeq.current) return;
    lastSeq.current = e.seq;
    if (e.text.startsWith('Bola')) { feedback('tick'); return; }
    feedback('jingle');
    const mine = e.text.includes(s.players.find((p) => p.id === me)?.name ?? '#');
    juice.cinematic({ title: e.text.includes('BINGO') ? '¡BINGO!' : '¡LÍNEA!', sub: e.text.replace(/^¡(LÍNEA|BINGO) de /, '').replace('!', ''), tone: 'gold', good: mine });
  }, [s?.event?.seq]); // eslint-disable-line
  useEffect(() => {
    if (!s) return;
    if (s.lineBy === me && !paid.current.line) { paid.current.line = true; wallet.add(linePrize(s)); juice.chips('me'); }
    if (s.bingoBy === me && !paid.current.bingo) { paid.current.bingo = true; wallet.add(bingoPrize(s)); wallet.recordWin('bingo'); wallet.recordResult(true); juice.chips('me'); }
  }, [s?.lineBy, s?.bingoBy, me]); // eslint-disable-line

  const mine = s?.players.find((p) => p.id === me);
  const drawn = s?.drawn ?? [];
  const lastBalls = useMemo(() => drawn.slice(-6, -1).reverse(), [drawn]);
  const current = drawn[drawn.length - 1];
  const mark = (num: number) => { if (!s || s.phase !== 'play') return; if (!drawn.includes(num)) { feedback('thud'); return; } feedback('chip'); dispatch(me, { k: 'mark', n: num }); };
  const claim = (kind: 'line' | 'bingo') => {
    if (!s || !mine) return;
    const marks = mine.marks.filter((x) => drawn.includes(x));
    const i = mine.cards.findIndex((c) => (kind === 'line' ? hasLine(c, marks) : missingBingo(c, marks) === 0));
    if (i < 0) { feedback('thud'); setNote(kind === 'line' ? 'Aún no tienes una línea completa marcada' : 'Aún no tienes el cartón completo'); gameTimeout(() => setNote(''), 1800); return; }
    dispatch(me, { k: kind, card: i });
  };

  if (!s && online) {
    return (
      <GameFrame gameId="bingo" onExit={() => { setActiveRoom(null); void exitMatch(nav); }} header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">{t('g.bingo.name')}</p>}
        felt={<div className="grid h-full place-items-center"><span className="size-6 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" aria-hidden /></div>} bottom={null} />
    );
  }
  if (!s) {
    return (
      <GameFrame gameId="bingo" header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">{t('g.bingo.name')}</p>}
        felt={(
          <div className="grid h-full place-items-center p-6">
            <div className="grid w-full max-w-xs gap-3 text-center">
              <div className="mx-auto size-24"><Drum spinning={false} /></div>
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-amber-300">¿Cuántos cartones?</h2>
              {[1, 2, 3, 4].map((c) => (
                <Button key={c} variant={c === 2 ? 'primary' : 'secondary'} block disabled={w.chips < c * BET} onClick={() => begin(c)}>{c} {c === 1 ? 'cartón' : 'cartones'} · {c * BET} fichas</Button>
              ))}
              <p className="text-xs text-stone-400">90 bolas, 3 rivales. Premio de Línea (20 % del bote) y de Bingo (80 %). Fichas virtuales, nunca dinero real.</p>
            </div>
          </div>
        )} bottom={null} />
    );
  }

  const over = s.phase === 'over';
  const winner = s.bingoBy ? s.players.find((p) => p.id === s.bingoBy) : null;
  const rivals = s.players.filter((p) => p.id !== me);
  const felt = (
    <div className="flex h-full min-h-0 flex-col gap-2 p-[clamp(6px,2vw,14px)]">
      <div className="flex shrink-0 items-center gap-3">
        <div className="size-[clamp(64px,18vw,92px)] shrink-0"><Drum spinning={playing} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <AnimatePresence mode="popLayout">
              {current !== undefined && (
                <motion.div key={current} initial={{ scale: 0, y: -30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}><Ball n={current} big /></motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-1">{lastBalls.map((b) => <Ball key={b} n={b} />)}</div>
          </div>
          <p className="mt-1 truncate text-[11px] tabular-nums text-stone-400">{drawn.length}/90 · {rivals.map((p) => `${p.name.split(' ').pop()}: ${s.lineBy ? Math.min(...p.cards.map((c) => missingBingo(c, p.marks))) : Math.min(...p.cards.map((c) => missingLine(c, p.marks)))}`).join(' · ')}</p>
        </div>
      </div>
      {/* panel 1–90 */}
      <div className="grid shrink-0 grid-cols-[repeat(18,minmax(0,1fr))] gap-[2px]" aria-label="Panel 1 a 90">
        {Array.from({ length: 90 }, (_, i) => i + 1).map((b) => (
          <span key={b} className={`grid h-[clamp(13px,2.6vw,18px)] place-items-center rounded-[3px] text-[clamp(7px,1.9vw,10px)] font-bold tabular-nums ${drawn.includes(b) ? 'bg-amber-300 text-[#2a1d02]' : 'bg-white/[0.07] text-white/40'}`}>{b}</span>
        ))}
      </div>
      <div className="no-scrollbar grid min-h-0 flex-1 content-start gap-2 overflow-y-auto">
        {mine?.cards.map((c, i) => <CardView key={i} idx={i} card={c} drawn={drawn} marks={mine.marks} onMark={mark} />)}
      </div>
    </div>
  );

  const bottom = (
    <div className="grid w-full gap-1.5">
      <div className="flex w-full items-center gap-1.5">
        {SPEEDS.map((x) => (
          <button key={x.id} type="button" onClick={() => { setSpeed(x.id); feedback('tap'); }} className={`h-9 min-w-0 flex-1 touch-manipulation rounded-xl border text-[11.5px] font-bold active:scale-95 ${speed === x.id ? 'border-[#FCE38A] bg-[#FCE38A]/15 text-[#FCE38A]' : 'border-white/10 bg-white/[0.06] text-stone-300'}`}>{x.label}</button>
        ))}
        <button type="button" role="switch" aria-checked={auto} onClick={() => { setAuto((v) => !v); feedback('tap'); }} className={`flex h-9 shrink-0 touch-manipulation items-center gap-1 rounded-xl border px-2.5 text-[11.5px] font-bold active:scale-95 ${auto ? 'border-emerald-300/60 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-white/[0.06] text-stone-300'}`}>{auto && <Check size={13} strokeWidth={2} aria-hidden />}Auto</button>
      </div>
      <div className="flex min-h-[48px] w-full items-center gap-2" role="group" aria-label="Acciones">
        <button type="button" disabled={over || !!s.lineBy} onClick={() => claim('line')} className="flex h-12 min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.08] text-[13px] font-extrabold text-white active:scale-95 disabled:opacity-35"><Zap size={16} strokeWidth={1.75} aria-hidden />¡Cantar LÍNEA!</button>
        <button type="button" disabled={over} onClick={() => claim('bingo')} className="flex h-12 min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] text-[13px] font-extrabold text-[#2a1d02] active:scale-95 disabled:opacity-35">¡Cantar BINGO!</button>
      </div>
      <p className="h-4 text-center text-[11px] font-bold leading-4 text-amber-200" aria-live="polite">{note}</p>
    </div>
  );

  return (
    <GameFrame
      gameId="bingo" feltTone="emerald"
      onExit={online ? () => { setActiveRoom(null); void exitMatch(nav); } : undefined}
      header={<p className="truncate text-center font-[var(--font-display)] text-lg font-bold text-amber-300">{t('g.bingo.name')}</p>}
      strip={<HudPills items={[{ label: 'Bote', value: s.pot }, { label: 'Premio Línea', value: s.lineBy ? '—' : linePrize(s) }, { label: 'Premio Bingo', value: bingoPrize(s) }]} />}
      felt={felt}
      bottom={bottom}
      overlays={(
        <AnimatePresence>
          {over && (
            <ResultOverlay outcome={s.bingoBy === me ? 'win' : 'lose'} prize={s.bingoBy === me ? bingoPrize(s) + (s.lineBy === me ? linePrize(s) : 0) : s.lineBy === me ? linePrize(s) : 0} taunt=""
              title={winner ? (winner.id === me ? '¡BINGO!' : `Bingo de ${winner.name}`) : 'Sin bolas'}
              actions={[
                ...(hostLike ? [{ label: 'Otra partida', primary: true, onClick: () => { if (online) { paid.current = { line: false, bingo: false, buy: false }; hostStart(); } else { paid.current = { line: false, bingo: false, buy: false }; setS(null); setN(null); } } }] : []),
                { label: t('a.lobby'), onClick: () => { void exitMatch(nav); } },
              ]}>
              <p className="text-center text-sm tabular-nums text-stone-300">{s.drawn.length} bolas{n ? ` · ${n} cartones` : ''}{WIN_BONUS ? '' : ''}</p>
            </ResultOverlay>
          )}
        </AnimatePresence>
      )}
    />
  );
}
