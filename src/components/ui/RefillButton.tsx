import { Gift, Tv } from 'lucide-react';
import { AD_CHIPS, canClaimDaily, DAILY_CHIPS, useWallet, wallet } from '../../store/wallet.ts';

/** Recarga gratuita: bono diario o «ver un anuncio» (simulado; aquí se enchufa el SDK de anuncios). */
export function RefillButton({ compact = false }: { compact?: boolean }) {
  const w = useWallet();
  const daily = canClaimDaily(w);
  return (
    <button type="button" className={`btn btn--gold flex items-center justify-center gap-2 ${compact ? '' : 'w-full'}`}
      onClick={() => (daily ? wallet.claimDaily() : wallet.claimAd())}>
      {daily ? <Gift size={18} aria-hidden /> : <Tv size={18} aria-hidden />}
      {daily ? `Bono diario +${DAILY_CHIPS}` : `Ver anuncio +${AD_CHIPS}`}
    </button>
  );
}
