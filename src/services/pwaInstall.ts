import { useSyncExternalStore } from 'react';

/** Instalación de la app (PWA): captura `beforeinstallprompt` (Android / Chrome) para lanzar la instalación nativa en un toque. */
interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
let deferred: InstallEvent | null = null;
let installed = false;
const subs = new Set<() => void>();
const emit = (): void => subs.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; emit(); });
  window.addEventListener('appinstalled', () => { deferred = null; installed = true; emit(); });
}

export type InstallKind = 'installed' | 'native' | 'ios' | 'manual';
export function installKind(): InstallKind {
  if (typeof window === 'undefined') return 'manual';
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed || standalone) return 'installed';
  if (deferred) return 'native';
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios ? 'ios' : 'manual';
}
export const useInstallKind = (): InstallKind => useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l); }; }, installKind);
/** Lanza el cuadro de instalación nativo (solo Android / Chrome). */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const ev = deferred;
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  deferred = null;
  emit();
  return outcome === 'accepted';
}
