import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Chip, CHIP_VALUES, ChipStack } from '../../components/cards/Chip.tsx';
import { DealIn } from '../../components/cards/DealIn.tsx';
import { AnimatedNumber } from '../mus/app/components/AnimatedNumber.tsx';
import { CardBackArt } from '../../components/cards/FrenchFace.tsx';
import { TableAvatar } from '../mus/app/components/TableAvatar.tsx';
import { canClaimDaily, useWallet, wallet } from '../../store/wallet.ts';
import { aiDelay, feedback } from '../../store/settings.ts';
import { useT } from '../../i18n/index.ts';
import { GameFrame } from '../shared/GameFrame.tsx';
import { Banner, FaceCard, PhaseCinematic, PillBar, useBanner, useCine, type PillSpec } from '../shared/kit.tsx';
import {
  canDouble, canHit, canSplit, deal, dealerStep, double, handValue, hit, newShoe, split, stand,
  totalBet, totalPayout, type BJCard, type BJState, type Hand, type Outcome,
} from './engine.ts';

const MAX_BET = 5000;

const OUTCOME_TEXT: Record<Outcome, string> = { blackjack: 'Blackjack', win: 'Ganas', push: 'Empate', lose: 'Pierdes', bust: 'Te pasas' };
const OUTCOME_TONE: Record<Outcome, string> = {
  blackjack: 'bg-amber-300 text-amber-950', win: 'bg-emerald-800 text-emerald-50', push: 'bg-white/15 text-stone-100',
  lose: 'bg-red-950 text-red-50', bust: 'bg-red-950 text-red-50',
};

