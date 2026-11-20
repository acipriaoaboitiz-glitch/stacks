import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Gem, Gift, Globe, HelpCircle, Play, Trophy, Users, X } from 'lucide-react';
import { Portal } from '../components/ui/Portal.tsx';
import { GameArt } from '../components/cards/GameArt.tsx';
import { OnlineLobbyModal } from '../components/online/OnlineLobbyModal.tsx';
import { IconBtn, QuickButtons } from '../components/ui/QuickButtons.tsx';
import { FriendsDrawer } from '../components/ui/FriendsDrawer.tsx';
import { LeaderboardModal } from '../components/ui/LeaderboardModal.tsx';
import { VipShopModal } from '../components/ui/VipShopModal.tsx';
import { createRoom, getActiveRoom, setActiveRoom } from '../services/multiplayer.ts';
import { social, useSocial, type Friend } from '../store/social.ts';
import { canClaimDaily, useWallet } from '../store/wallet.ts';
import { claimableMissions, useMissions } from '../store/progression.ts';
import { ChipBalance } from '../components/ui/Hud.tsx';
import { Wordmark } from '../components/ui/Logo.tsx';
import { EconomyModal } from '../components/ui/EconomyModal.tsx';
import { RulesModal } from '../components/ui/RulesModal.tsx';
import { ProfileCard } from '../components/ui/ProfileModal.tsx';
import { Segmented, SettingsModal } from '../components/ui/SettingsModal.tsx';
import { GAMES, findGame, type GameCategory, type GameInfo } from '../games/registry.ts';
import { useT } from '../i18n/index.ts';
import type { Room } from '../services/multiplayer.ts';
import { feedback } from '../store/settings.ts';
import { useBackClose } from '../services/backStack.ts';

/** Secciones del lobby (el orden es el de la barra). */
const CATS: { id: 'all' | GameCategory; key: string }[] = [
  { id: 'all', key: 'cat.all' }, { id: 'espanola', key: 'cat.es' }, { id: 'casino', key: 'cat.casino' }, { id: 'mesa', key: 'cat.mesa' }, { id: 'logica', key: 'cat.logic' },
];

/** Polvo dorado del fondo: posiciones fijas, animación CSS (transform/opacity), sin JS por fotograma. */
const DUST = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 96 + 2, size: 3 + (i % 4), dur: 16 + (i * 7) % 12, delay: -((i * 5) % 18), dx: ((i * 23) % 40) - 20, o: 0.35 + (i % 4) * 0.12,
}));

/** Etiqueta de ritmo de la tarjeta (esquina superior derecha). */
const LIVE = new Set(['uno', 'presidente', 'domino', 'mentiroso']);
const tagOf = (g: GameInfo): string => (LIVE.has(g.id) ? 'EN VIVO' : g.category === 'casino' ? 'VIP' : g.category === 'mesa' ? 'ESTRATÉGICO' : g.category === 'logica' ? 'LÓGICA' : 'CLÁSICO');
const HALO: Record<GameCategory, string> = { espanola: '#d4af37', casino: '#c0213a', mesa: '#10b981', logica: '#22d3ee' };

