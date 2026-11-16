/** Logo de STACKS: moneda de oro con relieve, canto estriado y monograma S en pan de oro. */
export function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} role="img" aria-label="STACKS" style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.55))' }}>
<defs>
  <radialGradient id="lg-coin" cx="35%" cy="28%" r="85%"><stop offset="0" stopColor="#fff6c4"/><stop offset=".28" stopColor="#f3c64a"/><stop offset=".62" stopColor="#b8780f"/><stop offset="1" stopColor="#6b3f06"/></radialGradient>
  <linearGradient id="lg-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3b0"/><stop offset=".5" stopColor="#c58a14"/><stop offset="1" stopColor="#5a3406"/></linearGradient>
  <radialGradient id="lg-face" cx="50%" cy="35%" r="80%"><stop offset="0" stopColor="#14573f"/><stop offset=".65" stopColor="#082d21"/><stop offset="1" stopColor="#03130d"/></radialGradient>
  <linearGradient id="lg-letter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffbe0"/><stop offset=".35" stopColor="#f6cf55"/><stop offset=".7" stopColor="#c98a12"/><stop offset="1" stopColor="#7a4a06"/></linearGradient>
  <linearGradient id="lg-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
</defs>
<circle cx="256" cy="268" r="236" fill="#000" opacity=".35"/>
<circle cx="256" cy="256" r="240" fill="url(#lg-coin)"/>
<circle cx="256" cy="256" r="240" fill="none" stroke="url(#lg-rim)" strokeWidth="10"/>
<circle cx="256" cy="256" r="222" fill="none" stroke="#5a3406" strokeWidth="6" strokeDasharray="3 9" opacity=".7"/>
<circle cx="256" cy="256" r="200" fill="url(#lg-rim)"/>
<circle cx="256" cy="256" r="190" fill="url(#lg-face)"/>
<circle cx="256" cy="256" r="190" fill="none" stroke="#000" strokeOpacity=".5" strokeWidth="4"/>
<text x="258" y="272" textAnchor="middle" dominantBaseline="central" fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="300" fill="#000" opacity=".55">S</text>
<text x="256" y="266" textAnchor="middle" dominantBaseline="central" fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="300" fill="url(#lg-letter)" stroke="#5a3406" strokeWidth="2">S</text>
<text x="254" y="263" textAnchor="middle" dominantBaseline="central" fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="300" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2">S</text>
<path d="M92 190 A190 190 0 0 1 420 150 A230 150 0 0 0 92 190Z" fill="url(#lg-gloss)" opacity=".55"/>
<path d="M120 440 Q256 480 392 440" fill="none" stroke="#fff3b0" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
}
