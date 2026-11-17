import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setActiveRoom } from '../../services/multiplayer.ts';
import { useReplica, useSeating } from '../../services/onlineGame.ts';
import { juice } from '../../services/juice.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { SeatBadge } from '../mus/app/components/SeatBadge.tsx';
import { TableAvatar } from '../mus/app/components/TableAvatar.tsx';
import { Button } from '../mus/app/components/ui.tsx';
import type { Bubble } from '../mus/app/game/describe.ts';
import type { SeatInfo } from '../mus/app/game/types.ts';
import { useT } from '../../i18n/index.ts';
import { botDelay, feedback } from '../../store/settings.ts';
import { wallet } from '../../store/wallet.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, FaceCard, PhaseCinematic, PillBar, ResultOverlay, tilt, useBanner, useCine, type PillSpec } from '../shared/kit.tsx';
import {
  ROLE_NAME, ROLE_PRIZE, applyPresAction, botMove, canPlay, newRound, power, roleOf,
  type DeckKind, type PresAction, type PresPlayer, type PresState, type Role,
} from './engine.ts';

const BOT_NAMES = ['Jon', 'Nerea', 'Aitor', 'Maite', 'Unai'];
const makePlayers = (n: number): PresPlayer[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: i === 0 ? 'Tú' : BOT_NAMES[i - 1]!, human: i === 0 }));
const info = (i: number, name: string): SeatInfo => ({ seat: (i % 4) as SeatInfo['seat'], userId: null, name, isBot: true, online: true });
const MARK: Record<Role, string> = { presidente: '👑', vicepresidente: '🎩', pueblo: '', subalterno: '🥔', mendigo: '🪙' };

