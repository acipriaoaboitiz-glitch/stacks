import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WelcomeGate } from './components/ui/WelcomeGate.tsx';
import { ClubBackground } from './components/ui/ClubBackground.tsx';
import { SocialRoot } from './components/ui/SocialRoot.tsx';
import { ChipRainHost } from './components/ui/ChipRain.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import Blackjack from './games/blackjack/Blackjack.tsx';
import Brisca from './games/brisca/Brisca.tsx';
import Escoba from './games/escoba/Escoba.tsx';
import Uno from './games/uno/Uno.tsx';
import MusPlay from './games/mus/MusPlay.tsx';
import Chinchon from './games/chinchon/Chinchon.tsx';
import Poker from './games/poker/Poker.tsx';
import Presidente from './games/presidente/Presidente.tsx';
import Seises from './games/seises/Seises.tsx';
import Tute from './games/tute/Tute.tsx';
import Home from './pages/Home.tsx';

// Enlace directo a mesa: «?sala=CODIGO» (WhatsApp, etc.) se traslada al hash que lee el router.
try {
  const q = new URLSearchParams(window.location.search);
  if (q.has('sala') || q.has('join')) window.history.replaceState(null, '', `${window.location.pathname}#/?${q.toString()}`);
} catch { /* sin history */ }

// HashRouter: funciona en hosting estático, PWA y dentro de Capacitor sin reescrituras de servidor.
export default function App() {
  return (
    <ErrorBoundary>
    <ClubBackground />
    <WelcomeGate>
    <HashRouter>
      <SocialRoot />
      <ChipRainHost />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/mus" element={<MusPlay />} />
        <Route path="/play/blackjack" element={<Blackjack />} />
        <Route path="/play/brisca" element={<Brisca />} />
        <Route path="/play/escoba" element={<Escoba />} />
        <Route path="/play/uno" element={<Uno />} />
        <Route path="/play/chinchon" element={<Chinchon />} />
        <Route path="/play/tute" element={<Tute />} />
        <Route path="/play/poker" element={<Poker />} />
        <Route path="/play/comemierda" element={<Presidente />} />
        <Route path="/play/presidente" element={<Presidente />} />
        <Route path="/play/seises" element={<Seises />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
    </WelcomeGate>
    </ErrorBoundary>
  );
}
