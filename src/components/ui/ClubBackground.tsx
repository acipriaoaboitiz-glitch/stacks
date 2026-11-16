import { THEMES, useSettings } from '../../store/settings.ts';

/** Fondo de club privado: paño del tapete elegido, enrejado de rombos dorados, foco de luz lento y viñeta. */
export function ClubBackground() {
  const th = THEMES[useSettings().theme];
  const lattice = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><path d='M32 4 L60 32 L32 60 L4 32 Z' fill='none' stroke='%23d4af37' stroke-width='1'/><circle cx='32' cy='32' r='2' fill='%23d4af37'/></svg>\")";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0, background: th.c }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 35%, ${th.a}, ${th.b} 55%, ${th.c} 100%)` }} />
      <div className="absolute inset-0" style={{ backgroundImage: lattice, backgroundSize: '64px 64px', opacity: 0.07 }} />
      <div className="club-sweep absolute inset-0" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.7) 100%)' }} />
    </div>
  );
}
