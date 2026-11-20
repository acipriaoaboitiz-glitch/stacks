import { memo } from 'react';
import { useFrame, type FrameId } from '../../store/cosmetics.ts';

/** Decoración vectorial de cada marco (viewBox 100×100; el avatar ocupa el círculo central de radio ≈ 39). */
function Art({ id }: { id: FrameId }) {
  switch (id) {
    case 'corona':
      return (
        <>
          <circle cx="50" cy="52" r="42" fill="none" stroke="url(#af-gold)" strokeWidth="4" />
          <circle cx="50" cy="52" r="38.5" fill="none" stroke="#fff6c6" strokeOpacity=".5" strokeWidth="1" />
          <path d="M28 20 L34 3 L42 14 L50 0 L58 14 L66 3 L72 20 Z" fill="url(#af-gold)" stroke="#6b4306" strokeWidth="1.4" strokeLinejoin="round" />
          {[34, 50, 66].map((x) => <circle key={x} cx={x} cy={x === 50 ? 8 : 9} r="2.2" fill="#e11d48" stroke="#6b4306" strokeWidth=".6" />)}
        </>
      );
    case 'llama':
      return (
        <>
          <circle cx="50" cy="52" r="41" fill="none" stroke="#ea580c" strokeWidth="3.5" />
          <circle cx="50" cy="52" r="39" fill="none" stroke="#fde68a" strokeOpacity=".7" strokeWidth="1" />
          {[-60, -36, -12, 12, 36, 60].map((a, i) => (
            <path key={a} transform={`rotate(${a} 50 52)`} d={`M44 12 C${44 - 4} ${4 + (i % 2) * 3} 50 ${-4 - (i % 2) * 4} 52 ${2 + (i % 2) * 2} C${54} ${-2} 58 4 56 12 Z`} fill="url(#af-fire)" />
          ))}
        </>
      );
    case 'diamante':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#af-ice)" strokeWidth="3.6" />
          {[[50, 7], [93, 50], [50, 93], [7, 50]].map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y! - 8} L${x! + 7} ${y} L${x} ${y! + 8} L${x! - 7} ${y} Z`} fill="url(#af-ice)" stroke="#0b3b66" strokeWidth="1" />
          ))}
          {[[20, 20], [80, 20], [80, 80], [20, 80]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#e0f2fe" />)}
        </>
      );
    case 'escudo':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#af-gold)" strokeWidth="3.6" />
          <circle cx="50" cy="50" r="38.6" fill="none" stroke="#fff6c6" strokeOpacity=".45" strokeWidth="1" />
          <path d="M38 84 H62 V92 Q50 99 38 92 Z" fill="url(#af-gold)" stroke="#6b4306" strokeWidth="1.2" />
          <path d="M44 86 H56" stroke="#6b4306" strokeWidth="1.4" strokeLinecap="round" />
        </>
      );
    case 'dragon':
      return (
        <>
          <circle cx="50" cy="52" r="41.5" fill="none" stroke="#059669" strokeWidth="4.4" />
          <circle cx="50" cy="52" r="41.5" fill="none" stroke="#6ee7b7" strokeWidth="1.4" strokeDasharray="3 4" />
          <path d="M30 18 C22 14 20 6 22 0 C28 4 36 8 42 14 Z M70 18 C78 14 80 6 78 0 C72 4 64 8 58 14 Z" fill="#10b981" stroke="#064e3b" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M44 94 L50 100 L56 94" fill="#10b981" stroke="#064e3b" strokeWidth="1.2" strokeLinejoin="round" />
        </>
      );
    case 'as':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#f6eed6" strokeWidth="4" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#B8860B" strokeWidth="1.2" strokeDasharray="1.5 3.5" />
          <g transform="translate(50 7)"><circle r="8" fill="url(#af-gold)" stroke="#6b4306" strokeWidth="1.2" /><circle r="4.6" fill="none" stroke="#6b4306" strokeWidth="1.1" /></g>
          {[[7, 50], [93, 50], [50, 93]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill="url(#af-gold)" stroke="#6b4306" strokeWidth=".8" />)}
        </>
      );
    case 'rey':
      return (
        <>
          <circle cx="50" cy="54" r="40.5" fill="none" stroke="url(#af-gold)" strokeWidth="4.4" />
          <circle cx="50" cy="54" r="37.8" fill="none" stroke="#7c3aed" strokeWidth="1.6" />
          <path d="M24 22 L27 4 L38 14 L50 -2 L62 14 L73 4 L76 22 Z" fill="url(#af-gold)" stroke="#6b4306" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="24" y="21" width="52" height="5" rx="2" fill="#7c3aed" stroke="#6b4306" strokeWidth="1" />
          {[[27, 4], [50, -2], [73, 4]].map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="2.4" fill="#fff6c6" stroke="#6b4306" strokeWidth=".6" />)}
          {[[8, 54], [92, 54], [50, 96]].map(([x, y]) => <path key={`${x}`} d={`M${x} ${y! - 4} l4 4 -4 4 -4 -4Z`} fill="url(#af-gold)" stroke="#6b4306" strokeWidth=".6" />)}
        </>
      );
    case 'hielo':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#af-ice)" strokeWidth="4" />
          <circle cx="50" cy="50" r="38.8" fill="none" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1" />
          {Array.from({ length: 12 }, (_, i) => <path key={i} transform={`rotate(${i * 30} 50 50)`} d={i % 2 ? 'M50 4 L53 12 L50 17 L47 12Z' : 'M50 -2 L55 10 L50 19 L45 10Z'} fill="url(#af-ice)" stroke="#0b3b66" strokeWidth=".7" strokeLinejoin="round" />)}
        </>
      );
    case 'laurel':
      return (
        <>
          <circle cx="50" cy="50" r="40.5" fill="none" stroke="url(#af-gold)" strokeWidth="2.4" />
          {Array.from({ length: 9 }, (_, i) => {
            const a = 120 + i * 15; const r = 43;
            const x = 50 + r * Math.cos((a * Math.PI) / 180); const y = 50 + r * Math.sin((a * Math.PI) / 180);
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx="7" ry="3.2" transform={`rotate(${a + 70} ${x} ${y})`} fill="url(#af-gold)" stroke="#6b4306" strokeWidth=".7" />
                <ellipse cx={100 - x} cy={y} rx="7" ry="3.2" transform={`rotate(${180 - a - 70} ${100 - x} ${y})`} fill="url(#af-gold)" stroke="#6b4306" strokeWidth=".7" />
              </g>
            );
          })}
          <path d="M42 96 L50 100 L58 96 L50 92Z" fill="#c62f2f" stroke="#6b4306" strokeWidth=".8" />
        </>
      );
    case 'fuegoesm':
      return (
        <>
          <circle cx="50" cy="52" r="41" fill="none" stroke="#059669" strokeWidth="3.5" />
          <circle cx="50" cy="52" r="39" fill="none" stroke="#a7f3d0" strokeOpacity=".7" strokeWidth="1" />
          {[-66, -44, -22, 0, 22, 44, 66].map((a, i) => (
            <path key={a} transform={`rotate(${a} 50 52)`} d={`M44 12 C${44 - 4} ${4 + (i % 2) * 3} 50 ${-6 - (i % 2) * 4} 52 ${2 + (i % 2) * 2} C54 -2 58 4 56 12 Z`} fill="url(#af-efire)" />
          ))}
        </>
      );
    case 'relampago':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#af-gold)" strokeWidth="3.6" />
          <circle cx="50" cy="50" r="38.8" fill="none" stroke="#fff6c6" strokeOpacity=".5" strokeWidth="1" />
          {[0, 90, 180, 270].map((a) => <path key={a} transform={`rotate(${a} 50 50)`} d="M53 -2 L44 14 L51 14 L46 26 L58 8 L51 8 Z" fill="#fde047" stroke="#7c5a06" strokeWidth="1" strokeLinejoin="round" />)}
        </>
      );
    case 'galaxia':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#af-galaxy)" strokeWidth="4.4" />
          <circle cx="50" cy="50" r="38.6" fill="none" stroke="#c4b5fd" strokeOpacity=".6" strokeWidth="1" />
          {[[16, 22], [86, 34], [78, 84], [12, 70], [50, 6]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="#fff" />)}
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="6s" repeatCount="indefinite" />
            <circle cx="50" cy="3" r="4.2" fill="#fde68a" stroke="#fff" strokeWidth="1" />
            <circle cx="50" cy="3" r="8" fill="#fde68a" opacity=".25" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="9s" repeatCount="indefinite" />
            <circle cx="97" cy="50" r="2.8" fill="#a78bfa" stroke="#fff" strokeWidth=".8" />
          </g>
        </>
      );
    default:
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#34d399" strokeWidth="3" />
          <circle cx="50" cy="50" r="39.2" fill="none" stroke="#a7f3d0" strokeOpacity=".5" strokeWidth="1" />
        </>
      );
  }
}

/** Marco del avatar equipado en la tienda (superpuesto, sin interceptar toques). Con `id` fijo sirve de vista previa. */
export const AvatarFrame = memo(function AvatarFrame({ id }: { id?: FrameId }) {
  const equipped = useFrame();
  const frame = id ?? equipped;
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" shapeRendering="geometricPrecision" className="pointer-events-none absolute left-1/2 top-1/2 z-[2] size-[128%] -translate-x-1/2 -translate-y-1/2 overflow-visible">
      <defs>
        <linearGradient id="af-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF0B0" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#8a6410" /></linearGradient>
        <linearGradient id="af-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e0f7ff" /><stop offset=".5" stopColor="#7dd3fc" /><stop offset="1" stopColor="#2563eb" /></linearGradient>
        <linearGradient id="af-efire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#047857" /><stop offset=".55" stopColor="#34d399" /><stop offset="1" stopColor="#ecfdf5" /></linearGradient>
        <linearGradient id="af-galaxy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0abfc" /><stop offset=".5" stopColor="#7c3aed" /><stop offset="1" stopColor="#1e1b4b" /></linearGradient>
        <linearGradient id="af-fire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#dc2626" /><stop offset=".55" stopColor="#f97316" /><stop offset="1" stopColor="#fde68a" /></linearGradient>
      </defs>
      <Art id={frame} />
    </svg>
  );
});
