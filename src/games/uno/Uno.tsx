import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, RotateCw } from 'lucide-react';
import { SeatBadge } from '../mus/app/components/SeatBadge.tsx';
import { TableAvatar } from '../mus/app/components/TableAvatar.tsx';
import { Button } from '../mus/app/components/ui.tsx';
import type { Bubble } from '../mus/app/game/describe.ts';
import type { SeatInfo } from '../mus/app/game/types.ts';
import { aiDelay, feedback } from '../../store/settings.ts';
import { useT } from '../../i18n/index.ts';
import { wallet } from '../../store/wallet.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, PhaseCinematic, PillBar, ResultOverlay, useBanner, useCine, type PillSpec } from '../shared/kit.tsx';
import {
  COLORS, COLOR_NAME, botMove, drawCard, handPoints, isPlayable, newGame, passTurn, playCard, playableCards,
  type Color, type UnoCard, type UnoPlayer, type UnoState,
} from './engine.ts';
import { UNO_HEX, UnoCardView } from './UnoCard.tsx';

const WIN_BONUS = 100;
type Slot = 'bottom' | 'right' | 'top' | 'left';
const SLOT: Record<2 | 3 | 4, Slot[]> = { 2: ['bottom', 'top'], 3: ['bottom', 'right', 'left'], 4: ['bottom', 'right', 'top', 'left'] };
const BOT_NAMES = ['Jon', 'Nerea', 'Aitor'];

const makePlayers = (n: 2 | 3 | 4): UnoPlayer[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: i === 0 ? 'Tú' : BOT_NAMES[i - 1]!, human: i === 0 }));

const colorOrder = (c: UnoCard['color']): number => (c === 'wild' ? 9 : COLORS.indexOf(c));
const sortHand = (h: UnoCard[]): UnoCard[] =>
  [...h].sort((a, b) => colorOrder(a.color) - colorOrder(b.color) || (a.kind === 'num' ? a.n : 20) - (b.kind === 'num' ? b.n : 20));

const info = (i: number, name: string): SeatInfo => ({ seat: (i % 4) as SeatInfo['seat'], userId: null, name, isBot: true, online: true });

