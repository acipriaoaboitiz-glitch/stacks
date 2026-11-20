import { Club, Diamond, Heart, Spade } from 'lucide-react';
import { FRENCH_RANK_LABEL, type FrenchRank, type FrenchSuit, type SpanishSuit } from '../../engine/deck.ts';

/** Palo español dibujado a mano (24×24): oros, copas, espadas y bastos. */
export function SpanishGlyph({ suit }: { suit: SpanishSuit }) {
  switch (suit) {
    case 'oros': return <svg viewBox="0 0 24 24" className="size-[1.35em]" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" /><circle cx="12" cy="12" r="6.2" fill="none" stroke="#fffdf5" strokeWidth="1.8" /></svg>;
    case 'copas': return <svg viewBox="0 0 24 24" className="size-[1.35em]" aria-hidden="true"><path d="M3 3h18c0 8-3 12-8 12v4h5v2H6v-2h5v-4C6 15 3 11 3 3Z" fill="currentColor" /></svg>;
    case 'espadas': return <svg viewBox="0 0 24 24" className="size-[1.35em]" aria-hidden="true"><path d="M12 1l3.2 12H8.8L12 1Z" fill="currentColor" /><rect x="5" y="13" width="14" height="3" rx="1.5" fill="currentColor" /><rect x="10.6" y="16" width="2.8" height="7" rx="1.2" fill="currentColor" /></svg>;
    case 'bastos': return <svg viewBox="0 0 24 24" className="size-[1.35em]" aria-hidden="true"><path d="M9 3a4 4 0 0 1 6 0c1.6 2 .6 4-.9 5.2L13.6 22h-3.2L9.9 8.2C8.4 7 7.4 5 9 3Z" fill="currentColor" /></svg>;
  }
}

const SPANISH_COLOR: Record<SpanishSuit, string> = { oros: '#a8740a', copas: '#c3162c', espadas: '#1d4fbf', bastos: '#0a7a4c' };

/**
 * Índice de esquina grande y de alto contraste (arriba a la izquierda, primer tercio de la carta). Las manos en abanico y las
 * cartas solapadas siguen siendo legibles en móvil porque solo queda a la vista esa esquina.
 */
export function CornerIndex({ card }: { card: { deck?: 'es' | 'fr'; rank: number; suit: string } }) {
  const french = card.deck === 'fr' || ['picas', 'corazones', 'treboles', 'diamantes'].includes(card.suit);
  let color: string; let label: string; let glyph: React.ReactNode;
  if (french) {
    const suit = card.suit as FrenchSuit;
    color = suit === 'corazones' || suit === 'diamantes' ? '#b3141c' : '#0f1218';
    label = FRENCH_RANK_LABEL(card.rank as FrenchRank);
    const Icon = { picas: Spade, corazones: Heart, treboles: Club, diamantes: Diamond }[suit];
    glyph = <Icon className="size-[1.28em]" fill="currentColor" strokeWidth={0} aria-hidden />;
  } else {
    const suit = card.suit as SpanishSuit;
    color = SPANISH_COLOR[suit] ?? '#0f1218';
    label = String(card.rank);
    glyph = <SpanishGlyph suit={suit} />;
  }
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-[5%] top-[3%] z-[3] flex flex-col items-center gap-[1px] text-base font-black leading-none tracking-tight sm:text-xl" style={{ color, textShadow: '0 0 2px #fffdf5, 0 0 3px #fffdf5, 0 0 5px #fffdf5', filter: 'drop-shadow(0 0 1px #fffdf5)' }}>
      <span className="tabular-nums">{label}</span>
      {glyph}
    </span>
  );
}
