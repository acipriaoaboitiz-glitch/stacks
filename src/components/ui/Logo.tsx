/** Isotipo de STACKS: «S» angular en oro con un corte de rombo en el espacio negativo, dentro de un squircle esmeralda. */
export function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} role="img" aria-label="STACKS">
      <defs>
        <linearGradient id="lg-gold" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stopColor="#F6D87A" /><stop offset="1" stopColor="#D4AF37" /></linearGradient>
        <clipPath id="lg-sq"><path d="M0 256C0 38 38 0 256 0S512 38 512 256 474 512 256 512 0 474 0 256Z" /></clipPath>
      </defs>
      <g clipPath="url(#lg-sq)">
        <rect width="512" height="512" fill="#061810" />
        <g transform="translate(256 256) skewX(-10) translate(-256 -256)">
          <path d="M342 160H200V256H316V352H170" fill="none" stroke="url(#lg-gold)" strokeWidth="60" strokeLinejoin="miter" strokeMiterlimit="10" />
        </g>
        <path d="M256 222L290 256 256 290 222 256Z" fill="#061810" />
      </g>
      <path d="M0 256C0 38 38 0 256 0S512 38 512 256 474 512 256 512 0 474 0 256Z" fill="none" stroke="#D4AF37" strokeOpacity=".55" strokeWidth="2" transform="translate(1 1) scale(.9961)" />
    </svg>
  );
}

/** Palabra STACKS: Plus Jakarta Sans ExtraBold en marfil, tracking amplio y punto dorado final. */
export function Wordmark({ className = '', size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-baseline font-[800] uppercase leading-none tracking-[0.14em] text-[#FAF8F0] ${className}`}
      style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif", fontSize: size }}>
      STACKS<span aria-hidden className="ml-[0.12em] inline-block rounded-full bg-[#D4AF37]" style={{ width: size * 0.2, height: size * 0.2 }} />
    </span>
  );
}