/** Tarjeta del carrusel: foco de luz, medallón dorado y emblema. Estática (sin animaciones infinitas) para mantener 60 FPS en móvil. */
const Slide = memo(function Slide({ game }: { game: GameInfo; active: boolean }) {
  const t = useT();
  const [c1, c2] = game.tint;
  return (
    <div className="relative grid h-full w-full content-between overflow-hidden rounded-[28px] p-4"
      style={{ background: `radial-gradient(ellipse at 50% -4%, rgba(255,236,190,.24), transparent 52%), radial-gradient(ellipse at 50% 40%, ${game.accent}40, transparent 62%), linear-gradient(160deg, ${c1}, ${c2} 85%)`, border: '1px solid rgba(255,255,255,0.08)' }}>
      <span aria-hidden className="pointer-events-none absolute inset-0 z-20 -translate-x-full rounded-[28px] opacity-0 transition-[transform,opacity] duration-500 ease-out group-hover:translate-x-0 group-hover:opacity-100" style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,.14) 48%, transparent 62%)' }} />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-[28px]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,0))' }} />
      <span className="font-mono relative z-10 flex w-fit items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px]" style={{ background: '#000a', color: game.accent, border: `1px solid ${game.accent}55` }}>
        <Users size={11} aria-hidden /> {t(`g.${game.id}.pl`)}
      </span>
      <span className="absolute right-4 top-4 z-10 rounded-full border border-[#D4AF37]/60 bg-black/50 px-2.5 py-[3px] text-[10px] font-extrabold tracking-[.1em] text-[#FCE38A]">{tagOf(game)}</span>
      <div className="relative z-10 grid origin-center place-items-center lg:scale-[1.08] xl:scale-[1.2]">
        <svg aria-hidden viewBox="0 0 200 200" shapeRendering="geometricPrecision" className="absolute size-[214px]" style={{ opacity: 0.9 }}>
          <defs><linearGradient id={`mg-${game.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3b0" /><stop offset=".5" stopColor={game.accent} /><stop offset="1" stopColor="#7a4a06" /></linearGradient></defs>
          <circle cx="100" cy="100" r="92" fill="rgba(0,0,0,.34)" stroke={`url(#mg-${game.id})`} strokeWidth="3" />
          <circle cx="100" cy="100" r="82" fill="none" stroke={`url(#mg-${game.id})`} strokeWidth="1.5" strokeDasharray="2 7" />
          <circle cx="100" cy="100" r="72" fill="none" stroke={game.accent} strokeWidth=".8" opacity=".5" />
        </svg>
        <GameArt id={game.id} size={176} />
      </div>
      <div className="relative z-10">
        <h3 className="gold-text font-[var(--font-display)] text-[28px] font-bold leading-snug py-0.5">{t(`g.${game.id}.name`)}</h3>
        <p className="mt-1 text-[12px] text-stone-300/80">{t(`g.${game.id}.tag`)}</p>
      </div>
    </div>
  );
});

function RulesPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (g: GameInfo) => void }) {
  const t = useT();
  useBackClose(open, onClose);
  return (
    <Portal><AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
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
    </AnimatePresence></Portal>
  );
}

