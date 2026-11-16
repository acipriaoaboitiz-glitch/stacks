import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { CardBack } from '../mus/app/components/CardFace.tsx';
import { SeatBadge } from '../mus/app/components/SeatBadge.tsx';
import { TableAvatar } from '../mus/app/components/TableAvatar.tsx';
import { Button } from '../mus/app/components/ui.tsx';
import type { SeatInfo } from '../mus/app/game/types.ts';
import { useT } from '../../i18n/index.ts';
import { aiDelay, feedback } from '../../store/settings.ts';
import { wallet } from '../../store/wallet.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, FaceCard, PhaseCinematic, PillBar, ResultOverlay, ScorePair, ScoreStrip, escobaDeco, tilt, useBanner, useCine, type PillSpec } from '../shared/kit.tsx';
import {
  TARGET_SCORE, botMove, escobaValue, findCaptures, isValidCapture, newMatch, nextRound, play, type EscobaState,
} from './engine.ts';

const WIN_BONUS = 100;
const NAMES = ['Tú', 'Jon', 'Nerea', 'Aitor'];
type Slot = 'bottom' | 'right' | 'top' | 'left';
const SLOT: Record<2 | 3 | 4, Slot[]> = { 2: ['bottom', 'top'], 3: ['bottom', 'right', 'left'], 4: ['bottom', 'right', 'top', 'left'] };

/** Las cartas capturadas se agrupan y se deslizan al montón de quien las gana. */
const takeVariants: Variants = {
  exit: (dy: number) => ({ y: dy, scale: 0.35, opacity: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.9, 0.4] } }),
};

const nameOf = (n: number, i: number): string => (n === 2 && i === 1 ? 'Bot' : NAMES[i]!);
const info = (i: number, name: string): SeatInfo => ({ seat: (i % 4) as SeatInfo['seat'], userId: null, name, isBot: true, online: true });

