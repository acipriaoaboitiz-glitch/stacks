import { memo, useId } from 'react';
import type { AvatarId } from '../../store/cosmetics.ts';

/**
 * Emblemas vectoriales de los avatares VIP: sustituyen la letra inicial. Cada uno es un disco (viewBox 100×100) con acabado
 * metálico; sirven para el perfil, las mesas y la tienda. Sin emojis: solo SVG propio.
 */
export const AvatarEmblem = memo(function AvatarEmblem({ id, className = 'size-full' }: { id: AvatarId; className?: string }) {
  const u = useId().replace(/:/g, '');
  const g = (n: string): string => `url(#${u}-${n})`;
  return (
    <svg viewBox="0 0 100 100" shapeRendering="geometricPrecision" className={`block rounded-full ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${u}-gold`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF0B0" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#8a6410" /></linearGradient>
        <linearGradient id={`${u}-silver`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".5" stopColor="#b8c2cc" /><stop offset="1" stopColor="#5b6672" /></linearGradient>
        <linearGradient id={`${u}-jade`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6ee7b7" /><stop offset=".55" stopColor="#10b981" /><stop offset="1" stopColor="#064e3b" /></linearGradient>
        <radialGradient id={`${u}-night`} cx=".35" cy=".25" r="1"><stop offset="0" stopColor="#3b3270" /><stop offset="1" stopColor="#0b0a1f" /></radialGradient>
        <radialGradient id={`${u}-ink`} cx=".35" cy=".25" r="1"><stop offset="0" stopColor="#2b3442" /><stop offset="1" stopColor="#07090d" /></radialGradient>
        <radialGradient id={`${u}-sea`} cx=".4" cy=".2" r="1"><stop offset="0" stopColor="#2a7fb8" /><stop offset="1" stopColor="#06233d" /></radialGradient>
        <radialGradient id={`${u}-wine`} cx=".4" cy=".25" r="1"><stop offset="0" stopColor="#7a1f3a" /><stop offset="1" stopColor="#25060f" /></radialGradient>
        <radialGradient id={`${u}-forest`} cx=".4" cy=".25" r="1"><stop offset="0" stopColor="#0f6b4f" /><stop offset="1" stopColor="#031d15" /></radialGradient>
      </defs>
      {id === 'as_picas' && (
        <>
          <circle cx="50" cy="50" r="50" fill={g('ink')} />
          <circle cx="50" cy="50" r="46" fill="none" stroke={g('gold')} strokeWidth="2" />
          <path d="M50 16 C50 16 21 40 21 58 C21 70 32 76 41 70 C39 78 35 84 31 86 H69 C65 84 61 78 59 70 C68 76 79 70 79 58 C79 40 50 16 50 16Z" fill={g('silver')} stroke="#2b3442" strokeWidth="1.5" strokeLinejoin="round" />
          <text x="50" y="64" textAnchor="middle" fontFamily="Cinzel, Georgia, serif" fontWeight="900" fontSize="26" fill="#1f2937">A</text>
          <path d="M50 22 C46 30 34 42 31 52" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {id === 'rey_oros' && (
        <>
          <circle cx="50" cy="50" r="50" fill={g('forest')} />
          <circle cx="50" cy="55" r="33" fill={g('gold')} stroke="#6b4306" strokeWidth="2" />
          <circle cx="50" cy="55" r="27" fill="none" stroke="#6b4306" strokeWidth="1.4" strokeDasharray="2 3.4" />
          <circle cx="50" cy="55" r="19" fill="#b8860b" opacity=".55" />
          <path d="M31 50 L34 33 L42 43 L50 28 L58 43 L66 33 L69 50 Z" fill={g('gold')} stroke="#6b4306" strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="31" y="50" width="38" height="6" rx="2" fill={g('gold')} stroke="#6b4306" strokeWidth="1.6" />
          {[[34, 33], [50, 28], [66, 33]].map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="2.6" fill="#e11d48" stroke="#6b4306" strokeWidth=".8" />)}
          <path d="M50 66 L56 72 L50 78 L44 72Z" fill="#fff6c6" opacity=".9" />
        </>
      )}
      {id === 'tiburon' && (
        <>
          <circle cx="50" cy="50" r="50" fill={g('sea')} />
          <path d="M0 66 C14 60 26 72 40 66 S66 60 80 66 S94 64 100 62 V100 H0Z" fill="#0b4a73" opacity=".85" />
          <path d="M20 70 C36 66 46 44 54 16 C60 40 72 60 84 70 Z" fill={g('silver')} stroke="#334155" strokeWidth="2" strokeLinejoin="round" />
          <path d="M54 22 C52 40 46 56 36 66" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 76 C18 70 30 82 44 76 S70 70 84 76 S94 74 100 72" fill="none" stroke="#bfe6ff" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
          <path d="M10 88 C24 82 36 94 52 88 S78 82 92 88" fill="none" stroke="#7cc4f0" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        </>
      )}
      {id === 'lobo' && (
        <>
          <circle cx="50" cy="50" r="50" fill={g('night')} />
          <circle cx="62" cy="34" r="20" fill="#f1e8c8" opacity=".92" />
          <circle cx="68" cy="30" r="17" fill={g('night')} opacity=".0" />
          <path d="M24 80 L26 34 L40 50 L50 44 L60 50 L74 34 L76 80 L64 90 H36 Z" fill={g('silver')} stroke="#1f2937" strokeWidth="2" strokeLinejoin="round" />
          <path d="M30 44 L36 54 M70 44 L64 54" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 62 L46 66 M62 62 L54 66" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
          <path d="M44 78 L50 84 L56 78 L50 72 Z" fill="#111827" />
          <path d="M44 86 L50 92 L56 86" fill="none" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
        </>
      )}
      {id === 'eguzkilore' && (
        <>
          <circle cx="50" cy="50" r="50" fill={g('wine')} />
          <circle cx="50" cy="50" r="46" fill="none" stroke={g('gold')} strokeWidth="2" />
          {Array.from({ length: 16 }, (_, i) => <path key={i} transform={`rotate(${i * 22.5} 50 50)`} d="M50 9 L55 30 L50 36 L45 30 Z" fill={g('gold')} stroke="#6b4306" strokeWidth=".8" strokeLinejoin="round" />)}
          <circle cx="50" cy="50" r="19" fill={g('gold')} stroke="#6b4306" strokeWidth="2" />
          <circle cx="50" cy="50" r="12" fill="none" stroke="#6b4306" strokeWidth="1.4" />
          {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={50 + 7 * Math.cos((i * Math.PI) / 4)} cy={50 + 7 * Math.sin((i * Math.PI) / 4)} r="1.8" fill="#6b4306" />)}
        </>
      )}
      {id === 'dragon_imp' && (
        <>
          <circle cx="50" cy="50" r="50" fill={g('forest')} />
          <path d="M22 18 C30 26 34 30 38 34 M78 18 C70 26 66 30 62 34" fill="none" stroke={g('gold')} strokeWidth="5" strokeLinecap="round" />
          <path d="M50 90 L26 66 L30 44 L40 40 L50 44 L60 40 L70 44 L74 66 Z" fill={g('jade')} stroke="#032d22" strokeWidth="2" strokeLinejoin="round" />
          <path d="M30 44 L22 30 L38 38 Z M70 44 L78 30 L62 38 Z" fill={g('jade')} stroke="#032d22" strokeWidth="2" strokeLinejoin="round" />
          <path d="M36 54 L46 58 M64 54 L54 58" stroke="#fde68a" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M42 74 L46 70 M58 74 L54 70" stroke="#032d22" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M44 84 L46 90 L50 84 L54 90 L56 84" fill="none" stroke="#fff6c6" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="50" cy="50" r="48" fill="none" stroke={g('gold')} strokeWidth="2" />
        </>
      )}
      {id === 'corona' && (
        <>
          <circle cx="50" cy="50" r="50" fill={g('wine')} />
          <circle cx="50" cy="50" r="46" fill="none" stroke={g('gold')} strokeWidth="2.4" />
          <path d="M18 72 L22 34 L38 52 L50 22 L62 52 L78 34 L82 72 Z" fill={g('gold')} stroke="#6b4306" strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="18" y="70" width="64" height="11" rx="3" fill={g('gold')} stroke="#6b4306" strokeWidth="2" />
          {[[22, 34], [50, 22], [78, 34]].map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="4" fill="#fff6c6" stroke="#6b4306" strokeWidth="1.2" />)}
          {[[34, 76], [50, 76], [66, 76]].map(([x, y], i) => <circle key={`${x}`} cx={x} cy={y} r="3" fill={['#22d3ee', '#e11d48', '#34d399'][i]} stroke="#6b4306" strokeWidth=".8" />)}
          <path d="M50 30 L50 62" stroke="#fff6c6" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
});
