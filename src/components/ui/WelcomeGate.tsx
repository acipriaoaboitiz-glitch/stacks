import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Logo, Wordmark } from './Logo.tsx';
import { ProfileEditor } from './ProfileEditor.tsx';
import { saveProfile, TITLES, useProfile } from '../../store/profile.ts';
import { APP_NAME } from '../../config.ts';

/** Si no hay perfil guardado, pide apodo, título y avatar/foto antes de mostrar el lobby. */
export function WelcomeGate({ children }: { children: ReactNode }) {
  const profile = useProfile();
  if (profile) return <>{children}</>;
  return (
    // El body tiene overflow oculto: el gate scrollea por sí mismo (fixed + overflow-y-auto) para que en móviles bajos o con teclado se llegue siempre al botón.
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
    <div className="grid min-h-full place-items-center px-4 py-6" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-3xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,.65)]">
        <div className="mb-5 grid justify-items-center gap-4 text-center">
          <Logo size="lg" />
          <h1 aria-label={APP_NAME}><Wordmark size={26} /></h1>
          <p className="text-[12px] text-stone-400">Crea tu perfil para entrar a la mesa</p>
        </div>
        <ProfileEditor initial={{ name: '', title: TITLES[3], avatar: 0, photo: null }} submitLabel="Entrar al club" onSubmit={saveProfile} />
      </motion.div>
    </div>
    </div>
  );
}