export default function Escoba() {
  const nav = useNavigate();
  const t = useT();
  const [params] = useSearchParams();
  const preset = Number(params.get('players'));
  const [count, setCount] = useState<2 | 3 | 4 | null>(preset >= 2 && preset <= 4 ? (preset as 2 | 3 | 4) : null);
  const [s, setS] = useState<EscobaState | null>(() => (preset >= 2 && preset <= 4 ? newMatch(preset) : null));
  const [selCard, setSelCard] = useState<string | null>(null);
  const [selTable, setSelTable] = useState<number[]>([]);
  const { banner, show } = useBanner();
  const { cine, show: showCine } = useCine();
  const prevRef = useRef<EscobaState | null>(s);

  const commit = useCallback((next: EscobaState) => {
    const prev = prevRef.current;
    prevRef.current = next;
    setS(next);
    const lp = next.lastPlay;
    if (lp && lp !== prev?.lastPlay) {
      feedback(lp.taken.length ? 'trick' : 'deal');
      if (lp.taken.length) show(`${lp.by === 0 ? 'Te llevas' : `${nameOf(next.n, lp.by)} se lleva`} ${lp.taken.length + 1} cartas`);
    }
    if (lp?.escoba && lp !== prev?.lastPlay) { feedback('win'); showCine('¡ESCOBA!', '+1 punto'); }
    if (next.phase === 'matchOver' && prev?.phase !== 'matchOver' && next.scores[0]! === Math.max(...next.scores)) wallet.add(WIN_BONUS);
  }, [show, showCine]);

  const start = (n: 2 | 3 | 4) => { const g = newMatch(n); prevRef.current = g; setCount(n); setS(g); setSelCard(null); setSelTable([]); };

  useEffect(() => {
    if (!s || s.phase !== 'playing' || s.turn === 0) return;
    const timer = window.setTimeout(() => {
      const m = botMove(s);
      const next = play(s, m.cardId, m.take);
      if (next) commit(next);
    }, aiDelay(1000));
    return () => window.clearTimeout(timer);
  }, [s, commit]);

  if (!count || !s) {
    return (
      <GameFrame
        gameId="escoba"
        header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">{t('g.escoba.name')}</p>}
        felt={
          <div className="grid h-full place-items-center p-6">
            <div className="grid w-full max-w-xs gap-3 text-center">
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-amber-300">{t('a.format')}</h2>
              <Button variant="primary" block onClick={() => start(2)}>1 vs 1</Button>
              <Button variant="secondary" block onClick={() => start(3)}>3 · tú + 2 IA</Button>
              <Button variant="secondary" block onClick={() => start(4)}>4 · tú + 3 IA</Button>
              <p className="text-xs text-stone-400">Suma 15 con las cartas de la mesa. Sota 8, Caballo 9, Rey 10. Gana quien llegue a {TARGET_SCORE} puntos.</p>
            </div>
          </div>
        }
        bottom={null}
      />
    );
  }

  const n = s.n;
  const slots = SLOT[count];
  const myTurn = s.phase === 'playing' && s.turn === 0;
  const card = myTurn && selCard ? s.hands[0]!.find((c) => c.id === selCard) ?? null : null;
  const caps = card ? findCaptures(s.table, card) : [];
  const sum = card ? selTable.reduce((acc, i) => acc + escobaValue(s.table[i]!), escobaValue(card)) : 0;
  const valid = card ? (caps.length === 0 ? selTable.length === 0 : isValidCapture(s.table, card, selTable)) : false;

  const pickCard = (id: string) => {
    if (!myTurn) return;
    if (selCard === id) { setSelCard(null); setSelTable([]); return; }
    setSelCard(id);
    const c = s.hands[0]!.find((x) => x.id === id)!;
    const options = findCaptures(s.table, c);
    setSelTable(options.length === 1 ? options[0]! : []);
  };
  const toggleTable = (i: number) => {
    if (!card || caps.length === 0) return;
    setSelTable((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  };
  const clear = () => { setSelCard(null); setSelTable([]); };
  const confirm = () => {
    if (!card || !valid) return;
    const next = play(s, card.id, selTable);
    clear();
    if (next) commit(next);
  };

  const over = s.phase !== 'playing';
  const best = Math.max(...s.scores);
  const iWon = s.phase === 'matchOver' && s.scores[0] === best;
  const lp = s.lastPlay;
  const status = over ? '' : !myTurn ? `${t('g.thinking').replace('…', '')} ${nameOf(n, s.turn)}…` : card
    ? (caps.length ? `Suma ${sum}/15 · elige las cartas de la mesa` : 'Sin captura: tírala a la mesa')
    : lp ? (lp.taken.length ? `${lp.by === 0 ? 'Te llevas' : `${nameOf(n, lp.by)} se lleva`} ${lp.taken.length + 1} cartas` : `${lp.by === 0 ? 'Tiras' : `${nameOf(n, lp.by)} tira`} una carta`) : t('g.yourTurn');

  const pills: PillSpec[] = card ? [
    { id: 'ok', tone: 'gold', disabled: !valid, onPress: confirm, label: caps.length === 0 ? t('a.throw') : valid ? `${t('a.take')} ${selTable.length + 1}` : `Suma ${sum}` },
    { id: 'clear', tone: 'soft', onPress: clear, label: t('a.clear') },
  ] : [];

  const seat = (slot: 'top' | 'left' | 'right') => {
    const i = slots.indexOf(slot);
    if (i === -1) return null;
    return (
      <SeatBadge info={info(i, nameOf(n, i))} tone="them" mano={false} turn={s.phase === 'playing' && s.turn === i} deadline={null} cards={s.hands[i]!.length} />
    );
  };
  const exitDy = (by: number): number => (by === 0 ? 300 : -300);

  const felt = (
    <>
      <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-1 p-[clamp(6px,2vw,16px)]">
        <div className="col-start-2 row-start-1 justify-self-center">{seat('top')}</div>
        <div className="col-start-1 row-span-2 row-start-1 self-center justify-self-center">{seat('left')}</div>
        <div className="col-start-2 row-start-2 grid min-h-0 place-items-center" aria-label="Mesa">
          <div className="flex max-w-[560px] flex-wrap items-center justify-center gap-[min(2vw,10px)]">
            <AnimatePresence custom={exitDy(s.lastPlay?.by ?? 0)}>
              {s.table.map((c, i) => (
                <motion.div key={c.id} layout custom={exitDy(s.lastPlay?.by ?? 0)} variants={takeVariants} exit="exit"
                  initial={s.lastPlay && s.lastPlay.by !== 0 && s.lastPlay.card.id === c.id ? { y: -160, opacity: 0, scale: 1.1, rotate: 20 } : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}>
                  <FaceCard card={c} scale={0.7} layoutId={c.id} rotate={tilt(c.id)} selected={selTable.includes(i)} {...escobaDeco(c)}
                    dim={!!card && caps.length > 0 && !caps.some((cap) => cap.includes(i))}
                    onClick={card && caps.length > 0 ? () => toggleTable(i) : undefined} />
                </motion.div>
              ))}
            </AnimatePresence>
            {s.table.length === 0 && !over && <span className="text-sm font-bold text-white/30">Mesa limpia</span>}
          </div>
        </div>
        <div className="col-start-3 row-span-2 row-start-1 self-center justify-self-center">{seat('right')}</div>
      </div>
      <div className="absolute left-[clamp(6px,2vw,14px)] top-[clamp(6px,2vw,14px)] z-10 flex items-center gap-1.5" aria-label={`${s.deck.length} cartas en el mazo`}>
        <div className="relative aspect-[12/19] w-[calc(var(--card-w)*.4)]">
          {[2, 1, 0].map((k) => (
            <span key={k} className="absolute inset-0 overflow-hidden rounded-[6px] shadow-[0_4px_8px_rgba(0,0,0,.4)]" style={{ transform: `translate(${k * 2}px, ${-k * 2}px)` }}><CardBack /></span>
          ))}
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
          <b className={`truncate text-[13px] ${myTurn ? 'text-amber-200' : 'text-stone-200'}`}>{t('g.you')}</b>
          <span className="rounded-full border border-white/10 bg-zinc-900/70 px-2 py-[2px] text-[10px] font-bold text-stone-300">{s.captured[0]!.length} cartas</span>
        </div>
        <span className="text-[11px] text-stone-400">Ronda {s.roundNo} · escobas <b className="text-amber-200">{s.escobas[0]}</b></span>
      </div>
      {pills.length > 0 && <p className="text-center text-[12px] font-semibold text-amber-100/80" aria-live="polite">{status}</p>}
      <PillBar pills={pills} idle={status} />
      <div className="flex items-end justify-center gap-[min(2vw,12px)] pt-[min(3.4dvh,26px)]" role="group" aria-label="Tu mano">
        {s.hands[0]!.map((c, i, arr) => (
          <FaceCard key={c.id} card={c} layoutId={c.id} rotate={(i - (arr.length - 1) / 2) * 1.8} selected={selCard === c.id} dim={!myTurn} {...escobaDeco(c)}
            onClick={myTurn ? () => pickCard(c.id) : undefined} />
        ))}
      </div>
    </>
  );

  return (
    <GameFrame
      gameId="escoba"
      header={n === 2
        ? <ScorePair labels={['Tú', 'Bot']} values={[s.scores[0]!, s.scores[1]!]} target={TARGET_SCORE} />
        : <ScoreStrip items={s.scores.map((v, i) => ({ name: nameOf(n, i), value: v, us: i === 0 }))} target={TARGET_SCORE} />}
      felt={felt}
      bottom={bottom}
      overlays={
        <>
          <PhaseCinematic cine={cine} />
          <AnimatePresence>
            {over && s.summary && (
              <ResultOverlay
                title={s.phase === 'matchOver' ? (iWon ? t('g.win') : t('g.lose')) : 'Fin de la ronda'}
                actions={s.phase === 'matchOver'
                  ? [{ label: t('a.rematch'), primary: true, onClick: () => start(count) }, { label: t('a.lobby'), onClick: () => nav('/') }]
                  : [{ label: t('a.next'), primary: true, onClick: () => { clear(); const nx = nextRound(s); prevRef.current = nx; setS(nx); } }]}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-stone-400">
                      <th className="text-left font-bold" />
                      {s.scores.map((_, i) => <th key={i} className="w-12 text-right font-bold">{nameOf(n, i)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {s.summary.map((l) => (
                      <tr key={l.label} className="border-b border-white/10">
                        <td className="py-1.5 text-[12px]">{l.label}</td>
                        {l.points.map((p, i) => <td key={i} className="text-right font-bold tabular-nums">{p}</td>)}
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 font-extrabold">Total (a {TARGET_SCORE})</td>
                      {s.scores.map((v, i) => <td key={i} className={`text-right font-[var(--font-display)] text-lg font-bold tabular-nums ${v === best ? 'text-amber-300' : ''}`}>{v}</td>)}
                    </tr>
                  </tbody>
                </table>
                {iWon && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{WIN_BONUS} fichas de premio</p>}
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
}
