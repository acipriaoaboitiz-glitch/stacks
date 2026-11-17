/** Isotipo de STACKS: «S» monolítica de tres segmentos diagonales facetados, en oro metálico sobre un squircle esmeralda. */
export function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} role="img" aria-label="STACKS">
      <defs>
        <linearGradient id="lg-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FCE38A" /><stop offset="1" stopColor="#E3BD4A" /></linearGradient>
        <linearGradient id="lg-mid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3BD4A" /><stop offset="1" stopColor="#D4AF37" /></linearGradient>
        <linearGradient id="lg-low" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D4AF37" /><stop offset="1" stopColor="#8C6314" /></linearGradient>
        <clipPath id="lg-c1"><polygon points="0,0 512,0 512,196 0,240" /></clipPath>
        <clipPath id="lg-c2"><polygon points="0,240 512,196 512,306 0,334" /></clipPath>
        <clipPath id="lg-c3"><polygon points="0,334 512,306 512,512 0,512" /></clipPath>
        <clipPath id="lg-sq"><path d="M0 256C0 38 38 0 256 0S512 38 512 256 474 512 256 512 0 474 0 256Z" /></clipPath>
      </defs>
      <g clipPath="url(#lg-sq)">
        <rect width="512" height="512" fill="#061810" />
        <g clipPath="url(#lg-c1)"><g transform="translate(256 256) skewX(-10) translate(-256 -256)"><path d="M346 160H204V256H318V352H168" fill="none" stroke="url(#lg-top)" strokeWidth="64" strokeLinejoin="miter" strokeMiterlimit="10" /></g></g>
        <g clipPath="url(#lg-c2)"><g transform="translate(256 256) skewX(-10) translate(-256 -256)"><path d="M346 160H204V256H318V352H168" fill="none" stroke="url(#lg-mid)" strokeWidth="64" strokeLinejoin="miter" strokeMiterlimit="10" /></g></g>
        <g clipPath="url(#lg-c3)"><g transform="translate(256 256) skewX(-10) translate(-256 -256)"><path d="M346 160H204V256H318V352H168" fill="none" stroke="url(#lg-low)" strokeWidth="64" strokeLinejoin="miter" strokeMiterlimit="10" /></g></g>
        <path d="M0 240L512 196M0 334L512 306" stroke="#061810" strokeWidth="6" />
      </g>
      <path d="M0 256C0 38 38 0 256 0S512 38 512 256 474 512 256 512 0 474 0 256Z" fill="none" stroke="#D4AF37" strokeOpacity=".55" strokeWidth="2" transform="translate(1 1) scale(.9961)" />
    </svg>
  );
}

/** Palabra STACKS: Unbounded Bold, tracking amplio y degradado oro metálico. */
export function Wordmark({ className = '', size = 22 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-block select-none whitespace-nowrap font-bold uppercase leading-none tracking-[0.14em] ${className}`}
      style={{ fontFamily: "'Unbounded', 'Outfit', sans-serif", fontSize: size, background: 'linear-gradient(135deg,#F6D87A,#D4AF37)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
      STACKS
    </span>
  );
}
