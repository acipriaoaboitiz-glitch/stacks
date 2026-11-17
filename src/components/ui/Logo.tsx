/** Isotipo de STACKS: tres rombos de naipe apilados en escalera diagonal, en oro degradado sobre un squircle esmeralda. */
export function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} role="img" aria-label="STACKS">
      <defs>
        <linearGradient id="lg-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D4AF37" /><stop offset="1" stopColor="#9E771C" /></linearGradient>
        <linearGradient id="lg-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F5D061" /><stop offset="1" stopColor="#D4AF37" /></linearGradient>
        <linearGradient id="lg-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBE49A" /><stop offset=".5" stopColor="#F5D061" /><stop offset="1" stopColor="#D4AF37" /></linearGradient>
        <clipPath id="lg-sq"><path d="M0 256C0 38 38 0 256 0S512 38 512 256 474 512 256 512 0 474 0 256Z" /></clipPath>
      </defs>
      <g clipPath="url(#lg-sq)">
        <rect width="512" height="512" fill="#061810" />
        <path d="M168 270L232 358 168 446 104 358Z" fill="url(#lg-a)" stroke="#061810" strokeWidth="10" strokeLinejoin="round" />
        <path d="M256 190L328 290 256 390 184 290Z" fill="url(#lg-b)" stroke="#061810" strokeWidth="10" strokeLinejoin="round" />
        <path d="M344 106L424 218 344 330 264 218Z" fill="url(#lg-c)" stroke="#061810" strokeWidth="10" strokeLinejoin="round" />
      </g>
      <path d="M0 256C0 38 38 0 256 0S512 38 512 256 474 512 256 512 0 474 0 256Z" fill="none" stroke="#D4AF37" strokeOpacity=".55" strokeWidth="2" transform="translate(1 1) scale(.9961)" />
    </svg>
  );
}

/** Palabra STACKS: Plus Jakarta Sans ExtraBold en marfil con tracking amplio. */
export function Wordmark({ className = '', size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-baseline font-[800] uppercase leading-none tracking-[0.16em] text-[#FAF8F0] ${className}`}
      style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif", fontSize: size }}>
      STACKS
    </span>
  );
}