export default function Uno() {
  const nav = useNavigate();
  const t = useT();
  const [count, setCount] = useState<2 | 3 | 4 | null>(null);
  const [s, setS] = useState<UnoState | null>(null);
  const [pickFor, setPickFor] = useState<UnoCard | null>(null);
  const [bubbles, setBubbles] = useState<Record<string, Bubble | undefined>>({});
  const { banner, show } = useBanner(1500);
  const { cine, show: showCine } = useCine();
  const paid = useRef(false);
  const lastSeq = useRef(0);

  const start = (n: 2 | 3 | 4) => { setCount(n); setS(newGame(makePlayers(n))); setBubbles({}); setPickFor(null); paid.current = false; lastSeq.current = 0; };

  // IA: juega con una pausa natural.
  useEffect(() => {
    if (!s || s.winner) return;
    const p = s.players[s.turn]!;
    if (p.human) return;
    const t = window.setTimeout(() => {
      setS((cur) => {
        if (!cur || cur.winner || cur.players[cur.turn]!.id !== p.id) return cur;
        const m = botMove(cur);
        const next = m.type === 'play' ? playCard(cur, p.id, m.cardId, m.color) : m.type === 'draw' ? drawCard(cur, p.id) : passTurn(cur, p.id);
        return next ?? passTurn(cur, p.id) ?? cur;
      });
    }, aiDelay(950 + Math.random() * 450));
    return () => window.clearTimeout(t);
  }, [s]);

  // Sucesos: globos de los bots, aviso central propio, sonidos.
  useEffect(() => {
    const e = s?.event;
    if (!s || !e || e.seq === lastSeq.current) return;
    lastSeq.current = e.seq;
    const who = s.players.find((p) => p.id === e.by)!;
    feedback(/UNO/.test(e.text) ? 'win' : /\+/.test(e.text) ? 'thud' : 'deal');
    if (who.human) show(e.text);
    else {
      const at = Date.now();
      const tone: Bubble['tone'] = /UNO/.test(e.text) ? 'ordago' : /\+/.test(e.text) ? 'bad' : 'bet';
      setBubbles((b) => ({ ...b, [who.id]: { text: e.text, tone, at } }));
      window.setTimeout(() => setBubbles((b) => (b[who.id]?.at === at ? { ...b, [who.id]: undefined } : b)), 2000);
    }
  }, [s, show]);

  useEffect(() => {
    if (!s?.winner || paid.current) return;
    paid.current = true;
    if (s.players.find((p) => p.id === s.winner)!.human) { wallet.add(WIN_BONUS); wallet.recordWin('uno'); feedback('win'); showCine('¡VICTORIA!', `+${WIN_BONUS} fichas`); }
  }, [s, showCine]);

  const myHand = s?.hands.p0 ?? [];
  const sorted = useMemo(() => sortHand(myHand), [myHand]);

  const act = useCallback((fn: (cur: UnoState) => UnoState | null) => {
    setS((cur) => (cur && !cur.winner && cur.players[cur.turn]!.human ? fn(cur) ?? cur : cur));
  }, []);

  if (!count || !s) {
    return (
      <GameFrame
        gameId="uno"
        header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">Uno</p>}
        felt={
          <div className="grid h-full place-items-center p-6">
            <div className="grid w-full max-w-xs gap-3 text-center">
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-amber-300">¿Cuántos jugadores?</h2>
              <Button variant="primary" block onClick={() => start(4)}>4 jugadores · tú + 3 IA</Button>
              <Button variant="secondary" block onClick={() => start(3)}>3 jugadores · tú + 2 IA</Button>
              <Button variant="secondary" block onClick={() => start(2)}>1 vs 1 · contra la IA</Button>
              <p className="text-xs text-stone-400">Vacía tu mano primero. Juega por color o por número; el +4 solo si no tienes el color en juego.</p>
            </div>
          </div>
        }
        bottom={null}
      />
    );
  }

  const slots = SLOT[count];
  const myTurn = !s.winner && s.players[s.turn]!.human;
  const playable = myTurn ? new Set(playableCards(s, 'p0').map((c) => c.id)) : new Set<string>();
  const canDraw = myTurn && !s.drawn && playable.size === 0;
  const topCard = s.discard[s.discard.length - 1]!;
  const seat = (slot: 'top' | 'left' | 'right') => {
    const i = slots.indexOf(slot);
    if (i === -1) return null;
    const p = s.players[i]!;
    const n = s.hands[p.id]!.length;
    return (
      <SeatBadge info={info(i, `${p.name} · ${n}`)} tone="them" mano={false} turn={s.turn === i && !s.winner} deadline={null}
        cards={Math.min(n, 7)} bubble={bubbles[p.id]} bubbleSide={slot === 'top' ? 'below' : slot === 'left' ? 'left' : 'right'} />
    );
  };

  const choose = (color: Color) => {
    const card = pickFor;
    setPickFor(null);
    if (card) act((cur) => playCard(cur, 'p0', card.id, color));
  };
  const onCard = (c: UnoCard) => {
    if (!myTurn || !isPlayable(s, c, myHand)) return;
    if (c.color === 'wild') { setPickFor(c); return; }
    act((cur) => playCard(cur, 'p0', c.id));
  };

  const pills: PillSpec[] = pickFor ? [] : myTurn && s.drawn
    ? [{ id: 'pass', tone: 'soft', label: t('a.pass'), onPress: () => act((cur) => passTurn(cur, 'p0')) }]
    : canDraw ? [{ id: 'draw', tone: 'gold', label: t('a.draw'), onPress: () => act((cur) => drawCard(cur, 'p0')) }] : [];
  if (!pickFor && myHand.length === 1 && !s.winner) pills.unshift({ id: 'uno', tone: 'danger', label: '¡UNO!', onPress: () => { feedback('win'); show('¡UNO!'); } });
  const status = s.winner ? '' : myTurn ? (s.drawn ? 'Puedes jugar la carta robada o pasar' : canDraw ? 'No tienes jugada: roba' : 'Tu turno: juega una carta') : `Juega ${s.players[s.turn]!.name}…`;

  const felt = (
    <>
      <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-1 p-[clamp(6px,2vw,16px)]">
        <div className="col-start-2 row-start-1 justify-self-center">{seat('top')}</div>
        <div className="col-start-1 row-span-2 row-start-1 self-center justify-self-center">{seat('left')}</div>
        <div className="col-start-2 row-start-2 grid min-h-0 place-items-center">
          <div className="grid justify-items-center gap-3">
            <div className="flex items-center gap-[min(3vw,14px)]">
              <div className="grid justify-items-center gap-1">
                <UnoCardView card={topCard} faceDown scale={0.62} onClick={canDraw ? () => act((cur) => drawCard(cur, 'p0')) : undefined} glow={canDraw} />
                <span className="font-mono text-[10px] text-amber-200/80">{s.drawPile.length}</span>
              </div>
              <AnimatePresence mode="popLayout">
                <motion.div key={topCard.id} initial={{ scale: 1.3, opacity: 0, rotate: 18 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="rounded-[14px]" style={{ boxShadow: `0 0 0 3px ${UNO_HEX[s.color]}, 0 0 22px ${UNO_HEX[s.color]}99` }}>
                  <UnoCardView card={topCard} scale={0.8} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold text-stone-200" aria-label={`Color actual ${COLOR_NAME[s.color]}`}>
              <span className="size-3 rounded-full" style={{ background: UNO_HEX[s.color] }} /> {COLOR_NAME[s.color]}
              {s.dir === 1 ? <RotateCw size={13} aria-label="Sentido horario" /> : <RotateCcw size={13} aria-label="Sentido antihorario" />}
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
          <b className={`truncate text-[13px] ${myTurn ? 'text-amber-200' : 'text-stone-200'}`}>Tú</b>
          <span className="rounded-full border border-white/10 bg-zinc-900/70 px-2 py-[2px] text-[10px] font-bold text-stone-300">{myHand.length} cartas</span>
        </div>
        <span className="text-[11px] text-stone-400">{status}</span>
      </div>
      {pickFor ? (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/75 p-1.5" role="group" aria-label="Elige color">
          <span className="px-2 text-[12px] font-bold text-stone-300">Color:</span>
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={COLOR_NAME[c]} onClick={() => choose(c)}
              className="size-10 rounded-full border-2 border-white/70 shadow-[0_4px_12px_rgba(0,0,0,.4)] transition active:scale-90" style={{ background: UNO_HEX[c] }} />
          ))}
          <button type="button" className="px-2 text-[12px] font-bold text-stone-400" onClick={() => setPickFor(null)}>Cancelar</button>
        </div>
      ) : <PillBar pills={pills} />}
      <div className="w-full overflow-x-auto pb-1 pt-[min(2.4dvh,18px)]" role="group" aria-label="Tu mano">
        <div className="mx-auto flex w-max items-end px-2">
          {sorted.map((c, i) => (
            <div key={c.id} style={{ marginLeft: i === 0 ? 0 : `calc(var(--card-w) * ${sorted.length > 9 ? -0.46 : sorted.length > 6 ? -0.34 : -0.12})`, zIndex: i }}>
              <UnoCardView card={c} scale={0.82} playable={playable.has(c.id)} dim={myTurn && !playable.has(c.id)} onClick={myTurn && playable.has(c.id) ? () => onCard(c) : undefined} />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const winner = s.winner ? s.players.find((p) => p.id === s.winner)! : null;
  return (
    <GameFrame
      gameId="uno"
      timer={{ active: myTurn, id: `${s.turn}:${myHand.length}:${s.drawn?.id ?? ''}:${s.drawPile.length}`, onTimeout: () => act((cur) => { const m = botMove(cur); return m.type === 'play' ? playCard(cur, 'p0', m.cardId, m.color) : m.type === 'draw' ? drawCard(cur, 'p0') : passTurn(cur, 'p0'); }) }}
      header={
        <div className="grid grid-cols-2 gap-[min(1.8vw,8px)]" role="group" aria-label="Estado">
          <div className="min-w-0 rounded-[13px] border border-white/10 bg-gradient-to-br from-teal-400/10 to-black/30 px-3 py-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-teal-300">Turno</p>
            <b className="block truncate text-[13px]">{s.winner ? '—' : s.players[s.turn]!.name}</b>
          </div>
          <div className="min-w-0 rounded-[13px] border border-white/10 bg-gradient-to-br from-orange-400/10 to-black/30 px-3 py-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-orange-300">Mazo</p>
            <b className="block text-[13px] tabular-nums">{s.drawPile.length} cartas</b>
          </div>
        </div>
      }
      felt={felt}
      bottom={bottom}
      overlays={
        <>
          <PhaseCinematic cine={cine} />
          <AnimatePresence>
            {winner && (
              <ResultOverlay
                title={winner.human ? '¡Has ganado!' : `Gana ${winner.name}`}
                actions={[
                  { label: 'Otra partida', primary: true, onClick: () => start(count) },
                  { label: 'Cambiar jugadores', onClick: () => { setCount(null); setS(null); } },
                  { label: t('a.lobby'), onClick: () => nav('/') },
                ]}
              >
                <ul className="grid gap-1 text-sm">
                  {s.players.map((p) => (
                    <li key={p.id} className="flex justify-between border-b border-white/10 py-1">
                      <span className={p.id === s.winner ? 'font-bold text-amber-300' : ''}>{p.name}</span>
                      <span className="tabular-nums text-stone-300">{s.hands[p.id]!.length} cartas · {handPoints(s.hands[p.id]!)} pts</span>
                    </li>
                  ))}
                </ul>
                {winner.human && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{WIN_BONUS} fichas de premio</p>}
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
}