function Pill({ children, tone = 'dark' }: { children: ReactNode; tone?: 'dark' | 'gold' | string }) {
  const cls = tone === 'dark' ? 'bg-black/55 text-stone-100' : tone === 'gold' ? 'bg-amber-300 text-amber-950' : tone;
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${cls}`}>{children}</span>;
}

function Cards({ cards, scale, hideSecond }: { cards: BJCard[]; scale: number; hideSecond?: boolean }) {
  return (
    <div className="flex items-center">
      {cards.map((c, i) => (
        <div key={c.id} style={{ marginLeft: i === 0 ? 0 : `calc(var(--card-w) * ${-scale * 0.28})`, zIndex: i }}>
          <DealIn index={0}><FaceCard card={c} scale={scale} faceDown={!!hideSecond && i === 1} /></DealIn>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'us' | 'them' }) {
  const us = tone === 'us';
  return (
    <div className={`min-w-0 rounded-[13px] border border-white/10 px-[min(2.4vw,10px)] py-[min(1.1dvh,6px)] ${us ? 'bg-gradient-to-br from-amber-300/10 to-black/30' : 'bg-gradient-to-br from-teal-400/10 to-black/30'}`}>
      <div className="flex items-baseline justify-between gap-1">
        <span className={`truncate text-[9px] font-extrabold uppercase tracking-[.14em] ${us ? 'text-amber-300' : 'text-teal-300'}`}>{label}</span>
        <b className="font-[var(--font-display)] text-[clamp(17px,5.4vw,22px)] leading-none tabular-nums"><AnimatedNumber value={value} duration={0.7} /></b>
      </div>
    </div>
  );
}

export default function Blackjack() {
  const t = useT();
  const { chips } = useWallet();
  const [shoe, setShoe] = useState<BJCard[]>(() => newShoe());
  const [game, setGame] = useState<BJState | null>(null);
  const [bet, setBet] = useState(0);
  const [lastBet, setLastBet] = useState(0);
  const { banner, show } = useBanner(2200);
  const { cine, show: showCine } = useCine();
  const gameRef = useRef<BJState | null>(null);

  const apply = useCallback((next: BJState) => {
    const prev = gameRef.current;
    gameRef.current = next;
    setGame(next);
    setShoe(next.shoe);
    if (next.phase === 'settled' && prev?.phase !== 'settled') {
      const pay = totalPayout(next);
      const net = pay - totalBet(next);
      if (pay > 0) wallet.add(pay);
      if (next.hands.some((h) => h.outcome === 'blackjack')) { feedback('win'); showCine('BLACKJACK 21', 'Pago 3 a 2'); }
      else if (net > 0) { feedback('trick'); show(`+${net} fichas`); }
      else if (net < 0) show(`${net} fichas`);
      else show('Empate');
    }
  }, [show, showCine]);

  // El crupier juega solo, carta a carta.
  useEffect(() => {
    if (!game || game.phase !== 'dealer') return;
    const t = window.setTimeout(() => apply(dealerStep(game)), aiDelay(800));
    return () => window.clearTimeout(t);
  }, [game, apply]);

  const addBet = (v: number) => setBet((b) => Math.min(b + v, chips, MAX_BET));

  const startRound = (amount: number) => {
    if (amount <= 0 || !wallet.spend(amount)) return;
    setLastBet(amount);
    if (amount === chips && amount >= 100) showCine('¡ALL-IN!', 'Todas las fichas al centro');
    apply(deal(shoe, amount));
  };

  const newRound = () => {
    gameRef.current = null;
    setGame(null);
    setBet(Math.min(lastBet, chips));
  };

  const act = {
    hit: () => game && canHit(game) && apply(hit(game)),
    stand: () => game && canHit(game) && apply(stand(game)),
    double: () => {
      if (!game || !canDouble(game, chips)) return;
      if (wallet.spend(game.hands[game.active]!.bet)) apply(double(game));
    },
    split: () => {
      if (!game || !canSplit(game, chips)) return;
      if (wallet.spend(game.hands[game.active]!.bet)) apply(split(game));
    },
  };

  const inBetting = game === null;
  const settled = game?.phase === 'settled';
  const scale = !game || game.hands.length === 1 ? 0.78 : game.hands.length === 2 ? 0.62 : 0.5;
  const dealerTotal = game ? handValue(game.dealer.slice(0, game.holeHidden ? 1 : undefined)).total : 0;
  const myTurn = !!game && game.phase === 'player';

  let pills: PillSpec[] = [];
  if (inBetting) {
    pills = chips === 0 && bet === 0
      ? [{ id: 'refill', tone: 'gold', label: canClaimDaily() ? 'Bono diario +500' : 'Ver anuncio +250', onPress: () => (canClaimDaily() ? wallet.claimDaily() : wallet.claimAd()) }]
      : [
          { id: 'clear', tone: 'soft', disabled: bet === 0, label: t('a.clear'), onPress: () => setBet(0) },
          { id: 'again', tone: 'soft', disabled: lastBet === 0 || chips === 0, label: t('a.again'), onPress: () => setBet(Math.min(chips, lastBet)) },
          { id: 'deal', tone: 'gold', disabled: bet <= 0, label: t('a.deal'), onPress: () => startRound(bet) },
        ];
  } else if (settled) {
    pills = [{ id: 'next', tone: 'gold', label: t('a.newHand'), onPress: newRound }];
  } else if (myTurn) {
    pills = [
      { id: 'hit', tone: 'ok', label: t('a.hit'), onPress: act.hit, disabled: !canHit(game!) },
      { id: 'stand', tone: 'gold', label: t('a.stand'), onPress: act.stand },
      { id: 'double', tone: 'soft', label: t('a.double'), onPress: act.double, disabled: !canDouble(game!, chips) },
      { id: 'split', tone: 'soft', label: t('a.split'), onPress: act.split, disabled: !canSplit(game!, chips) },
    ];
  }

  const felt = (
    <>
      <div className="flex h-full flex-col items-center justify-between p-[clamp(6px,2vw,16px)]">
        {/* Crupier */}
        <section className="grid justify-items-center gap-1" aria-label="Crupier">
          <div className="flex items-center gap-2">
            <TableAvatar name="Crupier" tone="them" className="size-[min(10vw,5.6dvh,46px)] text-[min(4vw,2.4dvh)]" />
            <span className="text-[13px] font-bold text-stone-200">Crupier</span>
            {game && <Pill>{game.holeHidden ? `${dealerTotal}+?` : dealerTotal}</Pill>}
          </div>
          <div className="flex min-h-[calc(var(--card-w)*1.2)] items-center">
            {game ? <Cards cards={game.dealer} scale={0.74} hideSecond={game.holeHidden} /> : <span className="text-xs text-white/30">Hagan juego</span>}
          </div>
        </section>

        {/* Apuesta (antes de repartir) */}
        <div className="grid place-items-center">
          {inBetting && (
            <div className="grid justify-items-center gap-1">
              <div className="grid size-[min(24vw,12dvh)] place-items-center rounded-full border-2 border-dashed border-amber-300/50 bg-black/25">
                {bet > 0 ? <ChipStack amount={bet} size={44} /> : <span className="text-[11px] font-bold text-white/40">Tu apuesta</span>}
              </div>
              <b className="font-[var(--font-display)] text-2xl text-amber-300 tabular-nums">{bet}</b>
            </div>
          )}
        </div>

        {/* Tus manos */}
        <section className="flex w-full flex-wrap items-end justify-center gap-x-4 gap-y-2" aria-label="Tus manos">
          {game?.hands.map((h: Hand, i) => {
            const v = handValue(h.cards);
            const active = !settled && game.phase === 'player' && i === game.active;
            return (
              <div key={i} className={`grid justify-items-center gap-1 rounded-2xl p-1.5 ${active ? 'bg-amber-300/10 outline outline-2 outline-amber-300' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <Pill tone={v.total > 21 ? 'bg-red-950 text-red-50' : 'dark'}>{v.soft && v.total < 21 ? 'blando ' : ''}{v.total}</Pill>
                  <Pill tone="gold">{h.bet}</Pill>
                  {h.outcome && <Pill tone={OUTCOME_TONE[h.outcome]}>{OUTCOME_TEXT[h.outcome]}</Pill>}
                </div>
                <Cards cards={h.cards} scale={scale} />
              </div>
            );
          })}
        </section>
      </div>
      <div className="absolute left-[clamp(6px,2vw,14px)] top-[clamp(6px,2vw,14px)] z-10 flex items-center gap-1.5" aria-label={`${shoe.length} cartas en el zapato`}>
        <div className="relative aspect-[12/19] w-[calc(var(--card-w)*.4)]">
          {[2, 1, 0].map((k) => (
            <span key={k} className="absolute inset-0 overflow-hidden rounded-[6px] shadow-[0_4px_8px_rgba(0,0,0,.4)]" style={{ transform: `translate(${k * 2}px, ${-k * 2}px)` }}><CardBackArt variant="midnight" seal="STACKS" /></span>
          ))}
        </div>
        <span className="font-mono text-[10px] text-amber-200/80">{shoe.length}</span>
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
        </div>
        <span className="text-[11px] text-stone-400">{inBetting ? 'Baraja inglesa · 52 cartas' : 'El crupier se planta en todos los 17'}</span>
      </div>
      <PillBar pills={pills} idle={game && !settled ? (game.phase === 'dealer' ? 'Juega el crupier…' : '') : ''} />
      {inBetting && !(chips === 0 && bet === 0) && (
        <motion.div className="flex w-full items-center justify-between px-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {CHIP_VALUES.map((v) => (
            <Chip key={v} value={v} size={46} onClick={() => addBet(v)} disabled={bet + v > chips} />
          ))}
        </motion.div>
      )}
    </>
  );

  return (
    <GameFrame
      gameId="blackjack"
      header={
        <div className="grid w-full grid-cols-2 gap-[min(1.8vw,8px)]" role="group" aria-label="Saldo">
          <Stat label="Fichas" value={chips} tone="us" />
          <Stat label="Apuesta" value={game ? totalBet(game) : bet} tone="them" />
        </div>
      }
      felt={felt}
      bottom={bottom}
      overlays={<PhaseCinematic cine={cine} />}
    />
  );
}
