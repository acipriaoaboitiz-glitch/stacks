import { SUIT_LABEL, type SpanishCard } from '../../engine/deck.ts';
import { CardBack, CardFace } from '../mus/app/components/CardFace.tsx';

/** Mazo con la carta de la pinta (triunfo) bien grande, sobresaliendo por el lateral del mazo. */
export function TrumpPile({ trump, count }: { trump: SpanishCard; count: number }) {
  const size = 'w-[48px] h-[72px] sm:w-[60px] sm:h-[90px] lg:w-[74px] lg:h-[112px]';
  return (
    <div className="absolute left-[clamp(6px,2vw,14px)] top-[clamp(6px,2vw,14px)] z-10 flex items-center gap-1.5" aria-label={`Quedan ${count} cartas; triunfo ${SUIT_LABEL[trump.suit]}`}>
      <div className="relative h-[72px] w-36 sm:h-[90px] sm:w-44 lg:h-[112px]">
        <div className={`absolute left-0 top-0 ${size} translate-x-14 rotate-90 overflow-hidden rounded-[6px] shadow-[0_4px_10px_rgba(0,0,0,.55)] ring-2 ring-amber-300/80 sm:translate-x-20 lg:translate-x-24`}>
          <CardFace card={trump as never} />
        </div>
        {[2, 1, 0].map((k) => (
          <span key={k} className={`absolute left-0 top-0 z-10 ${size} overflow-hidden rounded-[6px] shadow-[0_4px_8px_rgba(0,0,0,.4)]`} style={{ transform: `translate(${k * 2}px, ${-k * 2}px)` }}><CardBack /></span>
        ))}
        <span className="absolute -bottom-4 left-0 z-10 font-mono text-[10px] text-amber-200/80">{count}</span>
      </div>
    </div>
  );
}
