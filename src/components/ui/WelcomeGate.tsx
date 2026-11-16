import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo.tsx';
import { ProfileEditor } from './ProfileEditor.tsx';
import { saveProfile, TITLES, useProfile } from '../../store/profile.ts';
import { APP_NAME } from '../../config.ts';

/** Si no hay perfil guardado, pide apodo, título y avatar/foto antes de mostrar el lobby. */
export function WelcomeGate({ children }: { children: ReactNode }) {
  const profile = useProfile();
  if (profile) return <>{children}</>;
  return (
    <div className="grid min-h-dvh place-items-center overflow-y-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-3xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,.65)] backdrop-blur-xl">
        <div className="mb-4 grid justify-items-center text-center">
          <Logo size={72} />
          <h1 className="gold-text font-[var(--font-display)] text-3xl font-bold">{APP_NAME}</h1>
          <p className="mt-1 text-[12px] text-stone-400">Crea tu perfil para entrar a la mesa</p>
        </div>
        <ProfileEditor initial={{ name: '', title: TITLES[3], avatar: 0, photo: null }} submitLabel="Entrar al club" onSubmit={saveProfile} />
      </motion.div>
    </div>
  );
}
