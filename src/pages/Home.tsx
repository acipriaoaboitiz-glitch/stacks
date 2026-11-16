import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Globe, Play, Users, X } from 'lucide-react';
import { Logo } from '../components/ui/Logo.tsx';
import { GameArt } from '../components/cards/GameArt.tsx';
import { HoloCard } from '../components/ui/HoloCard.tsx';
import { OnlineLobbyModal } from '../components/online/OnlineLobbyModal.tsx';
import { QuickButtons } from '../components/ui/QuickButtons.tsx';
import { ChipBalance } from '../components/ui/Hud.tsx';
import { EconomyModal } from '../components/ui/EconomyModal.tsx';
import { RulesModal } from '../components/ui/RulesModal.tsx';
import { ProfileCard } from '../components/ui/ProfileModal.tsx';
import { SettingsModal } from '../components/ui/SettingsModal.tsx';
import { APP_NAME } from '../config.ts';
import { GAMES, findGame, type GameInfo } from '../games/registry.ts';
import { useT } from '../i18n/index.ts';
import type { Room } from '../services/multiplayer.ts';
import { feedback } from '../store/settings.ts';

/** Tarjeta del anillo: foco de luz, rayos giratorios, medallón dorado y emblema flotante con reflejo. */
function Slide({ game, active }: { game: GameInfo; active: boolean }) {
  const t = useT();
  const [c1, c2] = game.tint;
  return (
    <div className="relative grid h-full w-full content-between overflow-hidden rounded-[28px] p-4"
      style={{ background: `radial-gradient(ellipse at 50% 36%, ${game.accent}33, transparent 60%), linear-gradient(160deg, ${c1}, ${c2} 85%)`, border: `1.5px solid ${game.accent}88`,
        boxShadow: active ? `0 24px 60px rgba(0,0,0,.6), 0 0 46px ${game.accent}55, inset 0 1px 0 rgba(255,255,255,.18)` : '0 12px 28px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.1)' }}>
      {/* rayos de luz giratorios */}
      <motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-[40%] size-[130%] -translate-x-1/2 -translate-y-1/2 opacity-25"
        style={{ background: `repeating-conic-gradient(from 0deg, ${game.accent}55 0deg 6deg, transparent 6deg 24deg)`, maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)', WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)' }}
        animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
      <span className="font-mono relative z-10 flex w-fit items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px]" style={{ background: '#000a', color: game.accent, border: `1px solid ${game.accent}55` }}>
        <Users size={11} aria-hidden /> {t(`g.${game.id}.pl`)}
      </span>
      <div className="relative z-10 grid place-items-center">
        {/* medallón: anillo dorado con marcas */}
        <svg aria-hidden viewBox="0 0 200 200" className="absolute size-[200px]" style={{ opacity: 0.9 }}>
          <defs><linearGradient id={`mg-${game.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3b0" /><stop offset=".5" stopColor={game.accent} /><stop offset="1" stopColor="#7a4a06" /></linearGradient></defs>
          <circle cx="100" cy="100" r="92" fill="rgba(0,0,0,.28)" stroke={`url(#mg-${game.id})`} strokeWidth="3" />
          <motion.g style={{ transformOrigin: '100px 100px' }} animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
            <circle cx="100" cy="100" r="82" fill="none" stroke={`url(#mg-${game.id})`} strokeWidth="1.5" strokeDasharray="2 7" />
          </motion.g>
          <circle cx="100" cy="100" r="72" fill="none" stroke={game.accent} strokeWidth=".8" opacity=".5" />
        </svg>
        <motion.div animate={active ? { y: [0, -7, 0] } : { y: 0 }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          <GameArt id={game.id} size={138} />
        </motion.div>
        <div aria-hidden className="absolute -bottom-3 h-3 w-24 rounded-full bg-black/60 blur-md" />
      </div>
      <div className="relative z-10">
        <h3 className="gold-text font-[var(--font-display)] text-[28px] font-bold leading-none">{t(`g.${game.id}.name`)}</h3>
        <p className="mt-1 text-[12px] text-stone-300/80">{t(`g.${game.id}.tag`)}</p>
      </div>
    </div>
  );
}

function RulesPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (g: GameInfo) => void }) {
  const t = useT();
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
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
  const [turn, setTurn] = useState(0);
  const [auto, setAuto] = useState(true);
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => { const on = () => setVw(window.innerWidth); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  const W = Math.min(vw * 0.58, 230);
  const cur = ((turn % N) + N) % N;
  const game = GAMES[cur]!;
  const go = (d: number) => { setAuto(false); setTurn((x) => x + d); };
  // Gira solo; se detiene al tocar y se reanuda a los 9 s.
  useEffect(() => {
    if (!auto) { const r = window.setTimeout(() => setAuto(true), 9000); return () => window.clearTimeout(r); }
    const i = window.setInterval(() => setTurn((x) => x + 1), 3600);
    return () => window.clearInterval(i);
  }, [auto]);
  const pick = (i: number) => { setAuto(false); setTurn((x) => { let d = i - (((x % N) + N) % N); if (d > N / 2) d -= N; if (d < -N / 2) d += N; return x + d; }); };
  return (
    <div className="screen obsidian">
      <header className="glass-panel relative z-20 flex items-center gap-2 px-3 py-2" style={{ borderWidth: '0 0 1px 0', borderRadius: 0 }}>
        <div className="min-w-0 flex-1"><ProfileCard /></div>
        <ChipBalance onPlus={() => setShowRefill(true)} />
        <QuickButtons onRules={() => setPicker(true)} onSettings={() => setSettings(true)} />
      </header>
      <EconomyModal open={showRefill} onClose={() => setShowRefill(false)} />

      <div className="relative mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col items-center justify-between overflow-hidden px-4 pt-3" style={{ paddingBottom: 'calc(14px + var(--safe-b))' }}>
        <motion.div aria-hidden className="pointer-events-none absolute inset-0" animate={{ background: `radial-gradient(ellipse at 50% 38%, ${game.accent}33, transparent 62%)` }} transition={{ duration: 0.6 }} />

        <div className="relative z-10 flex items-center gap-2.5">
          <Logo size={46} />
          <h1 className="gold-text font-[var(--font-display)] text-3xl font-bold leading-none tracking-wide">{APP_NAME}</h1>
        </div>

        {/* Anillo 3D que gira */}
        <div className="relative z-10 w-full" style={{ perspective: 1300, height: 'min(44dvh, 370px)' }}>
          <motion.div className="absolute inset-0 cursor-grab active:cursor-grabbing" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25} style={{ transformStyle: 'preserve-3d' }}
            onDragStart={() => setAuto(false)}
            onDragEnd={(_, i) => { if (i.offset.x < -40 || i.velocity.x < -350) go(1); else if (i.offset.x > 40 || i.velocity.x > 350) go(-1); }}>
            <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }} initial={false}
              animate={{ rotateY: -turn * (360 / N), z: -W * 1.25 }} transition={{ type: 'spring', stiffness: 70, damping: 18 }}>
              {GAMES.map((g, i) => {
                let rel = ((i - cur) % N + N) % N; if (rel > N / 2) rel -= N;
                const a = Math.abs(rel);
                return (
                  <div key={g.id} className="absolute left-1/2 top-0 h-full" onClick={() => { if (rel !== 0) { feedback('tap'); pick(i); } }}
                    style={{ width: W, marginLeft: -W / 2, transform: `rotateY(${i * (360 / N)}deg) translateZ(${W * 1.25}px)`, opacity: a > 2 ? 0.1 : 1 - a * 0.28, filter: a === 0 ? 'none' : `brightness(${1 - a * 0.18})`, backfaceVisibility: 'hidden', pointerEvents: a > 1 ? 'none' : 'auto', transition: 'opacity .5s, filter .5s' }}
                    role="group" aria-label={t(`g.${g.id}.name`)} aria-current={rel === 0}>
                    <HoloCard width="100%" height="100%" radius={28} foilColor="#e2e6ec" intensity={0.4} edgeSparkle={0.6} frame={3} glare={0.45} tiltMax={12} hoverScale={1.03} idle={rel === 0} shadow={rel === 0} disabled={rel !== 0}>
                      <Slide game={g} active={rel === 0} />
                    </HoloCard>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
          <button type="button" aria-label="←" onClick={() => go(-1)} className="absolute left-0 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-amber-200/20 bg-black/50 text-stone-100"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="→" onClick={() => go(1)} className="absolute right-0 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-amber-200/20 bg-black/50 text-stone-100"><ChevronRight size={18} /></button>
        </div>

        {/* Acciones del juego elegido */}
        <div className="relative z-10 grid w-full max-w-sm gap-2">
          <motion.button key={`ai-${game.id}`} type="button" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            className="gold-foil flex min-h-14 items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold" onClick={() => { feedback('tap'); nav(game.route); }}>
            <Play size={17} aria-hidden /> {t('lobby.playAi')}
          </motion.button>
          <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-200/25 bg-gradient-to-b from-zinc-800/90 to-zinc-950/90 text-[14px] font-bold text-stone-100 shadow-[inset_0_1px_rgba(255,255,255,.1)]"
            onClick={() => { feedback('tap'); setOnline(game); }}>
            <Globe size={16} aria-hidden /> {t('lobby.online')}
          </motion.button>
        </div>

        {/* Dock de juegos */}
        <nav className="relative z-10 flex w-full items-center justify-center gap-1.5" aria-label="Juegos">
          {GAMES.map((g, i) => (
            <motion.button key={g.id} type="button" aria-label={t(`g.${g.id}.name`)} title={t(`g.${g.id}.name`)} onClick={() => { feedback('tap'); pick(i); }}
              whileHover={{ y: -4 }} whileTap={{ scale: 0.9 }} className="relative grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
              {i === cur && <motion.span layoutId="dock-active" className="absolute inset-0 rounded-2xl border-2" style={{ borderColor: g.accent, boxShadow: `0 0 16px ${g.accent}88`, background: `${g.accent}22` }} transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <g.icon size={20} className="relative" style={{ color: i === cur ? g.accent : '#9fb3a8' }} />
            </motion.button>
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
