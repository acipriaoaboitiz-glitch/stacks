import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GAMES } from '../../games/registry.ts';
import { getActiveRoom } from '../../services/multiplayer.ts';
import { useProfile } from '../../store/profile.ts';
import { social } from '../../store/social.ts';
import { LiveNotificationBanner } from './LiveNotificationBanner.tsx';

/** Arranca el club social, publica qué estás haciendo según la ruta y monta los avisos en vivo (visibles también dentro de las partidas). */
export function SocialRoot() {
  const { pathname } = useLocation();
  const profile = useProfile();
  useEffect(() => { if (profile) void social.start(); }, [profile]);
  useEffect(() => {
    const game = GAMES.find((g) => g.route === pathname || `/play/${g.id}` === pathname);
    if (game) { social.setActivity('playing', game.id); return; }
    const room = getActiveRoom();
    if (room && pathname === '/') social.setActivity('room', room.gameId, room.code);
    else social.setActivity('lobby');
  }, [pathname]);
  return <LiveNotificationBanner />;
}
