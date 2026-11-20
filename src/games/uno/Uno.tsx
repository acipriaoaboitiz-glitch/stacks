import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
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
import { botDelay, feedback } from '../../store/settings.ts';
import { useT, botName, tr } from '../../i18n/index.ts';
import { wallet } from '../../store/wallet.ts';
import { SeriesGems, useSeries } from '../shared/series.tsx';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, PhaseCinematic, PillBar, ResultOverlay, useBanner, useCine, type PillSpec } from '../shared/kit.tsx';
import {
  COLORS, COLOR_NAME, UNO_WINDOW, applyUnoAction, botMove, callUno, expireUno, forceAdvance, handPoints, isPlayable, newGame, playableCards,
  type Color, type UnoAction, type UnoCard, type UnoPlayer, type UnoState,
} from './engine.ts';
import { UNO_HEX, UnoBack, UnoCard as UnoCardView } from './UnoCard.tsx';
import { exitMatch } from '../../services/exitMatch.ts';
import { gameInterval, gameTimeout } from '../../services/timers.ts';
import { FLY_EASE, getSeatVector } from '../../utils/gameMotion.ts';
import { AmbientGlow, CountdownRing, OrbitRing, UnoFx, fxLife, seatOffset, type FxInput, type FxItem } from './UnoFx.tsx';

const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

const WIN_BONUS = 100;
type Slot = 'bottom' | 'right' | 'top' | 'left';
const SLOT: Record<2 | 3 | 4, Slot[]> = { 2: ['bottom', 'top'], 3: ['bottom', 'right', 'left'], 4: ['bottom', 'right', 'top', 'left'] };
const botNames = (): string[] => [botName(1), botName(2), botName(3)];

const makePlayers = (n: 2 | 3 | 4): UnoPlayer[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: i === 0 ? tr('g.you') : botNames()[i - 1]!, human: i === 0 }));

const colorOrder = (c: UnoCard['color']): number => (c === 'wild' ? 9 : COLORS.indexOf(c));
const sortHand = (h: UnoCard[]): UnoCard[] =>
  [...h].sort((a, b) => colorOrder(a.color) - colorOrder(b.color) || (a.kind === 'num' ? a.n : 20) - (b.kind === 'num' ? b.n : 20));

const slotOfPlayer = (st: UnoState, me: string, id: string): Slot => {
  const n = st.players.length;
  const myI = Math.max(0, st.players.findIndex((p) => p.id === me));
  return SLOT[n as 2 | 3 | 4][(st.players.findIndex((p) => p.id === id) - myI + n) % n]!;
};

const reach = getSeatVector;
const EASE = FLY_EASE;

const info = (i: number, name: string): SeatInfo => ({ seat: (i % 4) as SeatInfo['seat'], userId: null, name, isBot: true, online: true });

