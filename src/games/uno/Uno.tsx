import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setActiveRoom } from '../../services/multiplayer.ts';
import { useReplica, useSeating } from '../../services/onlineGame.ts';
import { juice } from '../../services/juice.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, RotateCw } from 'lucide-react';
import { SeatBadge } from '../mus/app/components/SeatBadge.tsx';
import { TableAvatar } from '../mus/app/components/TableAvatar.tsx';
import { Button } from '../mus/app/components/ui.tsx';
import type { SeatInfo } from '../mus/app/game/types.ts';
import { CARD_EASE, botDelay, feedback } from '../../store/settings.ts';
import { useT } from '../../i18n/index.ts';
import { wallet } from '../../store/wallet.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, PhaseCinematic, PillBar, ResultOverlay, useBanner, useCine, type PillSpec } from '../shared/kit.tsx';
import {
  COLORS, COLOR_NAME, UNO_WINDOW, applyUnoAction, botMove, callUno, catchUno, expireUno, handPoints, isPlayable, newGame, playableCards,
  type Color, type UnoAction, type UnoCard, type UnoPlayer, type UnoState,
} from './engine.ts';
import { UNO_HEX, UnoBack, UnoCard as UnoCardView } from './UnoCard.tsx';

const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

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
  const seating = useSeating('uno');
  const online = seating.online;
  const [count, setCount] = useState<2 | 3 | 4 | null>(null);
  const [s, setS] = useState<UnoState | null>(null);
  const [pickFor, setPickFor] = useState<UnoCard | null>(null);
  const [marks, setMarks] = useState<Record<string, { text: string; at: number } | undefined>>({});
  const [flights, setFlights] = useState<{ id: number; slot: Slot }[]>([]);
  const flightId = useRef(0);
  const { banner, show } = useBanner(1500);
  const { cine, show: showCine } = useCine();
  const paid = useRef(false);
  const lastSeq = useRef('');
  // Quién soy: en una sala, el jugador con mi peerId; en local, siempre p0.
  const me = online ? s?.players.find((p) => p.peerId === seating.myPeerId)?.id ?? 'p0' : 'p0';

  const start = (n: 2 | 3 | 4) => { setCount(n); setS(newGame(makePlayers(n))); setMarks({}); setPickFor(null); paid.current = false; lastSeq.current = ''; };

  // Online: el anfitrión reparte con los humanos de la sala y, si está activado, rellena con bots.
  const hostStart = () => {
    const humans = seating.humans;
    const n = Math.min(4, Math.max(2, seating.fillBots ? 4 : humans.length)) as 2 | 3 | 4;
    const players: UnoPlayer[] = Array.from({ length: n }, (_, i) => i < humans.length
      ? { id: `p${i}`, name: humans[i]!.name, human: true, peerId: humans[i]!.peerId }
      : { id: `p${i}`, name: BOT_NAMES[i - humans.length] ?? `Bot ${i}`, human: false });
    setS(newGame(players)); setMarks({}); setPickFor(null); paid.current = false; lastSeq.current = '';
  };
  const noS = s === null;
  useEffect(() => { if (online && seating.isHost && noS) hostStart(); }, [online, seating.isHost, noS]); // eslint-disable-line
  const { dispatch } = useReplica<UnoState, UnoAction>(seating, s, setS, applyUnoAction, (st, peer) => st.players.find((q) => q.peerId === peer)?.id ?? null);
  const hostLike = !online || seating.isHost;

  // IA: juega con una pausa natural.
  useEffect(() => {
    if (!s || s.winner || !hostLike) return;
    const p = s.players[s.turn]!;
    if (p.human) return;
    const t = window.setTimeout(() => {
      setS((cur) => {
        if (!cur || cur.winner || cur.players[cur.turn]!.id !== p.id) return cur;
        const m = botMove(cur);
        return applyUnoAction(cur, p.id, m.type === 'play' ? { k: 'play', cardId: m.cardId, color: m.color } : { k: m.type }) ?? applyUnoAction(cur, p.id, { k: 'pass' }) ?? cur;
      });
    }, botDelay());
    return () => window.clearTimeout(t);
  }, [s]);

  // «¡UNO!»: los bots lo cantan casi siempre (a veces se olvidan: puedes cazarlos con +2) y también te cazan a ti.
  const unoPid = s?.uno?.pid;
  const unoAt = s?.uno?.at;
  useEffect(() => {
    if (!unoPid || !unoAt || !hostLike) return;
    const timers: number[] = [];
    const left = Math.max(0, UNO_WINDOW - (Date.now() - unoAt));
    timers.push(window.setTimeout(() => setS((cur) => (cur?.uno?.at === unoAt ? expireUno(cur) ?? cur : cur)), left));
    const bots = s!.players.filter((p) => !p.human && p.id !== unoPid);
    if (!s!.players.find((p) => p.id === unoPid)!.human) {
      // Un bot se queda con 1 carta: 70 % lo canta; si no, tienes el margen para cazarlo.
      if (Math.random() < 0.7) timers.push(window.setTimeout(() => setS((cur) => (cur?.uno?.at === unoAt ? callUno(cur, unoPid) ?? cur : cur)), 700 + Math.random() * 700));
    } else if (bots.length && Math.random() < 0.6) {
      // Tú te has quedado con 1 carta: si tardas, un bot te caza.
      const by = bots[Math.floor(Math.random() * bots.length)]!;
      timers.push(window.setTimeout(() => setS((cur) => (cur?.uno?.at === unoAt ? catchUno(cur, by.id) ?? cur : cur)), 1500 + Math.random() * 800));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unoPid, unoAt, hostLike]);

  // Sucesos: globos de los bots, aviso central propio, sonidos.
  useEffect(() => {
    const e = s?.event;
    const key = `${e?.seq}:${e?.by}:${e?.text}`;
    if (!s || !e || key === lastSeq.current) return;
    lastSeq.current = key;
    const who = s.players.find((p) => p.id === e.by)!;
    if (e.kind === 'draw' && who.id !== me && e.text.includes('+4') && e.text.endsWith(s.players.find((p) => p.id === me)?.name ?? '#')) show(`${who.name} te echa un +4 · Color ${cap(COLOR_NAME[s.color])}`);
    if (e.kind === 'draw') void 0; // el golpe lo da la cinemática
    else if (e.text === 'Roba una carta') feedback('draw');
    else feedback(e.kind === 'uno' ? 'trick' : 'deal');
    // Sin carteles en el centro: el aviso va pegado al avatar afectado y una carta vuela desde el mazo.
    const n = s.players.length;
    const myI = Math.max(0, s.players.findIndex((p) => p.id === me));
    const slotOfId = (id: string): Slot => SLOT[n as 2 | 3 | 4][(s.players.findIndex((p) => p.id === id) - myI + n) % n]!;
    const fly = (slot: Slot): void => {
      const id = ++flightId.current;
      setFlights((f) => [...f, { id, slot }]);
      window.setTimeout(() => setFlights((f) => f.filter((x) => x.id !== id)), 650);
    };
    const markPlayer = (id: string, text: string): void => {
      const at = Date.now();
      setMarks((m) => ({ ...m, [id]: { text, at } }));
      window.setTimeout(() => setMarks((m) => (m[id]?.at === at ? { ...m, [id]: undefined } : m)), 1700);
    };
    if (e.text === 'Roba una carta') fly(slotOfId(e.by));
    else if (e.kind === 'draw') {
      const victim = s.players.find((p) => e.text.endsWith(p.name));
      if (victim) {
        markPlayer(victim.id, e.text.includes('+4') ? '+4' : '+2'); fly(slotOfId(victim.id));
        juice.cinematic({ title: e.text.includes('+4') ? '¡+4!' : '¡+2!', sub: `${who.name} → ${victim.name}`, tone: 'ruby', good: who.id === me });
      }
    } else if (e.text === 'Salta turno') {
      const idx = s.players.findIndex((p) => p.id === e.by);
      const skipped = s.players[(idx + s.dir + n) % n];
      if (skipped) { markPlayer(skipped.id, 'Ø'); juice.cinematic({ title: '¡SALTO DE TURNO!', sub: `${skipped.name} pierde el turno`, tone: 'electric', good: who.id === me }); }
    }
    const colorTone = ({ red: 'ruby', green: 'emerald', blue: 'electric', yellow: 'gold' } as const)[s.color];
    if (e.text === 'Cambio de sentido') juice.cinematic({ title: '¡CAMBIO DE SENTIDO!', sub: who.name, tone: colorTone, good: who.id === me });
    if (e.kind === 'uno') juice.cinematic({ title: '¡ÚLTIMA CARTA · UNO!', sub: who.name, tone: colorTone, good: who.id === me });
    if (who.id === me) show(e.text);
  }, [s, show, me]);

  useEffect(() => {
    if (s && !s.winner) paid.current = false;
    if (!s?.winner || paid.current) return;
    paid.current = true;
    if (s.winner === me) { wallet.add(WIN_BONUS); wallet.recordWin('uno'); showCine('¡VICTORIA!', `+${WIN_BONUS} fichas`); }
  }, [s, showCine, me]);

  const myHand = s?.hands[me] ?? [];
  const sorted = useMemo(() => sortHand(myHand), [myHand]);

  // Jugadas propias: solo en tu turno; «¡UNO!» se puede pulsar siempre.
  const act = (a: UnoAction) => { if (s && !s.winner && s.players[s.turn]!.id === me) dispatch(me, a); };

  if (!s && online) {
    return (
      <GameFrame gameId="uno" onExit={() => { setActiveRoom(null); nav('/'); }}
        header={<p className="text-center font-[var(--font-display)] text-xl font-bold text-amber-300">Uno</p>}
        felt={<div className="grid h-full place-items-center p-6 text-center"><p className="text-sm font-bold text-stone-300">Conectando con la mesa…</p></div>}
        bottom={null} />
    );
  }
  if (!s || (!online && !count)) {
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

  const nPlayers = s.players.length as 2 | 3 | 4;
  const slots = SLOT[nPlayers];
  const myIdx = Math.max(0, s.players.findIndex((p) => p.id === me));
  const myTurn = !s.winner && s.players[s.turn]!.id === me;
  const playable = myTurn ? new Set(playableCards(s, me).map((c) => c.id)) : new Set<string>();
  const canDraw = myTurn && !s.drawn && playable.size === 0;
  const topCard = s.discard[s.discard.length - 1]!;
  const seat = (slot: 'top' | 'left' | 'right') => {
    const k = slots.indexOf(slot);
    if (k === -1) return null;
    const i = (myIdx + k) % nPlayers;
    const p = s.players[i]!;
    const n = s.hands[p.id]!.length;
    return (
      <SeatBadge info={info(i, `${p.name} · ${n}`)} tone="them" mano={false} turn={s.turn === i && !s.winner} deadline={null}
        cards={Math.min(n, 4)} badge={marks[p.id]?.text} alert={Boolean(marks[p.id])} />
    );
  };

  const choose = (color: Color) => {
    const card = pickFor;
    setPickFor(null);
    if (card) act({ k: 'play', cardId: card.id, color });
  };
  // Un toque lanza la carta a la mesa (los comodines abren antes el selector de color).
  const onCard = (c: UnoCard) => {
    if (!myTurn || !isPlayable(s, c, myHand)) return;
    feedback('play');
    if (c.color === 'wild') { setPickFor(c); return; }
    act({ k: 'play', cardId: c.id });
  };
  const pressUno = () => {
    feedback('win');
    if (!s.winner) dispatch(me, { k: 'uno' });
  };

  const pills: PillSpec[] = pickFor ? [] : myTurn && s.drawn
    ? [{ id: 'pass', tone: 'soft', label: t('a.pass'), onPress: () => act({ k: 'pass' }) }]
    : [];
  if (!pickFor && s.uno && !s.winner) pills.unshift({ id: 'uno', tone: 'danger', label: '¡UNO!', onPress: pressUno });
  const status = s.winner ? '' : myTurn ? (s.drawn ? 'Puedes jugar la carta robada o pasar' : canDraw ? 'No tienes jugada: toca el mazo' : 'Te toca: elige una carta') : `Juega ${s.players[s.turn]!.name}…`;

  const felt = (
    <>
      <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-1 p-[clamp(6px,2vw,16px)]">
        <div className="col-start-2 row-start-1 justify-self-center">{seat('top')}</div>
        <div className="col-start-1 row-span-2 row-start-1 self-center justify-self-center">{seat('left')}</div>
        <div className="col-start-2 row-start-2 grid min-h-0 place-items-center">
          <div className="grid justify-items-center gap-3">
            <div className="relative flex items-center gap-[min(4vw,18px)]">
              {/* halo del color activo */}
              <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background] duration-300"
                style={{ background: `radial-gradient(circle, ${UNO_HEX[s.color]}55 0%, ${UNO_HEX[s.color]}00 68%)` }} />
              <div className="relative grid justify-items-center gap-1">
                <div role="button" tabIndex={canDraw ? 0 : -1} aria-label="Mazo: robar carta" aria-disabled={!canDraw}
                  onClick={canDraw ? () => { feedback('draw'); act({ k: 'draw' }); } : undefined}
                  onKeyDown={canDraw ? (e) => { if (e.key === 'Enter' || e.key === ' ') { feedback('draw'); act({ k: 'draw' }); } } : undefined}
                  className={`relative touch-manipulation rounded-xl ${canDraw ? 'cursor-pointer active:scale-95' : ''}`}
                  style={{ width: 'calc(var(--card-w) * 0.86)', aspectRatio: '2 / 3', marginRight: 8, marginTop: 8 }}>
                  {[4, 3, 2, 1, 0].map((k) => (
                    <span key={k} className="pointer-events-none absolute inset-0 block overflow-hidden rounded-xl" style={{ transform: `translate(${k * 1.6}px, ${-k * 1.6}px)`, boxShadow: k === 0 ? '0 3px 8px rgba(0,0,0,.5)' : undefined }}>
                      <UnoBack />
                    </span>
                  ))}
                  {canDraw && <span aria-hidden className="pointer-events-none absolute -inset-1 animate-pulse rounded-2xl" style={{ boxShadow: '0 0 0 2px #F5D061, 0 0 16px 2px rgba(245,208,97,.55)' }} />}
                </div>
                <span className="font-mono text-[10px] text-amber-200/80">{s.drawPile.length}</span>
              </div>
              <div className="relative" style={{ width: 'calc(var(--card-w) * 1.05)', height: 'calc(var(--card-w) * 0.9 * 1.5)' }}>
                {s.discard.length > 1 && (
                  <div className="absolute inset-0" style={{ transform: 'rotate(-6deg)' }}><UnoCardView card={s.discard[s.discard.length - 2]!} scale={1.05} dim /></div>
                )}
                <AnimatePresence mode="popLayout">
                  <motion.div key={topCard.id} className="absolute inset-0" initial={{ scale: 1.25, opacity: 0, rotate: 14, y: -20 }} animate={{ scale: 1, opacity: 1, rotate: 4, y: 0 }} transition={CARD_EASE}>
                    <UnoCardView card={topCard} scale={1.05} glow />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center gap-1.5" role="img" aria-label={`Color actual: ${COLOR_NAME[s.color]}. ${s.dir === 1 ? 'Sentido horario' : 'Sentido antihorario'}`}>
              <span className="size-3.5 rounded-full border border-white/60" style={{ background: UNO_HEX[s.color], boxShadow: `0 0 10px ${UNO_HEX[s.color]}` }} />
              {s.dir === 1 ? <RotateCw size={14} className="text-stone-300" /> : <RotateCcw size={14} className="text-stone-300" />}
            </div>
          </div>
        </div>
        <div className="col-start-3 row-span-2 row-start-1 self-center justify-self-center">{seat('right')}</div>
      </div>
      <AnimatePresence>
        {flights.map((f) => {
          const d = f.slot === 'top' ? { x: 0, y: -150 } : f.slot === 'left' ? { x: -150, y: 0 } : f.slot === 'right' ? { x: 150, y: 0 } : { x: 0, y: 260 };
          return (
            <motion.div key={f.id} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
              initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }} animate={{ x: d.x, y: d.y, scale: 0.55, opacity: 0, rotate: 25 }} transition={{ duration: 0.5, ease: 'easeIn' }}
              style={{ width: 'calc(var(--card-w) * 0.6)', aspectRatio: '2 / 3' }}>
              <UnoBack />
            </motion.div>
          );
        })}
      </AnimatePresence>
      <Banner text={banner} />
    </>
  );

  const bottom = (
    <>
      <div className="relative flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TableAvatar name="Tú" tone="me" active={myTurn} className="size-9 text-[15px]" />
          <b className={`truncate text-[13px] ${myTurn ? 'text-amber-200' : 'text-stone-200'}`}>Tú</b>
          <span className="whitespace-nowrap rounded-full border border-white/10 bg-zinc-900/70 px-2 py-[2px] text-[10px] font-bold text-stone-300">{myHand.length} {myHand.length === 1 ? "carta" : "cartas"}</span>
        </div>
        <span className="min-w-0 truncate text-right text-[11px] text-stone-400">{status}</span>
      </div>
      <AnimatePresence>
        {pickFor && (
          <motion.div role="group" aria-label="Elige un color" className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-900/95 px-3 py-2"
            initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={CARD_EASE}>
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={cap(COLOR_NAME[c])} onClick={() => choose(c)}
                className="size-12 touch-manipulation rounded-full border-2 border-white/80 transition active:scale-90"
                style={{ background: UNO_HEX[c], boxShadow: `0 0 14px 1px ${UNO_HEX[c]}aa` }} />
            ))}
            <button type="button" className="px-1 text-[12px] font-bold text-stone-400" onClick={() => setPickFor(null)}>Cancelar</button>
          </motion.div>
        )}
      </AnimatePresence>
      <PillBar pills={pills} />
      <div className="no-scrollbar w-full overflow-x-auto overflow-y-hidden pb-1 pt-[min(2.4dvh,18px)]" role="group" aria-label="Tu mano">
        <div className="mx-auto flex w-max items-end px-2">
          {sorted.map((c, i) => (
            <div key={c.id} style={{ marginLeft: i === 0 ? 0 : `calc(var(--card-w) * ${sorted.length > 9 ? -0.46 : sorted.length > 6 ? -0.34 : -0.12})`, zIndex: i }}>
              <UnoCardView card={c} scale={0.86} rotate={(i - (sorted.length - 1) / 2) * Math.min(3, 28 / sorted.length)} playable={playable.has(c.id)} dim={myTurn && !playable.has(c.id)} onClick={myTurn && playable.has(c.id) ? () => onCard(c) : undefined} />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const winner = s.winner ? s.players.find((p) => p.id === s.winner)! : null;
  return (
    <GameFrame
      gameId="uno" feltTone="emerald"
      timer={{ active: myTurn, id: `${s.turn}:${myHand.length}:${s.drawn?.id ?? ''}:${s.drawPile.length}`, onTimeout: () => { setPickFor(null); const m = botMove(s); act(m.type === 'play' ? { k: 'play', cardId: m.cardId, color: m.color } : { k: m.type }); } }}
      onExit={online ? () => { setActiveRoom(null); nav('/'); } : undefined}
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
                outcome={winner.id === me ? 'win' : 'lose'}
                prize={WIN_BONUS}
                taunt={myHand.length <= 2 ? 'Por los pelos' : 'Te comiste el +4'}
                title={winner.id === me ? '¡Has ganado!' : `Gana ${winner.name}`}
                actions={[
                  ...(online
                    ? seating.isHost ? [{ label: 'Otra partida', primary: true, onClick: hostStart }] : []
                    : [{ label: 'Otra partida', primary: true, onClick: () => start(count!) }, { label: 'Cambiar jugadores', onClick: () => { setCount(null); setS(null); } }]),
                  { label: t('a.lobby'), onClick: () => { if (online) setActiveRoom(null); nav('/'); } },
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
                {winner.id === me && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{WIN_BONUS} fichas de premio</p>}
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
}
