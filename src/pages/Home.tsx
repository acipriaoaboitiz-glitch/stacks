import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Globe, Play, Users, X } from 'lucide-react';
import { GameArt } from '../components/cards/GameArt.tsx';
import { OnlineLobbyModal } from '../components/online/OnlineLobbyModal.tsx';
import { QuickButtons } from '../components/ui/QuickButtons.tsx';
import { ChipBalance } from '../components/ui/Hud.tsx';
import { Wordmark } from '../components/ui/Logo.tsx';
import { EconomyModal } from '../components/ui/EconomyModal.tsx';
import { RulesModal } from '../components/ui/RulesModal.tsx';
import { ProfileCard } from '../components/ui/ProfileModal.tsx';
import { SettingsModal } from '../components/ui/SettingsModal.tsx';
import { GAMES, findGame, type GameInfo } from '../games/registry.ts';
import { useT } from '../i18n/index.ts';
import type { Room } from '../services/multiplayer.ts';
import { feedback } from '../store/settings.ts';

/** Tarjeta del carrusel: foco de luz, medallón dorado y emblema. Estática (sin animaciones infinitas) para mantener 60 FPS en móvil. */
const Slide = memo(function Slide({ game, active }: { game: GameInfo; active: boolean }) {
  const t = useT();
  const [c1, c2] = game.tint;
  return (
    <div className="relative grid h-full w-full content-between overflow-hidden rounded-[28px] p-4"
      style={{ background: `radial-gradient(ellipse at 50% 36%, ${game.accent}33, transparent 60%), linear-gradient(160deg, ${c1}, ${c2} 85%)`, border: `1.5px solid ${game.accent}${active ? 'cc' : '66'}` }}>
      <span className="font-mono relative z-10 flex w-fit items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px]" style={{ background: '#000a', color: game.accent, border: `1px solid ${game.accent}55` }}>
        <Users size={11} aria-hidden /> {t(`g.${game.id}.pl`)}
      </span>
      <div className="relative z-10 grid place-items-center">
        <svg aria-hidden viewBox="0 0 200 200" className="absolute size-[200px]" style={{ opacity: 0.9 }}>
          <defs><linearGradient id={`mg-${game.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3b0" /><stop offset=".5" stopColor={game.accent} /><stop offset="1" stopColor="#7a4a06" /></linearGradient></defs>
          <circle cx="100" cy="100" r="92" fill="rgba(0,0,0,.28)" stroke={`url(#mg-${game.id})`} strokeWidth="3" />
          <circle cx="100" cy="100" r="82" fill="none" stroke={`url(#mg-${game.id})`} strokeWidth="1.5" strokeDasharray="2 7" />
          <circle cx="100" cy="100" r="72" fill="none" stroke={game.accent} strokeWidth=".8" opacity=".5" />
        </svg>
        <GameArt id={game.id} size={138} />
      </div>
      <div className="relative z-10">
        <h3 className="gold-text font-[var(--font-display)] text-[28px] font-bold leading-none">{t(`g.${game.id}.name`)}</h3>
        <p className="mt-1 text-[12px] text-stone-300/80">{t(`g.${game.id}.tag`)}</p>
      </div>
    </div>
  );
});

function RulesPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (g: GameInfo) => void }) {
  const t = useT();
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={t('lobby.rulesPick')} className="glass-panel w-full max-w-md rounded-t-3xl p-5"
            style={{ paddingBottom: 'calc(20px + var(--safe-b))' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center">
              <h2 className="flex-1 font-[var(--font-display)] text-xl font-bold text-amber-300">{t('lobby.rulesPick')}</h2>
              <button type="button" onClick={onClose} aria-label="×" className="grid size-9 place-items-center rounded-full bg-white/10"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GAMES.map((g) => (
                <motion.button key={g.id} type="button" whileTap={{ scale: 0.95 }} onClick={() => onPick(g)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left text-[13px] font-bold">
                  <g.icon size={18} style={{ color: g.accent }} /> {t(`g.${g.id}.name`)}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Home() {
  const nav = useNavigate();
  const t = useT();
  const [params, setParams] = useSearchParams();
  const linkCode = params.get('sala') ?? params.get('room');
  const [online, setOnline] = useState<GameInfo | null>(() => (linkCode ? findGame(params.get('game') ?? 'mus') ?? null : null));
  const [inviteCode, setInviteCode] = useState<string | undefined>(() => linkCode ?? undefined);
  const [settings, setSettings] = useState(false);
  const [showRefill, setShowRefill] = useState(false);
  const [picker, setPicker] = useState(false);
  const [rules, setRules] = useState<GameInfo | null>(null);

  const startOnline = (room: Room) => {
    const g = findGame(room.gameId)!;
    setOnline(null);
    nav(`${g.route}?room=${room.code}`);
  };
  const closeOnline = () => {
    setOnline(null);
    setInviteCode(undefined);
    if (params.has('room') || params.has('sala')) { params.delete('room'); params.delete('sala'); params.delete('game'); setParams(params, { replace: true }); }
  };

  const N = GAMES.length;
  const [cur, setCur] = useState(0);
  const curRef = useRef(0);
  curRef.current = cur;
  const game = GAMES[cur]!;
  const scroller = useRef<HTMLDivElement>(null);
  /** Distancia entre el centro de una tarjeta y la siguiente (ancho + hueco). */
  const stepOf = (el: HTMLDivElement): number => {
    const a = el.children[0] as HTMLElement | undefined;
    const b = el.children[1] as HTMLElement | undefined;
    return a && b ? b.offsetLeft - a.offsetLeft : el.clientWidth;
  };
  // El scroll nativo con snap lo gestiona el navegador (GPU); aquí solo se averigua qué tarjeta queda centrada.
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  /** Efecto de profundidad tipo anillo: giro, escala y brillo según la distancia al centro. Solo transform/opacity, sin re-render. */
  const applyFx = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const step = stepOf(el);
    const pos = el.scrollLeft / step;
    cards.current.forEach((c, i) => {
      if (!c) return;
      const d = Math.max(-2, Math.min(2, i - pos));
      const a = Math.abs(d);
      c.style.transform = `perspective(900px) translateZ(${-a * 70}px) rotateY(${-d * 38}deg) scale(${1 - a * 0.06})`;
      c.style.opacity = String(Math.max(0.25, 1 - a * 0.32));
      c.style.zIndex = String(10 - Math.round(a));
    });
  }, []);
  useEffect(() => { applyFx(); window.addEventListener('resize', applyFx); return () => window.removeEventListener('resize', applyFx); }, [applyFx]);
  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    applyFx();
    const i = Math.max(0, Math.min(N - 1, Math.round(el.scrollLeft / stepOf(el))));
    setCur((c) => (c === i ? c : i));
  }, [N, applyFx]);
  const goTo = useCallback((i: number) => {
    const el = scroller.current;
    if (!el) return;
    const k = ((i % N) + N) % N;
    el.scrollTo({ left: k * stepOf(el), behavior: 'smooth' });
  }, [N]);
  return (
    <div className="screen obsidian">
      <header className="glass-panel relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-3 py-2 sm:grid-cols-[1fr_auto_1fr]" style={{ borderWidth: '0 0 1px 0', borderRadius: 0 }}>
        <div className="col-start-1 row-start-1 min-w-0 justify-self-start"><ProfileCard /></div>
        <div className="col-span-2 row-start-2 flex justify-center sm:col-span-1 sm:col-start-2 sm:row-start-1"><h1 aria-label="STACKS"><Wordmark size={20} /></h1></div>
        <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-2 justify-self-end sm:col-start-3">
          <ChipBalance onPlus={() => setShowRefill(true)} />
          <QuickButtons onRules={() => setPicker(true)} onSettings={() => setSettings(true)} />
        </div>
      </header>
      <EconomyModal open={showRefill} onClose={() => setShowRefill(false)} />

      <div className="relative mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col items-center justify-between overflow-hidden px-4 pt-3" style={{ paddingBottom: 'calc(14px + var(--safe-b))' }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 transition-[background] duration-300" style={{ background: `radial-gradient(ellipse at 50% 38%, ${game.accent}33, transparent 62%)` }} />

        <div aria-hidden />

        {/* Carrusel nativo: scroll horizontal con snap (sin JS por frame) */}
        <div className="relative z-10 w-full" style={{ height: 'min(44dvh, 370px)' }}>
          <div ref={scroller} onScroll={onScroll} role="group" aria-label="Juegos"
            className="no-scrollbar flex h-full snap-x snap-mandatory items-center gap-1 overflow-x-auto scroll-smooth px-[calc(50%-min(31vw,120px))] touch-pan-x [overscroll-behavior-x:contain]">
            {GAMES.map((g, i) => (
              <div key={g.id} ref={(n) => { cards.current[i] = n; }}
                className="relative h-[94%] w-[min(62vw,240px)] shrink-0 snap-center will-change-transform"
                role="group" aria-label={t(`g.${g.id}.name`)} aria-current={i === cur} onClick={() => { if (i !== cur) { feedback('tap'); goTo(i); } }}>
                <div className="h-full w-full rounded-[28px] transition-shadow duration-200"
                  style={{ boxShadow: i === cur ? `0 0 0 1px ${g.accent}aa, 0 14px 34px rgba(0,0,0,.55), 0 0 30px ${g.accent}44` : '0 8px 18px rgba(0,0,0,.5)' }}>
                  <Slide game={g} active={i === cur} />
                </div>
                {/* brillo de cristal sobre la tarjeta activa */}
                {i === cur && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px]" style={{ background: 'linear-gradient(115deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, rgba(255,255,255,.07) 100%)' }} />}
              </div>
            ))}
          </div>
          <button type="button" aria-label="←" onClick={() => goTo(curRef.current - 1)} className="absolute left-0 top-1/2 z-20 grid size-9 -translate-y-1/2 touch-manipulation place-items-center rounded-full border border-amber-200/20 bg-black/70 text-stone-100"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="→" onClick={() => goTo(curRef.current + 1)} className="absolute right-0 top-1/2 z-20 grid size-9 -translate-y-1/2 touch-manipulation place-items-center rounded-full border border-amber-200/20 bg-black/70 text-stone-100"><ChevronRight size={18} /></button>
        </div>

        {/* Acciones del juego elegido */}
        <div className="relative z-10 grid w-full max-w-sm gap-2">
          <button type="button"
            className="gold-foil flex min-h-14 touch-manipulation active:scale-95 items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold" onClick={() => { feedback('tap'); nav(game.route); }}>
            <Play size={17} aria-hidden /> {t('lobby.playAi')}
          </button>
          <button type="button"
            className="flex min-h-12 touch-manipulation active:scale-95 items-center justify-center gap-2 rounded-2xl border border-amber-200/25 bg-gradient-to-b from-zinc-800/90 to-zinc-950/90 text-[14px] font-bold text-stone-100 shadow-[inset_0_1px_rgba(255,255,255,.1)]"
            onClick={() => { feedback('tap'); setOnline(game); }}>
            <Globe size={16} aria-hidden /> {t('lobby.online')}
          </button>
        </div>

        {/* Dock de juegos */}
        <nav className="no-scrollbar relative z-10 flex w-full items-center gap-1.5 overflow-x-auto px-1 sm:justify-center" aria-label="Juegos">
          {GAMES.map((g, i) => (
            <button key={g.id} type="button" aria-label={t(`g.${g.id}.name`)} title={t(`g.${g.id}.name`)} onClick={() => { feedback('tap'); goTo(i); }}
              className="relative grid size-10 shrink-0 touch-manipulation place-items-center rounded-2xl border active:scale-90"
              style={i === cur ? { borderColor: g.accent, background: `${g.accent}22` } : { borderColor: 'rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)' }}>
              <g.icon size={20} style={{ color: i === cur ? g.accent : '#9fb3a8' }} />
            </button>
          ))}
        </nav>
      </div>

      <OnlineLobbyModal game={online} initialCode={inviteCode} onClose={closeOnline} onStart={startOnline} />
      <RulesPicker open={picker} onClose={() => setPicker(false)} onPick={(g) => { setPicker(false); setRules(g); }} />
      <RulesModal game={rules} onClose={() => setRules(null)} />
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