export default function Uno() {
  const nav = useNavigate();
  const t = useT();
  const seating = useSeating('uno');
  const online = seating.online;
  const [count, setCount] = useState<2 | 3 | 4 | null>(null);
  const [s, setS] = useState<UnoState | null>(null);
  const [pickFor, setPickFor] = useState<UnoCard | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [shake, setShake] = useState(0);
  const [flights, setFlights] = useState<{ id: number; slot: Slot; delay: number }[]>([]);
  const flightId = useRef(0);
  const [fx, setFx] = useState<FxItem[]>([]);
  const prevS = useRef<UnoState | null>(null);
  const seenHand = useRef<Set<string>>(new Set());
  const { banner, show } = useBanner(1600);
  const { cine, show: showCine } = useCine();
  const paid = useRef(false);
  const lastSeq = useRef('');
  // Quién soy: en una sala, el jugador con mi peerId; en local, siempre p0.
  const me = online ? s?.players.find((p) => p.peerId === seating.myPeerId)?.id ?? 'p0' : 'p0';

  const start = (n: 2 | 3 | 4) => { setCount(n); setS(newGame(makePlayers(n))); setPickFor(null); paid.current = false; lastSeq.current = ''; };

  // Online: el anfitrión reparte con los humanos de la sala y, si está activado, rellena con bots.
  const hostStart = () => {
    const humans = seating.humans;
    const n = Math.min(4, Math.max(2, seating.fillBots ? 4 : humans.length)) as 2 | 3 | 4;
    const players: UnoPlayer[] = Array.from({ length: n }, (_, i) => i < humans.length
      ? { id: `p${i}`, name: humans[i]!.name, human: true, peerId: humans[i]!.peerId }
      : { id: `p${i}`, name: botNames()[i - humans.length] ?? botName(i), human: false });
    setS(newGame(players)); setPickFor(null); paid.current = false; lastSeq.current = '';
  };
  const noS = s === null;
  useEffect(() => { if (online && seating.isHost && noS) hostStart(); }, [online, seating.isHost, noS]); // eslint-disable-line
  const { dispatch } = useReplica<UnoState, UnoAction>(seating, s, setS, applyUnoAction, (st, peer) => st.players.find((q) => q.peerId === peer)?.id ?? null);
  const hostLike = !online || seating.isHost;

  // IA: juega con una pausa natural. Si su jugada no se pudiera aplicar, el turno avanza igualmente (nunca se congela).
  useEffect(() => {
    if (!s || s.winner || !hostLike) return;
    const p = s.players[s.turn]!;
    if (p.human) return;
    const id = gameTimeout(() => {
      setS((cur) => {
        if (!cur || cur.winner || cur.players[cur.turn]!.id !== p.id) return cur;
        const m = botMove(cur);
        return applyUnoAction(cur, p.id, m.type === 'play' ? { k: 'play', cardId: m.cardId, color: m.color } : { k: m.type })
          ?? applyUnoAction(cur, p.id, { k: 'draw' }) ?? applyUnoAction(cur, p.id, { k: 'pass' }) ?? forceAdvance(cur);
      });
    }, botDelay() + (s.discard[s.discard.length - 1]!.kind !== 'num' && s.discard.length > 1 ? 750 : 0));
    return () => window.clearTimeout(id);
  }, [s, hostLike]);

  // Regla de los 5 s: al cerrarse la ventana, el humano que no cantó roba 2; si un bot se despista, queda libre para que lo pilles.
  const unoPid = s?.uno?.pid;
  const unoAt = s?.uno?.at;
  useEffect(() => {
    if (!unoPid || !unoAt || !hostLike) return;
    const timers: number[] = [];
    const left = Math.max(0, UNO_WINDOW - (Date.now() - unoAt));
    timers.push(gameTimeout(() => setS((cur) => (cur?.uno?.at === unoAt ? expireUno(cur) ?? cur : cur)), left + 30));
    // Un bot con 1 carta lo canta el 60 % de las veces (el 40 % se despista y puedes pillarlo)
    if (!s!.players.find((p) => p.id === unoPid)!.human && Math.random() < 0.6) {
      timers.push(gameTimeout(() => setS((cur) => (cur?.uno?.at === unoAt ? callUno(cur, unoPid) ?? cur : cur)), 900 + Math.random() * 1800));
    }
    return () => timers.forEach((x) => window.clearTimeout(x));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unoPid, unoAt, hostLike]);

  // Cuenta atrás visible (décimas de segundo)
  useEffect(() => {
    if (!unoAt) return;
    setNow(Date.now());
    const id = gameInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [unoAt]);

  // Capa de efectos cinéticos: cada uno se retira solo al acabar su animación.
  const addFx = useCallback((f: FxInput) => {
    const id = ++flightId.current;
    const item = { ...f, id } as FxItem;
    setFx((l) => [...l.slice(-7), item]);
    gameTimeout(() => setFx((l) => l.filter((x) => x.id !== id)), fxLife(item));
  }, []);

  // Sucesos: sonidos, avisos y efectos.
  useEffect(() => {
    const e = s?.event;
    const key = `${e?.seq}:${e?.by}:${e?.text}`;
    if (!s || !e || key === lastSeq.current) return;
    lastSeq.current = key;
    if (e.kind === 'draw') feedback(e.text.includes('no cantó') ? 'defeat' : 'impact');
    else if (e.kind === 'uno') feedback('trick');
    else if (e.text !== 'Roba una carta') feedback('deal');
    if (e.text !== 'Roba una carta') show(e.text);
    // cartas que salen del mazo hacia el asiento que roba (una cada 90 ms)
    const fly = (id: string | undefined, count: number): void => {
      const p = s.players.find((q) => q.id === id);
      if (!p) return;
      const slot = slotOfPlayer(s, me, p.id);
      for (let i = 0; i < count; i++) {
        const fid = ++flightId.current;
        setFlights((f) => [...f, { id: fid, slot, delay: i * 0.09 }]);
        gameTimeout(() => setFlights((f) => f.filter((x) => x.id !== fid)), 900 + i * 90);
      }
    };
    if (e.text === 'Roba una carta') fly(e.by, 1);
    const top = s.discard[s.discard.length - 1]!;
    if (e.text === 'Salta turno') {
      // el saltado es el siguiente en el sentido que llevaba la partida (el sentido no cambia con un «Salta»)
      const i = s.players.findIndex((p) => p.id === e.by);
      const skipped = s.players[(i + s.dir + s.players.length) % s.players.length];
      if (skipped) addFx({ kind: 'skip', slot: slotOfPlayer(s, me, skipped.id) });
    } else if (e.text === 'Cambio de sentido') {
      addFx({ kind: 'reverse', color: s.color });
    } else if (e.kind === 'draw') {
      const v = s.players.find((p) => e.text.endsWith(p.name) || e.text.includes(`caza a ${p.name}`) || e.text.startsWith(p.name));
      const n4 = e.text.includes('+4');
      const byBot = e.by !== me;
      if (v) addFx({ kind: 'attack', n: n4 ? 4 : 2, slot: slotOfPlayer(s, me, v.id), color: s.color, delay: n4 && byBot ? 0.25 : 0 });
      if (n4 && byBot) addFx({ kind: 'prism' }); // el prisma de un +4 propio ya salió al abrir el selector de color
      if (!e.text.includes('no cantó') && !e.text.includes('caza')) setShake((k) => k + 1);
    }
    // comodín jugado (por ti o por un bot): onda del nuevo color desde el descarte
    if ((top.kind === 'wild' || top.kind === 'wild4') && /^(\+4 para|Color )/.test(e.text)) addFx({ kind: 'wave', color: s.color });
  }, [s, show, me, addFx]);

  // +4 propio: destello prismático de los 4 colores justo antes de elegir color
  useEffect(() => { if (pickFor?.kind === 'wild4') addFx({ kind: 'prism' }); }, [pickFor, addFx]);

  // Quién tiró la carta que acaba de caer (para que vuele desde su lado)
  useEffect(() => { prevS.current = s; });

  // Al mejor de 3 rondas: gana la ronda quien se queda sin cartas; la serie, quien llegue a 2 estrellas.
  const series = useSeries();
  const { record: recordRound, roundStarted } = series;
  useEffect(() => {
    if (s && !s.winner) { paid.current = false; roundStarted(); }
    if (!s?.winner || paid.current) return;
    paid.current = true;
    juice.chips(slotOfPlayer(s, me, s.winner) === 'bottom' ? 'me' : (slotOfPlayer(s, me, s.winner) as 'top' | 'left' | 'right'));
    recordRound(s.winner);
  }, [s, me, recordRound, roundStarted]);
  const champion = series.champion;
  useEffect(() => {
    if (champion === me) { wallet.add(WIN_BONUS); wallet.recordWin('uno'); showCine('¡VICTORIA!', `+${WIN_BONUS} fichas`); }
  }, [champion, me, showCine]);

  const myHand = s?.hands[me] ?? [];
  const sorted = useMemo(() => sortHand(myHand), [myHand]);
  const fresh = new Set(sorted.filter((c) => !seenHand.current.has(c.id)).map((c) => c.id));
  const dealing = seenHand.current.size === 0;
  useEffect(() => { seenHand.current = new Set(sorted.map((c) => c.id)); });

  // Abanico: un único manejador en el contenedor para levantar la carta señalada.
  const [hot, setHot] = useState(-1);
  const hotRef = useRef(-1);
  const handRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const handLen = myHand.length;
  useLayoutEffect(() => { const el = handRef.current; if (el) setScrollable(el.scrollWidth > el.clientWidth + 2); }, [handLen]);
  const scrub = (e: ReactPointerEvent<HTMLDivElement>) => {
    const tg = document.elementFromPoint(e.clientX, e.clientY);
    const el = tg instanceof Element ? tg.closest<HTMLElement>('[data-hi]') : null;
    const i = el ? Number(el.dataset.hi) : -1;
    if (i !== hotRef.current) { hotRef.current = i; setHot(i); if (i >= 0) feedback('tick'); }
  };
  const unscrub = () => { if (hotRef.current !== -1) { hotRef.current = -1; setHot(-1); } };

  // Jugadas propias: solo en tu turno; «¡UNO!» se puede pulsar siempre.
  const act = (a: UnoAction) => { if (s && !s.winner && s.players[s.turn]!.id === me) dispatch(me, a); };

  if (!s && online) {
    return (
      <GameFrame gameId="uno" onExit={() => { setActiveRoom(null); void exitMatch(nav); }}
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
              <p className="text-xs text-stone-400">Vacía tu mano primero. Juega por color o por número; el +4 solo si no tienes el color en juego. Si te quedas con 1 carta, canta ¡UNO! en 5 segundos.</p>
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
  const pv = prevS.current;
  const byPrev = pv && s.discard.length > pv.discard.length ? pv.players[pv.turn] : undefined;
  const from = byPrev ? seatOffset(slotOfPlayer(s, me, byPrev.id)) : { x: 0, y: -10 };
  const tilt = (Number(topCard.id.slice(1)) % 21) - 10;
  const seat = (slot: 'top' | 'left' | 'right') => {
    const k = slots.indexOf(slot);
    if (k === -1) return null;
    const i = (myIdx + k) % nPlayers;
    const p = s.players[i]!;
    const n = s.hands[p.id]!.length;
    if (slot === 'top') {
      // asiento superior compacto en horizontal (< 48 px de alto): avatar a la izquierda, nombre y mini-cartas a la derecha
      return (
        <div data-uno="seat-top" className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-black/35 py-1 pl-1 pr-3" style={{ opacity: s.turn === i && !s.winner ? 1 : 0.8 }}>
          <span className={`rounded-full ${s.turn === i && !s.winner ? 'ring-2 ring-amber-200/90 shadow-[0_0_10px_rgba(242,202,112,.6)]' : ''}`}><TableAvatar name={p.name} tone="them" className="size-8 text-[13px]" /></span>
          <span className="grid min-w-0 leading-tight"><b className="truncate text-[12px] text-stone-100">{p.name}</b><span className="flex items-center gap-1 text-[10px] tabular-nums text-amber-200/90"><span className="inline-block h-3 w-2 rounded-[2px] border border-white/70 bg-[#15151a]" />×{n}</span></span>
        </div>
      );
    }
    return <div data-uno={`seat-${slot}`}><SeatBadge info={info(i, `${p.name} · ${n}`)} tone="them" mano={false} turn={s.turn === i && !s.winner} deadline={null} cards={n} aura={n === 1} /></div>;
  };

  const choose = (color: Color) => {
    const card = pickFor;
    setPickFor(null);
    if (card) act({ k: 'play', cardId: card.id, color });
  };
  // Un toque lanza la carta (los comodines abren antes el selector de color).
  const onCard = (c: UnoCard) => {
    if (!myTurn || !isPlayable(s, c, myHand)) return;
    feedback('play');
    if (c.color === 'wild') { setPickFor(c); return; }
    act({ k: 'play', cardId: c.id });
  };
  const pressUno = () => { feedback('win'); if (!s.winner) dispatch(me, { k: 'uno' }); };

  const pills: PillSpec[] = pickFor ? [] : myTurn && s.drawn
    ? [{ id: 'pass', tone: 'soft', label: t('a.pass'), onPress: () => act({ k: 'pass' }) }]
    : [];
  const unoPending = !pickFor && !s.winner && s.uno ? s.uno : null;
  const remaining = unoPending ? Math.min(UNO_WINDOW, Math.max(0, UNO_WINDOW - (now - unoPending.at))) : 0;
  const status = s.winner ? '' : myTurn ? (s.drawn ? 'Puedes jugar la carta robada o pasar' : canDraw ? 'No tienes jugada: toca el mazo' : 'Te toca: elige una carta') : `Juega ${s.players[s.turn]!.name}…`;

  const felt = (
    <>
      <motion.div key={shake} animate={shake ? { y: [0, 5, -3, 0] } : undefined} transition={{ duration: 0.22 }} className="relative mx-auto flex h-full max-h-[320px] w-full flex-col justify-between p-2 sm:max-h-[370px] sm:p-4 lg:max-h-[420px] lg:p-6">
        <AmbientGlow color={s.color} />
        {/* 1 · franja superior: asiento compacto */}
        <div className="z-20 flex w-full shrink-0 items-center justify-center">{seat('top')}</div>
        {/* 2 · zona central: mazo, descarte y anillo centrados en el espacio libre; 3 · laterales centrados en vertical */}
        <div className="relative z-10 my-auto flex min-h-0 w-full flex-1 items-center justify-center py-2">
        <div className="absolute left-2 top-1/2 z-20 -translate-y-1/2 sm:left-6">{seat('left')}</div>
        <div className="relative z-10 flex items-center justify-center gap-5 sm:gap-8">
          <div className="grid justify-items-center gap-3">
            <div className="relative flex items-center gap-[min(4vw,18px)] px-3 py-2">
              {/* anillo orbital permanente: gira en el sentido del turno y cambia al color activo */}
              <OrbitRing dir={s.dir} color={s.color} />
              <div className="relative grid justify-items-center gap-1">
                <div data-uno="deck" role="button" tabIndex={canDraw ? 0 : -1} aria-label="Mazo: robar carta" aria-disabled={!canDraw}
                  onClick={canDraw ? () => { feedback('draw'); act({ k: 'draw' }); } : undefined}
                  onKeyDown={canDraw ? (e) => { if (e.key === 'Enter' || e.key === ' ') { feedback('draw'); act({ k: 'draw' }); } } : undefined}
                  className={`relative w-[clamp(46px,min(14vw,9dvh),74px)] [@media(max-height:500px)]:w-[40px]! touch-manipulation rounded-xl ${canDraw ? 'cursor-pointer active:scale-95' : ''}`}
                  style={{ aspectRatio: '2 / 3', marginRight: 8, marginTop: 8 }}>
                  {[4, 3, 2, 1, 0].map((k) => (
                    <span key={k} className="pointer-events-none absolute inset-0 block overflow-hidden rounded-xl border-[3px] border-white" style={{ transform: `translate(${k * 1.6}px, ${-k * 1.6}px)`, boxShadow: k === 0 ? '0 3px 8px rgba(0,0,0,.5)' : undefined }}>
                      <UnoBack />
                    </span>
                  ))}
                  {flights.map((f) => {
                    const d = reach(f.slot);
                    return (
                      <motion.div key={f.id} aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl border-2 border-white"
                        initial={{ x: 0, y: 0, opacity: 0, scale: 1, rotateY: 0 }} animate={{ x: d.x * 0.6, y: d.y * 0.6, opacity: [0, 1, 1, 0], scale: [1, 0.9, 0.7], rotateY: [0, 90, 180] }} transition={{ duration: 0.5, delay: f.delay, ease: EASE }}>
                        <UnoBack />
                      </motion.div>
                    );
                  })}
                  {canDraw && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-2xl" style={{ boxShadow: '0 0 0 2px #F5D061, 0 0 14px 2px rgba(245,208,97,.5)' }} />}
                </div>
                <span className="font-mono text-[10px] text-amber-200/80">{s.drawPile.length}</span>
              </div>
              <div data-uno="discard" className="relative aspect-[2/3] w-[clamp(46px,min(14vw,9dvh),74px)] [@media(max-height:500px)]:w-[40px]!">
                {s.discard.length > 2 && (
                  <div className="absolute inset-0" style={{ transform: 'rotate(15deg) translate(3px, 1px)' }}><UnoCardView card={s.discard[s.discard.length - 3]!} style={{ width: '100%' }} /></div>
                )}
                {s.discard.length > 1 && (
                  <div className="absolute inset-0" style={{ transform: 'rotate(-12deg) translate(-3px, 1px)' }}><UnoCardView card={s.discard[s.discard.length - 2]!} style={{ width: '100%' }} /></div>
                )}
                {/* entrada rápida y limpia de la carta jugada */}
                <motion.div key={topCard.id} className="absolute inset-0" initial={{ x: from.x, y: from.y, opacity: 0.7, scale: 1.15, rotate: tilt + (from.x >= 0 ? 70 : -70) }} animate={{ x: 0, y: 0, opacity: 1, scale: [1.15, 0.94, 1], rotate: tilt }} transition={{ duration: 0.3, ease: EASE, scale: { duration: 0.3, times: [0, 0.8, 1] } }}>
                  <UnoCardView card={topCard} style={{ width: '100%' }} glow />
                </motion.div>
              </div>
            </div>
            <div className="flex items-center gap-1.5" role="img" aria-label={`Color actual: ${COLOR_NAME[s.color]}. ${s.dir === 1 ? 'Sentido antihorario' : 'Sentido horario'}`}>
              <span className="size-3.5 rounded-full border border-white/60" style={{ background: UNO_HEX[s.color], boxShadow: `0 0 10px ${UNO_HEX[s.color]}` }} />
              {s.dir === 1 ? <RotateCcw size={14} strokeWidth={1.75} className="text-stone-300" /> : <RotateCw size={14} strokeWidth={1.75} className="text-stone-300" />}
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2 sm:right-6">{seat('right')}</div>
        </div>
      </motion.div>
      <Banner text={banner} />
    </>
  );

  const bottom = (
    <>
      <div className="relative flex w-full items-center justify-between gap-2 [@media(max-height:500px)]:pointer-events-none [@media(max-height:500px)]:absolute [@media(max-height:500px)]:left-1 [@media(max-height:500px)]:top-0 [@media(max-height:500px)]:z-10 [@media(max-height:500px)]:w-auto">
        <div className="flex min-w-0 items-center gap-2">
          <span data-uno="seat-bottom" className="inline-grid"><TableAvatar name="Tú" tone="me" active={myTurn} className="size-9 text-[15px]" /></span>
          <b className={`truncate text-[13px] ${myTurn ? 'text-amber-200' : 'text-stone-200'}`}>Tú</b>
          <span className="whitespace-nowrap rounded-full border border-white/10 bg-zinc-900/70 px-2 py-[2px] text-[10px] font-bold text-stone-300">{myHand.length} {myHand.length === 1 ? 'carta' : 'cartas'}</span>
        </div>
        <span className="sr-only" aria-live="polite">{status}</span>
      </div>
      <AnimatePresence>
        {pickFor && (
          <motion.div role="group" aria-label="Elige un color" className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-900/95 px-3 py-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={cap(COLOR_NAME[c])} onClick={() => choose(c)}
                className="size-12 touch-manipulation rounded-full border-2 border-white/80 transition active:scale-90"
                style={{ background: UNO_HEX[c] }} />
            ))}
            <button type="button" className="px-1 text-[12px] font-bold text-stone-400" onClick={() => setPickFor(null)}>Cancelar</button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Regla oficial de los 5 s: cantar el tuyo o pillar al rival que no lo ha cantado */}
      {unoPending && (
        <motion.button type="button" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 18 }} onClick={pressUno} aria-label={unoPending.pid === me ? 'Cantar UNO' : 'Pillar UNO'}
          className="relative flex min-h-12 w-full max-w-sm touch-manipulation items-center justify-center gap-3 overflow-hidden rounded-full border-2 border-amber-100/80 py-0.5 pl-6 pr-3 text-[17px] font-black tracking-wide text-white active:scale-95"
          style={{ background: 'linear-gradient(180deg,#F87171,#B91C1C)', boxShadow: '0 4px 14px rgba(0,0,0,.5)' }}>
          {remaining < 2000 && (
            <motion.span aria-hidden className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.38, 0] }} transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }} />
          )}
          <span className="relative">{unoPending.pid === me ? '¡CANTAR UNO!' : '¡PILLAR UNO! (+2)'}</span>
          <CountdownRing remaining={remaining} total={UNO_WINDOW} urgent={remaining < 2000} />
        </motion.button>
      )}
      <PillBar pills={pills} />
      <div ref={handRef} onPointerMove={scrub} onPointerDown={scrub} onPointerUp={unscrub} onPointerCancel={unscrub} onPointerLeave={unscrub}
        className="no-scrollbar w-full overflow-x-auto overflow-y-hidden pb-1 pt-[min(2.4dvh,18px)]" style={{ touchAction: scrollable ? 'pan-x' : 'none' }} role="group" aria-label="Tu mano">
        <div className="mx-auto flex w-max items-end px-2 [--uno-hand-w:46px] sm:[--uno-hand-w:64px] lg:[--uno-hand-w:78px] [@media(max-height:500px)]:[--uno-hand-w:44px]!">
          {sorted.map((c, i) => (
            <div key={c.id} data-hi={i} style={{ marginLeft: i === 0 ? 0 : sorted.length > 7 ? -20 : -12, zIndex: hot === i ? 60 : i }}>
              <motion.div initial={!dealing && fresh.has(c.id) ? { y: -90, opacity: 0 } : false} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2, ease: EASE }}>
              <UnoCardView card={c} scale={0.86} style={{ width: 'var(--uno-hand-w)' }} playable={playable.has(c.id)} lifted={hot === i} onClick={myTurn && playable.has(c.id) ? () => onCard(c) : undefined} />
              </motion.div>
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
      onExit={online ? () => { setActiveRoom(null); void exitMatch(nav); } : undefined}
      strip={<SeriesGems entries={s.players.map((p) => ({ key: p.id, label: p.id === me ? t('ser.you') : p.name, wins: series.wins[p.id] ?? 0 }))} />}
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
          <UnoFx items={fx} />
          <AnimatePresence>
            {winner && (
              <ResultOverlay
                outcome={champion === null ? undefined : champion === me ? 'win' : 'lose'}
                prize={champion === me ? WIN_BONUS : 0}
                taunt={myHand.length <= 2 ? 'Por los pelos' : 'Te comiste el +4'}
                title={champion !== null ? (champion === me ? t('ser.champion') : t('ser.lost')) : t('ser.roundWin', { w: winner.id === me ? t('ser.you') : winner.name })}
                actions={[
                  ...(online
                    ? seating.isHost ? [{ label: champion !== null ? t('ser.newSeries') : t('ser.next'), primary: true, onClick: hostStart }] : []
                    : [{ label: champion !== null ? t('ser.newSeries') : t('ser.next'), primary: true, onClick: () => start(count!) }, { label: 'Cambiar jugadores', onClick: () => { setCount(null); setS(null); } }]),
                  { label: t('a.lobby'), onClick: () => { if (online) setActiveRoom(null); void exitMatch(nav); } },
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
                {champion === me && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{WIN_BONUS} fichas de premio</p>}
                <p className="mt-2 text-center text-[11px] text-stone-400">{t('ser.round', { n: series.played })}</p>
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
}