export default function Home() {
  const nav = useNavigate();
  const t = useT();
  const [params, setParams] = useSearchParams();
  const linkCode = params.get('join') ?? params.get('sala') ?? params.get('room');
  const [online, setOnline] = useState<GameInfo | null>(() => (linkCode ? findGame(params.get('game') ?? 'mus') ?? null : null));
  const [inviteCode, setInviteCode] = useState<string | undefined>(() => linkCode ?? undefined);
  const [settings, setSettings] = useState(false);
  const [showRefill, setShowRefill] = useState(false);
  const [picker, setPicker] = useState(false);
  const [rules, setRules] = useState<GameInfo | null>(null);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [hostRoom, setHostRoom] = useState<Room | null>(null);
  const soc = useSocial();
  const wal = useWallet();
  const missions = useMissions();
  const online$ = soc.peers.length;
  const friendsOnline = soc.friends.filter((f) => soc.peers.some((p) => p.uid === f.uid)).length;
  const chestReady = canClaimDaily(wal) || claimableMissions(missions) > 0;

  // Un enlace `?join=CODIGO` (o una invitación aceptada con la app ya abierta) abre la sala sin pasos intermedios.
  useEffect(() => {
    if (!linkCode) return;
    const g = findGame(params.get('game') ?? 'mus');
    if (g) { setOnline(g); setInviteCode(linkCode); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkCode]);
  // Cofre diario: la primera vez que entras cada día se abre solo (una vez por sesión).
  useEffect(() => {
    try { if (canClaimDaily() && !sessionStorage.getItem('stacks.chestShown')) { sessionStorage.setItem('stacks.chestShown', '1'); setShowRefill(true); } } catch { /* sin sessionStorage */ }
  }, []);
  // Invitar a un amigo: usa la sala activa o crea una privada del juego seleccionado y te lleva a ella.
  const inviteFriend = async (f: Friend) => {
    const g = game;
    let room = getActiveRoom();
    if (!room) {
      try { room = await createRoom(g.id, wal.name); setActiveRoom(room); } catch { return; }
    }
    social.invite(f.uid, room.gameId, room.code);
    const rg = findGame(room.gameId) ?? g;
    setHostRoom(room); setOnline(rg); setFriendsOpen(false);
  };

  const startOnline = (room: Room) => {
    const g = findGame(room.gameId)!;
    setOnline(null);
    nav(`${g.route}?room=${room.code}`);
  };
  const closeOnline = () => {
    setOnline(null);
    setInviteCode(undefined);
    if (params.has('room') || params.has('sala') || params.has('join')) { params.delete('room'); params.delete('sala'); params.delete('join'); params.delete('game'); setParams(params, { replace: true }); }
  };

  const [modes, setModes] = useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem('stacks.modes') ?? '{}') as Record<string, string>; } catch { return {}; } });
  const pickMode = (id: string, m: string): void => { setModes((cur) => { const n = { ...cur, [id]: m }; try { localStorage.setItem('stacks.modes', JSON.stringify(n)); } catch { /* sin almacenamiento */ } return n; }); };
  const [cat, setCat] = useState<'all' | GameCategory>('all');
  const LIST = useMemo(() => (cat === 'all' ? GAMES : GAMES.filter((g) => g.category === cat)), [cat]);
  const N = LIST.length;
  const [cur, setCur] = useState(0);
  const curRef = useRef(0);
  curRef.current = cur;
  const game = LIST[Math.min(cur, N - 1)]!;
  const scroller = useRef<HTMLDivElement>(null);
  const wheelAt = useRef(0);
  const dragX = useRef<number | null>(null);
  /** Distancia entre el centro de una tarjeta y la siguiente (ancho + hueco). */
  const stepOf = (el: HTMLDivElement): number => {
    const a = el.children[0] as HTMLElement | undefined;
    const b = el.children[1] as HTMLElement | undefined;
    return a && b ? b.offsetLeft - a.offsetLeft : el.clientWidth;
  };
  // El scroll nativo con snap lo gestiona el navegador (GPU); aquí solo se averigua qué tarjeta queda centrada.
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const inner = useRef<(HTMLDivElement | null)[]>([]);
  /** Escala y opacidad según la distancia al centro (sin giros 3D). Solo transform/opacity, sin re-render. */
  const applyFx = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const step = stepOf(el);
    const pos = el.scrollLeft / step;
    cards.current.forEach((c, i) => {
      if (!c) return;
      const d = Math.max(-2, Math.min(2, i - pos));
      const a = Math.abs(d);
      const w = window.innerWidth;
      const wide = w >= 1024;
      c.style.transform = `scale(${1 - Math.min(1, a) * (wide ? 0.32 : 0.1)})`;
      // Las vecinas solo asoman en monitores muy anchos o en móvil; en tablet/PC normal se desvanecen sin franjas cortadas
      const hideSides = w >= 640 && w < 1024;
      c.style.opacity = String(a < 0.5 ? 1 : hideSides ? Math.max(0, 1 - a * 2) : wide ? (a < 0.5 ? 1 : a < 1.5 ? 0.55 : 0) : Math.max(0.35, 1 - a * 0.5));
      c.style.zIndex = String(10 - Math.round(a));
    });
  }, []);
  useEffect(() => {
    setCur(0);
    const el = scroller.current;
    if (el) el.scrollTo({ left: 0, behavior: 'auto' });
    applyFx();
  }, [cat, applyFx]);
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
  // Teclado: ← → navegan y Enter juega (si no hay un modal o campo enfocado)
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.closest('[role=dialog]'))) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(curRef.current - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(curRef.current + 1); }
      else if (e.key === 'Enter' && el?.tagName !== 'BUTTON') document.querySelector<HTMLButtonElement>('[data-play]')?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo]);
  const badge = (n: number, tone: string) => (n > 0 ? <span className={`pointer-events-none absolute -right-1 -top-1 grid min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-extrabold leading-4 tabular-nums text-white ${tone}`}>{n}</span> : null);
  const friendsBtn = (
    <span className="relative">
      <IconBtn label={t('soc.title')} onClick={() => setFriendsOpen(true)}><Users size={17} /></IconBtn>
      {badge(soc.incoming.length, 'bg-red-600')}
      {soc.incoming.length === 0 && friendsOnline > 0 && badge(friendsOnline, 'bg-emerald-600')}
    </span>
  );
  const boardBtn = <IconBtn label={t('lb.title')} onClick={() => setBoardOpen(true)}><Trophy size={17} /></IconBtn>;
  const shopBtn = <IconBtn label={t('vip.title')} onClick={() => setShopOpen(true)}><Gem size={17} /></IconBtn>;
  void online$;

  return (
    <div className="screen obsidian overflow-x-hidden">
      <header className="desk-zoom glass-panel relative z-20 mx-auto grid w-full max-w-7xl overflow-hidden max-sm:min-h-14 max-sm:pt-[env(safe-area-inset-top)] sm:h-16 sm:px-6 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-3 py-2 sm:grid-cols-[1fr_auto_1fr]" style={{ borderWidth: '0 0 1px 0', borderRadius: 0 }}>
        <div className="col-start-1 row-start-1 min-w-0 justify-self-start"><ProfileCard /></div>
        {/* Fila central: STACKS siempre en el centro exacto (columnas 1fr · auto · 1fr); en móvil, a sus lados van Amigos/Ranking y Club VIP */}
        <div className="col-span-2 row-start-2 grid grid-cols-[1fr_auto_1fr] items-center max-sm:hidden sm:col-span-1 sm:col-start-2 sm:row-start-1">
          <div className="sm:hidden" />
          <h1 aria-label="STACKS" className="max-sm:hidden"><Wordmark size={20} /></h1>
          <div className="sm:hidden" />
        </div>
        <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-2 justify-self-end sm:col-start-3">
          <span className="hidden items-center gap-1.5 sm:flex">{friendsBtn}{boardBtn}{shopBtn}</span>
          <ChipBalance onPlus={() => setShowRefill(true)} alert={chestReady} />
          <span className="max-sm:hidden"><QuickButtons onRules={() => setPicker(true)} onSettings={() => setSettings(true)} /></span>
          <span className="sm:hidden"><QuickButtons onSettings={() => setSettings(true)} /></span>
        </div>
      </header>
      <EconomyModal open={showRefill} onClose={() => setShowRefill(false)} />
      <FriendsDrawer open={friendsOpen} onClose={() => setFriendsOpen(false)} onInvite={(f) => { void inviteFriend(f); }} />
      <LeaderboardModal open={boardOpen} onClose={() => setBoardOpen(false)} />
      <VipShopModal open={shopOpen} onClose={() => setShopOpen(false)} />

      <div className="desk-zoom relative mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col items-center justify-between px-4 pt-3 pb-[calc(76px+var(--safe-b))] md:max-w-none md:pb-[calc(14px+var(--safe-b))]" >
        <div aria-hidden className="pointer-events-none absolute inset-0 transition-[background] duration-300" style={{ background: `radial-gradient(ellipse at 50% 38%, ${game.accent}33, transparent 62%)` }} />

        {/* Barra de secciones con selector deslizante */}
        <div className="relative z-20 flex w-full justify-center"><div role="tablist" aria-label="Secciones" className="no-scrollbar inline-flex w-fit max-w-none items-center justify-center gap-1.5 rounded-full border border-white/10 bg-[#081711] p-1.5 no-scrollbar max-md:flex max-md:w-[94vw] max-md:justify-start max-md:gap-1 max-md:overflow-x-auto">
          {CATS.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={(e) => { e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); if (cat !== c.id) { feedback('tap'); setCat(c.id); } }}
              className={`relative shrink-0 touch-manipulation whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors md:px-4 md:py-2 md:text-sm ${cat === c.id ? 'text-[#2a1d02]' : 'text-white/55 active:text-white'}`}>
              {cat === c.id && <motion.span layoutId="lobby-category" aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FCE38A] to-[#D4AF37] shadow-[0_2px_10px_rgba(212,175,55,.35)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{t(c.key)}</span>
            </button>
          ))}
        </div></div>

        {/* polvo dorado flotando muy despacio */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {DUST.map((d, i) => <span key={i} className="dust" style={{ left: `${d.left}%`, width: d.size, height: d.size, ['--dur' as string]: `${d.dur}s`, ['--delay' as string]: `${d.delay}s`, ['--dx' as string]: `${d.dx}px`, ['--o' as string]: d.o }} />)}
        </div>

        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[44%] z-0 size-[min(90vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background] duration-500" style={{ background: `radial-gradient(circle, ${HALO[game.category]}30 0%, ${HALO[game.category]}00 66%)` }} />

        {/* Carrusel nativo: scroll horizontal con snap (sin JS por frame) */}
        <motion.div key={cat} className="relative z-10 h-[min(36dvh,340px)] w-full max-md:h-auto max-md:max-h-[46dvh] max-md:min-h-0 max-md:flex-1 md:h-[min(40dvh,360px)] lg:h-[calc(min(450px,52dvh)/var(--z,1))] xl:h-[calc(min(490px,56dvh)/var(--z,1))]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
          <div ref={scroller} onScroll={onScroll} role="group" aria-label="Juegos"
            onWheel={(e) => { if (window.innerWidth < 1024) return; const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX; const now = Date.now(); if (Math.abs(d) < 20 || now - wheelAt.current < 350) return; wheelAt.current = now; goTo(curRef.current + (d > 0 ? 1 : -1)); }}
            onPointerDown={(e) => { if (e.pointerType === 'mouse') dragX.current = e.clientX; }}
            onPointerUp={(e) => { if (e.pointerType === 'mouse' && dragX.current !== null) { const dx = e.clientX - dragX.current; dragX.current = null; if (Math.abs(dx) > 70) goTo(curRef.current + (dx < 0 ? 1 : -1)); } }}
            className="no-scrollbar flex h-full snap-x snap-mandatory items-center gap-1 overflow-x-auto scroll-smooth px-[calc(50%-min(31vw,120px))] touch-pan-x [overscroll-behavior-x:contain] lg:gap-3 lg:px-[calc(50%-calc(210px/var(--z,1)))] xl:px-[calc(50%-calc(230px/var(--z,1)))]">
            {LIST.map((g, i) => (
              <div key={g.id} ref={(n) => { cards.current[i] = n; }}
                className="relative h-[94%] w-[min(62vw,240px)] shrink-0 snap-center will-change-transform lg:h-[calc(min(430px,50dvh)/var(--z,1))] lg:w-[calc(420px/var(--z,1))] xl:h-[calc(min(460px,54dvh)/var(--z,1))] xl:w-[calc(460px/var(--z,1))]"
                role="group" aria-label={t(`g.${g.id}.name`)} aria-current={i === cur} onClick={() => { if (i !== cur) { feedback('tap'); goTo(i); } }}>
                <div ref={(n) => { inner.current[i] = n; }} className="group h-full w-full rounded-[28px] border border-transparent transition-[box-shadow,transform,border-color] duration-[220ms] ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1.5 hover:border-[#D4AF37]/70"
                  style={{ boxShadow: i === cur ? `0 0 0 1px ${g.accent}aa, 0 14px 34px rgba(0,0,0,.55), 0 0 30px ${g.accent}44` : '0 8px 18px rgba(0,0,0,.5)' }}>
                  <Slide game={g} active={i === cur} />
                </div>
                {/* brillo de cristal sobre la tarjeta activa */}
                {i === cur && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px]" style={{ background: 'linear-gradient(115deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, rgba(255,255,255,.07) 100%)' }} />}
              </div>
            ))}
          </div>
          <button type="button" aria-label="←" onClick={() => goTo(curRef.current - 1)} className="absolute left-0 max-sm:hidden lg:left-[max(4px,calc(50%-calc(660px/var(--z,1))))] top-1/2 z-20 grid size-9 -translate-y-1/2 touch-manipulation place-items-center rounded-full border border-amber-200/20 bg-black/70 text-stone-100"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="→" onClick={() => goTo(curRef.current + 1)} className="absolute max-sm:hidden right-0 lg:right-[max(4px,calc(50%-calc(660px/var(--z,1))))] top-1/2 z-20 grid size-9 -translate-y-1/2 touch-manipulation place-items-center rounded-full border border-amber-200/20 bg-black/70 text-stone-100"><ChevronRight size={18} /></button>
        </motion.div>

        {/* Acciones del juego elegido: multijugador (IA o sala) o individual (modo + Jugar ahora) */}
        <div className="relative z-10 grid w-full max-w-sm gap-2 lg:max-w-[calc(460px/var(--z,1))]">
          {game.solo ? (
            <>
              <Segmented value={modes[game.id] && game.solo.modes.includes(modes[game.id]!) ? modes[game.id]! : game.solo.def}
                options={game.solo.modes.map((m) => ({ id: m, label: t(`mode.${m}`) }))} onChange={(m) => pickMode(game.id, m)} label={t('mode.title')} />
              <button type="button"
                data-play className="gold-foil flex min-h-14 touch-manipulation active:scale-95 items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold" onClick={() => { feedback('tap'); nav(`${game.route}?mode=${modes[game.id] && game.solo!.modes.includes(modes[game.id]!) ? modes[game.id] : game.solo!.def}`); }}>
                <Play size={17} aria-hidden /> {t('lobby.playNow')}
              </button>
            </>
          ) : (
            <>
              {game.levels && (
                <Segmented value={modes[game.id] && game.levels.modes.includes(modes[game.id]!) ? modes[game.id]! : game.levels.def}
                  options={game.levels.modes.map((m) => ({ id: m, label: t(`mode.${m}`) }))} onChange={(m) => pickMode(game.id, m)} label={t('mode.title')} />
              )}
              <button type="button"
                data-play className="gold-foil flex min-h-14 touch-manipulation active:scale-95 items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold" onClick={() => { feedback('tap'); nav(game.levels ? `${game.route}?mode=${modes[game.id] && game.levels.modes.includes(modes[game.id]!) ? modes[game.id] : game.levels.def}` : game.route); }}>
                <Play size={17} aria-hidden /> {t('lobby.playAi')}
              </button>
              <button type="button"
                className="flex min-h-12 touch-manipulation active:scale-95 items-center justify-center gap-2 rounded-2xl border border-amber-200/25 bg-gradient-to-b from-zinc-800/90 to-zinc-950/90 text-[14px] font-bold text-stone-100 shadow-[inset_0_1px_rgba(255,255,255,.1)]"
                onClick={() => { feedback('tap'); setOnline(game); }}>
                <Globe size={16} aria-hidden /> {t('lobby.online')}{friendsOnline > 0 && <span className="ml-1 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-400" />{friendsOnline}</span>}
              </button>
            </>
          )}
        </div>
        {/* acceso rápido: recompensa diaria y reglas del juego elegido */}
        <div className="relative z-10 flex items-center gap-2 rounded-full border border-white/10 bg-[#081711]/90 p-1">
          <button type="button" onClick={() => { feedback('tap'); setShowRefill(true); }} className="relative flex h-9 touch-manipulation items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-bold text-stone-200 active:scale-95">
            <Gift size={15} strokeWidth={1.75} aria-hidden />Recompensa diaria
            {chestReady && <span aria-hidden className="absolute right-1.5 top-1.5 size-2 animate-pulse rounded-full bg-[#FCE38A] shadow-[0_0_6px_#FCE38A]" />}
          </button>
          <span aria-hidden className="h-4 w-px bg-white/15 max-md:hidden" />
          <button type="button" onClick={() => { feedback('tap'); setShowRefill(true); }} className="flex h-9 touch-manipulation items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-bold text-stone-200 active:scale-95 max-md:hidden"><Trophy size={15} strokeWidth={1.75} aria-hidden />Misiones del día</button>
          <span aria-hidden className="h-4 w-px bg-white/15" />
          <button type="button" onClick={() => { feedback('tap'); setRules(game); }} className="flex h-9 touch-manipulation items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-bold text-stone-200 active:scale-95"><HelpCircle size={15} strokeWidth={1.75} aria-hidden />Reglas</button>
        </div>
      </div>

      {/* Barra de navegación inferior nativa (solo móvil) */}
      <nav aria-label="Navegación" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/10 bg-[#071510]/95 pb-[env(safe-area-inset-bottom)] md:hidden">
        {([
          ['Jugar', Play, !friendsOpen && !boardOpen && !shopOpen, () => { setFriendsOpen(false); setBoardOpen(false); setShopOpen(false); }, false],
          ['Amigos', Users, friendsOpen, () => setFriendsOpen(true), soc.incoming.length > 0 || friendsOnline > 0],
          ['Ranking', Trophy, boardOpen, () => setBoardOpen(true), false],
          ['Club VIP', Gem, shopOpen, () => setShopOpen(true), false],
        ] as const).map(([label, Icon, on, go, dot]) => (
          <button key={label} type="button" aria-current={on} onClick={() => { feedback('tap'); go(); }} className={`relative flex h-[58px] touch-manipulation flex-col items-center justify-center gap-0.5 text-[11px] font-bold active:scale-95 ${on ? 'text-[#FCE38A]' : 'text-white/55'}`}>
            {on && <motion.span layoutId="mobile-nav" aria-hidden className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-[#FCE38A]" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
            <span className="relative"><Icon size={21} strokeWidth={1.75} aria-hidden />{dot && <span aria-hidden className="absolute -right-1 -top-0.5 size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />}</span>
            {label}
          </button>
        ))}
      </nav>

      <OnlineLobbyModal game={online} initialCode={inviteCode} existing={hostRoom} onClose={() => { setHostRoom(null); closeOnline(); }} onStart={startOnline} />
      <RulesPicker open={picker} onClose={() => setPicker(false)} onPick={(g) => { setPicker(false); setRules(g); }} />
      <RulesModal game={rules} onClose={() => setRules(null)} />
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
