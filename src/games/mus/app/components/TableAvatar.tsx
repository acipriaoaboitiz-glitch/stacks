import { memo } from 'react';
import { AvatarFrame } from '../../../../components/ui/AvatarFrame.tsx';
import { AvatarEmblem } from '../../../../components/ui/AvatarEmblem.tsx';
import { useEmblem, type AvatarId } from '../../../../store/cosmetics.ts';
import { emblemOfName } from '../../../../services/multiplayer.ts';
export type AvatarTone = 'us' | 'them' | 'me' | 'neutral';

const TONE: Record<AvatarTone, string> = {
  us: 'border-teal-300/60 bg-gradient-to-br from-[#1f6a5e] to-[#154a42] text-teal-50',
  me: 'border-teal-300/60 bg-gradient-to-br from-[#1f6a5e] to-[#154a42] text-teal-50',
  them: 'border-orange-300/60 bg-gradient-to-br from-[#77412c] to-[#54301f] text-orange-50',
  neutral: 'border-white/20 bg-zinc-700 text-stone-100',
};

/** Avatar de mesa: se dimensiona con `className` (p. ej. `size-[min(12vw,7dvh)]`) para escalar con la pantalla. */
export const TableAvatar = memo(function TableAvatar({ name, tone = 'neutral', className = '', active = false }: { name: string; tone?: AvatarTone; className?: string; active?: boolean }) {
  // Emblema VIP: el tuyo es el que llevas equipado; el de los demás humanos llega con la sala online
  const mine = useEmblem();
  const emblem: AvatarId | null = tone === 'me' ? mine : emblemOfName(name);
  // «Jugador 1» → J1, «Player 2» → P2, «Joueur 3» → J3, «Spieler 1» → S1; si no, la primera letra (ignora emojis de rol delante del nombre)
  const bot = /^(\p{L})\p{L}* (\d)(?!\d)/u.exec(name);
  const initial = (bot ? bot[1]! + bot[2]! : (/\p{L}/u.exec(name)?.[0] ?? '?')).toUpperCase();
  const circle = (
    <span
      aria-hidden="true"
      className={`grid aspect-square select-none place-items-center overflow-hidden rounded-full border-2 shadow-[0_3px_8px_rgba(0,0,0,.5),inset_0_2px_3px_rgba(255,255,255,.22),inset_0_-4px_8px_rgba(0,0,0,.4)] font-[var(--font-display)] text-[1.1em] font-bold ${TONE[tone]} ${active ? 'ring-2 ring-amber-300' : ''} ${className}`}
    >
      {emblem ? <AvatarEmblem id={emblem} /> : initial}
    </span>
  );
  if (tone !== 'me') return circle;
  return <span className="relative inline-grid" style={{ width: 'fit-content' }}>{circle}<AvatarFrame /></span>;
});
