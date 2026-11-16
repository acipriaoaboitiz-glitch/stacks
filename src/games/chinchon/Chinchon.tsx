import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CardBack } from '../mus/app/components/CardFace.tsx';
import { SeatBadge } from '../mus/app/components/SeatBadge.tsx';
import { TableAvatar } from '../mus/app/components/TableAvatar.tsx';
import { Button } from '../mus/app/components/ui.tsx';
import type { SeatInfo } from '../mus/app/game/types.ts';
import type { SpanishCard } from '../../engine/deck.ts';
import { useT } from '../../i18n/index.ts';
import { aiDelay, feedback } from '../../store/settings.ts';
import { wallet } from '../../store/wallet.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, FaceCard, PhaseCinematic, PillBar, ResultOverlay, ScoreStrip, useBanner, useCine, type PillSpec } from '../shared/kit.tsx';
import {
  CLOSE_LIMIT, OUT_AT, arrange, botMove, canClose, closeRound, discardCard, drawFrom, looseValue, newGame, nextRound, type ChPlayer, type ChState,
} from './engine.ts';

const WIN_BONUS = 100;
const NAMES = ['Tú', 'Jon', 'Nerea', 'Aitor'];
type Slot = 'bottom' | 'right' | 'top' | 'left';
const SLOT: Record<2 | 3 | 4, Slot[]> = { 2: ['bottom', 'top'], 3: ['bottom', 'right', 'left'], 4: ['bottom', 'right', 'top', 'left'] };
const nameOf = (n: number, i: number): string => (n === 2 && i === 1 ? 'Bot' : NAMES[i]!);
const info = (i: number, name: string): SeatInfo => ({ seat: (i % 4) as SeatInfo['seat'], userId: null, name, isBot: true, online: true });
const makePlayers = (n: number): ChPlayer[] => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: nameOf(n, i), human: i === 0 }));

