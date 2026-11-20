import type { Card } from '@mus/engine';
import { CardBackArt } from '../../../../components/cards/FrenchFace.tsx';
import { cardName } from '../game/describe.ts';
import { useSettings } from '../../../../store/settings.ts';

const CARD_ASSET_BASE = `${import.meta.env.BASE_URL}cards/`;

/**
 * Carta de la baraja de Fournier de 1878 (dominio público; ver public/cards/ATTRIBUTION.txt).
 * Con 8 reyes, un pequeño distintivo discreto avisa de que el 3 actúa como rey (R) y el 2 como as (A).
 */
export function CardFace({ card, eightKings = true }: { card: Card; eightKings?: boolean }) {
  const filename = `${String(card.rank).padStart(2, '0')}-${card.suit}.webp`;
  const { help } = useSettings();
  const eq = help && eightKings && card.rank === 3 ? 'R' : help && eightKings && card.rank === 2 ? 'A' : null;
  const meaning = eq === 'A' ? ' (cuenta como as)' : eq === 'R' ? ' (cuenta como rey)' : '';

  return (
    <span className="relative block h-full w-full">
      <img
        src={`${CARD_ASSET_BASE}${filename}`}
        className="card-svg"
        alt={`${cardName(card)}${meaning}`}
        draggable={false}
      />
    </span>
  );
}

export function CardBack() {
  return <span className="card-back block h-full w-full overflow-hidden" aria-hidden="true"><CardBackArt seal="STACKS" /></span>;
}