export default function Presidente() {
  const nav = useNavigate();
  const t = useT();
  const seating = useSeating('presidente');
  const online = seating.online;
  const [setup, setSetup] = useState<{ n: number; deck: DeckKind }>({ n: 4, deck: 'es' });
  const [started, setStarted] = useState(false);
  const [s, setS] = useState<PresState | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [bubbles, setBubbles] = useState<Record<string, Bubble | undefined>>({});
  const { banner, show } = useBanner(1300);
  const { cine, show: showCine } = useCine();
  const lastSeq = useRef('');
  const paidRound = useRef(0);
  const me = online ? s?.players.find((p) => p.peerId === seating.myPeerId)?.id ?? 'p0' : 'p0';
  const hostLike = !online || seating.isHost;

  const start = () => { setStarted(true); setS(newRound(makePlayers(setup.n), setup.deck)); setSel([]); setBubbles({}); lastSeq.current = ''; paidRound.current = 0; };

  // Online: el anfitrión reparte con los humanos de la sala (3–6 jugadores) y rellena con bots si está activado.
  const hostStart = () => {
    const humans = seating.humans;
    const n = Math.min(6, Math.max(3, seating.fillBots ? Math.max(4, humans.length) : humans.length));
    const players: PresPlayer[] = Array.from({ length: n }, (_, i) => i < humans.length
      ? { id: `p${i}`, name: humans[i]!.name, human: true, peerId: humans[i]!.peerId }
      : { id: `p${i}`, name: BOT_NAMES[i - humans.length] ?? `Bot ${i}`, human: false });
    setStarted(true); setS(newRound(players, 'es')); setSel([]); setBubbles({}); lastSeq.current = ''; paidRound.current = 0;
  };
  const noS = s === null;
  useEffect(() => { if (online && seating.isHost && noS) hostStart(); }, [online, seating.isHost, noS]); // eslint-disable-line
  const { dispatch } = useReplica<PresState, PresAction>(seating, s, setS, applyPresAction, (st, peer) => st.players.find((q) => q.peerId === peer)?.id ?? null);
  const nextRound = () => { if (!s || !hostLike) return; setS(newRound(s.players, s.deck, s)); setSel([]); setBubbles({}); };

  // IA: juega con una pausa natural.
  useEffect(() => {
    if (!s || s.phase !== 'play' || !hostLike) return;
    const p = s.players[s.turn]!;
    if (p.human) return;
    const timer = window.setTimeout(() => {
      setS((cur) => {
        if (!cur || cur.phase !== 'play' || cur.players[cur.turn]!.id !== p.id) return cur;
        const m = botMove(cur);
        return applyPresAction(cur, p.id, m.type === 'play' ? { k: 'play', ids: m.ids } : { k: 'pass' }) ?? applyPresAction(cur, p.id, { k: 'pass' }) ?? cur;
      });
    }, botDelay());
    return () => window.clearTimeout(timer);
  }, [s, hostLike]);

  // Sucesos: globos de bots, aviso propio y sonidos.
  useEffect(() => {
    const e = s?.event;
    const key = `${e?.seq}:${e?.by}:${e?.text}`;
    if (!s || !e || key === lastSeq.current) return;
    lastSeq.current = key;
    const who = s.players.find((p) => p.id === e.by);
    if (e.text === '¡Corta con un 2!') juice.impact('¡LIMPIA MESA!', 'gold');
    else feedback(e.kind === 'clear' ? 'trick' : e.kind === 'out' ? 'chip' : 'deal');
    if (!who) return;
    if (who.id === me) { if (e.kind !== 'info' || e.text !== 'Pasa') show(e.text); return; }
    const at = Date.now();
    const tone: Bubble['tone'] = e.kind === 'clear' ? 'ordago' : e.kind === 'out' ? 'good' : 'neutral';
    setBubbles((b) => ({ ...b, [who.id]: { text: e.kind === 'out' ? '¡Sale!' : e.text, tone, at } }));
    window.setTimeout(() => setBubbles((b) => (b[who.id]?.at === at ? { ...b, [who.id]: undefined } : b)), 1500);
  }, [s, show, me]);

  // Fin de ronda: premio según el rol.
  useEffect(() => {
    if (!s || s.phase !== 'done' || paidRound.current === s.round) return;
    paidRound.current = s.round;
    const r = roleOf(s, me);
    if (!r) return;
    if (ROLE_PRIZE[r] > 0) wallet.add(ROLE_PRIZE[r]);
    if (r === 'presidente') { wallet.recordWin('presidente'); showCine('¡PRESIDENTE!', `+${ROLE_PRIZE[r]} fichas`); }
  }, [s, showCine, me]);

  if (!s && online) {
    return (
      <GameFrame gameId="presidente" onExit={() => { setActiveRoom(null); nav('/'); }}
        header={<p className="truncate text-center font-[var(--font-display)] text-lg font-bold text-amber-300">El Presidente</p>}
        felt={<div className="grid h-full place-items-center p-6 text-center"><p className="text-sm font-bold text-stone-300">Conectando con la mesa…</p></div>}
        bottom={null} />
    );
  }
  if (!s || (!online && !started)) {
    return (
      <GameFrame
        gameId="presidente"
        header={<p className="truncate text-center font-[var(--font-display)] text-lg font-bold text-amber-300">El Presidente</p>}
        felt={
          <div className="grid h-full place-items-center p-5">
            <div className="grid w-full max-w-xs gap-3 text-center">
              <h2 className="font-[var(--font-display)] text-2xl font-bold text-amber-300">De mendigo a rey de la mesa</h2>
              <p className="text-[12px] font-bold uppercase tracking-widest text-stone-400">Jugadores</p>
              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 5, 6].map((n) => (
                  <Button key={n} variant={setup.n === n ? 'primary' : 'secondary'} onClick={() => setSetup({ ...setup, n })}>{n}</Button>
                ))}
              </div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-stone-400">Baraja</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={setup.deck === 'es' ? 'primary' : 'secondary'} onClick={() => setSetup({ ...setup, deck: 'es' })}>Española</Button>
                <Button variant={setup.deck === 'fr' ? 'primary' : 'secondary'} onClick={() => setSetup({ ...setup, deck: 'fr' })}>Inglesa</Button>
              </div>
              <Button variant="primary" block onClick={start}>Repartir</Button>
              <p className="text-xs text-stone-400">Española: 40 cartas · Inglesa: 52. Quedarte sin cartas el primero te hace Presidente. El 2 es la carta más alta y limpia la mesa.</p>
            </div>
          </div>
        }
        bottom={null}
      />
    );
  }

  const myIdx = Math.max(0, s.players.findIndex((p) => p.id === me));
  const hand = s.hands[me]!;
  const exchange = s.phase === 'exchange' && s.exchange?.president === me;
  const waitingExchange = s.phase === 'exchange' && !exchange;
  const myTurn = s.phase === 'play' && s.players[s.turn]!.id === me;
  const opponents = s.players.map((_, k) => (myIdx + 1 + k) % s.players.length).filter((i) => i !== myIdx);
  const playOk = myTurn && canPlay(s, me, sel);

  const toggle = (id: string) => {
    if (!myTurn && !exchange) return;
    feedback('tap');
    const c = hand.find((x) => x.id === id)!;
    setSel((cur) => {
      if (exchange) return cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 2 ? [...cur, id] : [cur[1]!, id];
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      const same = cur.length > 0 && hand.filter((x) => cur.includes(x.id)).every((x) => power(x) === power(c));
      return same && cur.length < 4 ? [...cur, id] : [id];
    });
  };
  const doPlay = () => { if (!playOk) return; feedback('play'); const ids = sel; setSel([]); dispatch(me, { k: 'play', ids }); };
  const doPass = () => { setSel([]); if (myTurn) dispatch(me, { k: 'pass' }); };
  const doGive = () => { if (sel.length !== 2) return; const ids = sel; setSel([]); dispatch(me, { k: 'give', ids }); };

  const pills: PillSpec[] = exchange
    ? [{ id: 'give', tone: 'gold', label: `Devolver ${sel.length}/2 cartas`, disabled: sel.length !== 2, onPress: doGive }]
    : myTurn
      ? [
          ...(s.table ? [{ id: 'pass', tone: 'soft' as const, label: t('a.pass'), onPress: doPass }] : []),
          { id: 'play', tone: 'gold' as const, label: sel.length ? `Tirar selección (${sel.length})` : 'Toca tus cartas', disabled: !playOk, onPress: doPlay },
        ]
      : [];
  const status = s.phase === 'done' ? '' : waitingExchange ? 'El Presidente elige 2 cartas para devolver…' : exchange ? 'Elige 2 cartas para devolver al Mendigo'
    : myTurn ? (s.table ? `Te toca: ${s.table.cards.length === 1 ? 'una carta' : `${s.table.cards.length} cartas`} más altas, o pasa` : 'Te toca: abres la mesa') : `Juega ${s.players[s.turn]!.name}…`;

  const seatOf = (i: number) => {
    const p = s.players[i]!;
    const n = s.hands[p.id]!.length;
    const place = s.finished.indexOf(p.id);
    const role = roleOf(s, p.id);
    const tag = place >= 0 ? ` · ${place + 1}º` : ` · ${n}`;
    return (
      <SeatBadge key={p.id} info={info(i, `${role && s.phase !== 'done' ? MARK[role] : ''}${p.name}${tag}`)} tone="them" mano={false} turn={s.turn === i && s.phase === 'play'} deadline={null}
        cards={Math.min(n, 5)} bubble={bubbles[p.id]} bubbleSide="below" />
    );
  };

  const felt = (
    <>
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-1 p-[clamp(6px,2vw,16px)]">
        <div className="flex flex-wrap items-start justify-center gap-x-[min(3vw,14px)] gap-y-1">{opponents.map((i) => seatOf(i))}</div>
        <div className="grid min-h-0 place-items-center">
          <AnimatePresence mode="wait">
            {s.table ? (
              <motion.div key={s.table.by + s.table.cards.map((c) => c.id).join()} className="grid justify-items-center gap-2"
                initial={{ scale: 1.25, opacity: 0, y: -10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
                <div className="flex items-end">
                  {s.table.cards.map((c, i) => (
                    <div key={c.id} style={{ marginLeft: i === 0 ? 0 : 'calc(var(--card-w) * -0.3)', zIndex: i }}><FaceCard card={c} scale={0.8} rotate={tilt(c.id) / 2} /></div>
                  ))}
                </div>
                <span className="rounded-full bg-black/35 px-3 py-0.5 text-[11px] font-bold text-amber-200/90">{s.players.find((p) => p.id === s.table!.by)!.name}</span>
              </motion.div>
            ) : (
              <motion.p key="free" className="text-center font-[var(--font-display)] text-lg font-bold text-amber-200/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {s.phase === 'play' ? 'Mesa libre' : ''}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Banner text={banner} />
    </>
  );

  const myRole = roleOf(s, me);
  const gap = hand.length > 12 ? -0.62 : me.length > 9 ? -0.5 : me.length > 6 ? -0.34 : -0.12;
  const bottom = (
    <>
      <div className="relative flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TableAvatar name="Tú" tone="me" active={myTurn || exchange} className="size-9 text-[15px]" />
          <b className={`truncate text-[13px] ${myTurn ? 'text-amber-200' : 'text-stone-200'}`}>{myRole ? `${MARK[myRole]} ${ROLE_NAME[myRole]}` : 'Tú'}</b>
          <span className="whitespace-nowrap rounded-full border border-white/10 bg-zinc-900/70 px-2 py-[2px] text-[10px] font-bold text-stone-300">{hand.length} {hand.length === 1 ? 'carta' : 'cartas'}</span>
        </div>
        <span className="min-w-0 truncate text-right text-[11px] text-stone-400">{status}</span>
      </div>
      <PillBar pills={pills} />
      <div className="no-scrollbar w-full overflow-x-auto overflow-y-hidden pb-1 pt-[min(2.4dvh,18px)]" role="group" aria-label="Tu mano">
        <div className="mx-auto flex w-max items-end px-2">
          {hand.map((c, i) => (
            <div key={c.id} style={{ marginLeft: i === 0 ? 0 : `calc(var(--card-w) * ${gap})`, zIndex: i }}>
              <FaceCard card={c} scale={0.8} selected={sel.includes(c.id)}
                onClick={myTurn || exchange ? () => toggle(c.id) : undefined} />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <GameFrame
      gameId="presidente"
      onExit={online ? () => { setActiveRoom(null); nav('/'); } : undefined}
      timer={{
        active: myTurn, id: `${s.turn}:${hand.length}:${s.table?.by ?? ''}:${s.table?.cards.length ?? 0}`,
        onTimeout: () => { setSel([]); if (s.phase !== 'play' || s.players[s.turn]!.id !== me) return; const m = botMove(s); dispatch(me, m.type === 'play' ? { k: 'play', ids: m.ids } : { k: 'pass' }); },
      }}
      header={
        <div className="grid grid-cols-2 gap-[min(1.8vw,8px)]" role="group" aria-label="Estado">
          <div className="min-w-0 rounded-[13px] border border-white/10 bg-gradient-to-br from-teal-400/10 to-black/30 px-3 py-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.08em] text-teal-300">Turno</p>
            <b className="block truncate text-[13px]">{s.phase === 'done' ? '—' : s.players[s.turn]!.name}</b>
          </div>
          <div className="min-w-0 rounded-[13px] border border-white/10 bg-gradient-to-br from-orange-400/10 to-black/30 px-3 py-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-[.08em] text-orange-300">Ronda</p>
            <b className="block text-[13px] tabular-nums">{s.round}</b>
          </div>
        </div>
      }
      felt={felt}
      bottom={bottom}
      overlays={
        <>
          <PhaseCinematic cine={cine} />
          <AnimatePresence>
            {s.phase === 'done' && (
              <ResultOverlay
                outcome={myRole === 'presidente' ? 'win' : myRole === 'mendigo' ? 'lose' : undefined}
                prize={myRole ? ROLE_PRIZE[myRole] : 0}
                taunt="Te han dejado de Mendigo"
                title={myRole === 'presidente' ? '¡Eres el Presidente!' : myRole === 'mendigo' ? 'Te toca ser el Mendigo' : `Has quedado ${ROLE_NAME[myRole ?? 'pueblo']}`}
                actions={[
                  ...(hostLike ? [{ label: 'Siguiente ronda', primary: true, onClick: nextRound }] : []),
                  ...(online ? [] : [{ label: 'Cambiar mesa', onClick: () => { setStarted(false); setS(null); } }]),
                  { label: t('a.lobby'), onClick: () => { if (online) setActiveRoom(null); nav('/'); } },
                ]}
              >
                <ul className="grid gap-1 text-sm">
                  {s.finished.map((id, i) => {
                    const p = s.players.find((x) => x.id === id)!;
                    const r = s.roles![id]!;
                    return (
                      <li key={id} className="flex justify-between border-b border-white/10 py-1">
                        <span className={i === 0 ? 'font-bold text-amber-300' : ''}>{i + 1}º · {MARK[r]} {p.name}</span>
                        <span className="text-stone-300">{ROLE_NAME[r]}</span>
                      </li>
                    );
                  })}
                </ul>
                {myRole && ROLE_PRIZE[myRole] > 0 && <p className="mt-2 text-center text-sm font-bold text-amber-300">+{ROLE_PRIZE[myRole]} fichas</p>}
                <p className="mt-2 text-center text-[11px] text-stone-400">En la siguiente ronda el Mendigo entrega sus 2 mejores cartas al Presidente.</p>
              </ResultOverlay>
            )}
          </AnimatePresence>
        </>
      }
    />
  );
}