export default function Chinchon() {
  const nav = useNavigate();
  const t = useT();
  const [params] = useSearchParams();
  const preset = Number(params.get('players'));
  const [count, setCount] = useState<2 | 3 | 4 | null>(preset >= 2 && preset <= 4 ? (preset as 2 | 3 | 4) : null);
  const [s, setS] = useState<ChState | null>(() => (preset >= 2 && preset <= 4 ? newGame(makePlayers(preset)) : null));
  const [sel, setSel] = useState<string | null>(null);
  const { banner, show } = useBanner(1400);
  const { cine, show: showCine } = useCine();
  const lastSeq = useRef(0);
  const paid = useRef(false);

  const start = (n: 2 | 3 | 4) => { setCount(n); setS(newGame(makePlayers(n))); setSel(null); paid.current = false; };

  useEffect(() => {
    if (!s || (s.phase !== 'draw' && s.phase !== 'discard') || s.turn === 0) return;
    const timer = window.setTimeout(() => {
      setS((cur) => {
        if (!cur || cur.turn === 0 || (cur.phase !== 'draw' && cur.phase !== 'discard')) return cur;
        const m = botMove(cur);
        const next = m.type === 'draw' ? drawFrom(cur, m.source) : m.type === 'discard' ? discardCard(cur, m.cardId) : closeRound(cur, m.cardId);
        return next ?? cur;
      });
    }, aiDelay(900));
    return () => window.clearTimeout(timer);
  }, [s]);

  useEffect(() => {
    const e = s?.event;
    if (!s || !e || e.seq === lastSeq.current) return;
    lastSeq.current = e.seq;
    if (/CHINCH/.test(e.text)) { feedback('win'); showCine('¡CHINCHÓN!', '−10 puntos'); }
    else if (/anulada/.test(e.text)) show(e.text);
    else if (/Cierra/.test(e.text)) { feedback('thud'); show(`${s.closer === 0 ? 'Cierras' : `${nameOf(s.players.length, s.closer ?? 0)} cierra`} la ronda`); }
    else feedback('deal');
  }, [s, show, showCine]);

  useEffect(() => {
    if (s?.phase !== 'gameOver' || paid.current) return;
    paid.current = true;
    if (s.winner === 0) { wallet.add(WIN_BONUS); feedback('win'); }
  }, [s]);

  const hand = s?.hands[0] ?? [];
  const arr = useMemo(() => (hand.length === 7 ? arrange(hand) : null), [hand]);
  const ordered = useMemo<{ card: SpanishCard; grouped: boolean; gap: boolean }[]>(() => {
    if (hand.length === 0) return [];
    if (!arr) return [...hand].sort((a, b) => a.suit.localeCompare(b.suit) || a.rank - b.rank).map((card) => ({ card, grouped: false, gap: false }));
    const out: { card: SpanishCard; grouped: boolean; gap: boolean }[] = [];
    arr.groups.forEach((g) => g.forEach((card, i) => out.push({ card, grouped: true, gap: i === 0 && out.length > 0 })));
    [...arr.loose].sort((a, b) => a.suit.localeCompare(b.suit) || a.rank - b.rank).forEach((card, i) => out.push({ card, grouped: false, gap: i === 0 && out.length > 0 }));
    return out;
  }, [hand, arr]);

  if (!count || !s) {
    return (
      <GameFrame
        gameId="chinchon"
        header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">{t('g.chinchon.name')}</p>}
        felt={
          <div className="grid h-full place-items-center p-6">
            <div className="grid w-full max-w-xs gap-3 text-center">
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-amber-300">{t('a.format')}</h2>
              <Button variant="primary" block onClick={() => start(2)}>1 vs 1</Button>
              <Button variant="secondary" block onClick={() => start(3)}>3 · tú + 2 IA</Button>
              <Button variant="secondary" block onClick={() => start(4)}>4 · tú + 3 IA</Button>
              <p className="text-xs text-stone-400">Liga tríos y escaleras del mismo palo. Cierra con {CLOSE_LIMIT} puntos sueltos o menos. A {OUT_AT} puntos, eliminado.</p>
            </div>
          </div>
        }
        bottom={null}
      />
    );
  }

  const n = s.players.length;
  const slots = SLOT[count];
  const myTurn = (s.phase === 'draw' || s.phase === 'discard') && s.turn === 0;
  const looseNow = s.phase === 'discard' && hand.length === 8
    ? Math.min(...hand.map((c) => arrange(hand.filter((x) => x.id !== c.id)).unmatched))
    : arr?.unmatched ?? 0;
  const selCard = sel ? hand.find((c) => c.id === sel) ?? null : null;
  const closable = !!selCard && canClose(s, selCard.id);
  const top = s.discard[s.discard.length - 1] ?? null;
  const status = s.phase === 'gameOver' || s.phase === 'roundOver' ? ''
    : !myTurn ? `${t('g.thinking').replace('…', '')} ${nameOf(n, s.turn)}…`
    : s.phase === 'draw' ? 'Roba del mazo o del descarte' : selCard ? (closable ? 'Puedes cerrar con esta carta' : 'Elige qué hacer con la carta') : 'Elige una carta para descartar';

  const draw = (source: 'stock' | 'discard') => { if (!(myTurn && s.phase === 'draw')) return; const nx = drawFrom(s, source); if (nx) { setSel(null); setS(nx); } };
  const pills: PillSpec[] = myTurn && s.phase === 'discard' && selCard ? [
    { id: 'disc', tone: 'gold', label: t('a.discard'), onPress: () => { const nx = discardCard(s, selCard.id); if (nx) { setSel(null); setS(nx); } } },
    { id: 'close', tone: 'ok', label: t('a.close'), disabled: !closable, onPress: () => { const nx = closeRound(s, selCard.id); if (nx) { setSel(null); setS(nx); } } },
    { id: 'clr', tone: 'soft', label: t('a.clear'), onPress: () => setSel(null) },
  ] : [];

  const seat = (slot: 'top' | 'left' | 'right') => {
    const i = slots.indexOf(slot);
    if (i === -1) return null;
    return <div className={s.out[i] ? 'opacity-40' : ''}><SeatBadge info={info(i, `${nameOf(n, i)}${s.out[i] ? ' ✕' : ''}`)} tone="them" mano={s.dealer === i} turn={s.turn === i && !s.out[i] && (s.phase === 'draw' || s.phase === 'discard')} deadline={null} cards={Math.min(s.hands[i]!.length, 7)} /></div>;
  };

  const pileW = 'calc(var(--card-w) * 0.8)';
  const felt = (
    <>
      <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-1 p-[clamp(6px,2vw,16px)]">
        <div className="col-start-2 row-start-1 justify-self-center">{seat('top')}</div>
        <div className="col-start-1 row-span-2 row-start-1 self-center justify-self-center">{seat('left')}</div>
        <div className="col-start-2 row-start-2 grid min-h-0 place-items-center">
          <div className="flex items-center gap-[min(4vw,16px)]">
            <div className="grid justify-items-center gap-1">
              <motion.button type="button" whileHover={myTurn && s.phase === 'draw' ? { y: -4 } : undefined} whileTap={{ scale: 0.95 }} onClick={() => draw('stock')}
                disabled={!(myTurn && s.phase === 'draw')} aria-label={t('a.deck')}
                className="relative aspect-[12/19] overflow-hidden rounded-[8px] shadow-[0_8px_16px_rgba(0,0,0,.45)]"
                style={{ width: pileW, outline: myTurn && s.phase === 'draw' ? '2px solid #f0c35f' : undefined }}><CardBack /></motion.button>
              <span className="font-mono text-[10px] text-amber-200/80">{t('a.deck')} · {s.stock.length}</span>
            </div>
            <div className="grid justify-items-center gap-1">
              <AnimatePresence mode="popLayout">
                {top ? <motion.div key={top.id} initial={{ scale: 1.2, opacity: 0, rotate: 12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
                  <FaceCard card={top} scale={0.8} glow={myTurn && s.phase === 'draw'} onClick={myTurn && s.phase === 'draw' ? () => draw('discard') : undefined} />
                </motion.div> : <span key="empty" className="block aspect-[12/19] rounded-[8px] border border-dashed border-white/20" style={{ width: pileW }} />}
              </AnimatePresence>
              <span className="font-mono text-[10px] text-amber-200/80">{t('a.discardPile')}</span>
            </div>
          </div>
        </div>
        <div className="col-start-3 row-span-2 row-start-1 self-center justify-self-center">{seat('right')}</div>
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
          <span className={`rounded-full border px-2 py-[2px] text-[10px] font-bold ${looseNow <= CLOSE_LIMIT ? 'border-emerald-400/50 bg-emerald-900/60 text-emerald-100' : 'border-white/10 bg-zinc-900/70 text-stone-300'}`}>
            Sueltas: {looseNow}
          </span>
        </div>
        <span className="text-[11px] text-stone-400">{status}</span>
      </div>
      <PillBar pills={pills} />
      <div className="w-full overflow-x-auto pb-1 pt-[min(2.6dvh,20px)]" role="group" aria-label="Tu mano">
        <div className="mx-auto flex w-max items-end px-2">
          {ordered.map(({ card, grouped, gap }, i) => (
            <div key={card.id} style={{ marginLeft: i === 0 ? 0 : gap ? 'calc(var(--card-w) * 0.12)' : 'calc(var(--card-w) * -0.3)', zIndex: i }} className="relative">
              {grouped && <span aria-hidden className="absolute -bottom-1 left-1 right-1 h-[3px] rounded-full bg-emerald-400/80" />}
              <FaceCard card={card} scale={0.82} selected={sel === card.id} glow={s.drawn === card.id} badge={grouped ? undefined : String(looseValue(card))}
                onClick={myTurn && s.phase === 'discard' ? () => setSel((cur) => (cur === card.id ? null : card.id)) : undefined} />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const over = s.phase === 'gameOver';
  return (
    <GameFrame
      gameId="chinchon"
      header={<ScoreStrip items={s.scores.map((v, i) => ({ name: nameOf(n, i), value: v, us: i === 0 }))} target={OUT_AT} />}
      felt={felt}
      bottom={bottom}
      overlays={
        <>
          <PhaseCinematic cine={cine} />
          <AnimatePresence>
            {(s.phase === 'roundOver' || over) && s.rows && (
              <ResultOverlay
                title={over ? (s.winner === 0 ? t('g.win') : `Gana ${nameOf(n, s.winner ?? 0)}`) : s.closer === null ? 'Ronda anulada' : `Fin de la ronda · cierra ${nameOf(n, s.closer)}`}
                actions={over
                  ? [{ label: t('a.rematch'), primary: true, onClick: () => start(count) }, { label: t('a.lobby'), onClick: () => nav('/') }]
                  : [{ label: t('a.next'), primary: true, onClick: () => { setSel(null); setS(nextRound(s)); } }]}
              >
                <ul className="grid gap-1 text-sm">
                  {s.rows.map((r, i) => (
                    <li key={i} className={`flex justify-between border-b border-white/10 py-1 ${s.out[i] ? 'opacity-50' : ''}`}>
                      <span className={i === s.closer ? 'font-bold text-amber-300' : ''}>{nameOf(n, i)}{s.out[i] ? ' ✕' : ''}{r.chinchon ? ' · Chinchón' : ''}</span>
                      <span className="tabular-nums text-stone-300">{r.delta >= 0 ? '+' : ''}{r.delta} → <b>{s.scores[i]}</b></span>
                    </li>
                  ))}
                </ul>
                {over && s.winner === 0 && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{WIN_BONUS} fichas de premio</p>}
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
}
