import { useEffect, useRef } from 'react';

/**
 * Botón/gesto «Atrás» de Android (y del navegador): en vez de salir de golpe, cierra primero el modal abierto y, si no hay ninguno,
 * pide confirmación antes de abandonar una partida. Los consumidores registran un manejador mientras están activos (pila LIFO).
 *  · En el navegador/WebView se apoya en `history` (una entrada «trampa» que `popstate` consume).
 *  · En Capacitor con `@capacitor/app` se usa su evento `backButton` (detección en tiempo de ejecución, sin dependencia obligatoria).
 */
const stack: { id: number; fn: () => void }[] = [];
let nextId = 1;
let armed = false;
let ignoreUntil = 0; // los popstate provocados por nuestro propio history.back() se ignoran un instante
let disarmTimer = 0;

const arm = (): void => {
  if (armed) return;
  try { window.history.pushState({ stacksBack: true }, ''); armed = true; } catch { /* sin history */ }
};
const disarm = (): void => {
  if (!armed) return;
  armed = false;
  ignoreUntil = Date.now() + 250;
  try { window.history.back(); } catch { ignoreUntil = 0; }
};

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (Date.now() < ignoreUntil) return;
    const top = stack[stack.length - 1];
    if (!top) { armed = false; return; }
    armed = false; // el navegador consumió la entrada trampa
    top.fn();
    window.setTimeout(() => { if (stack.length) arm(); }, 0);
  });
}

interface AppPlugin { addListener?: (e: 'backButton', cb: (ev: { canGoBack: boolean }) => void) => unknown; exitApp?: () => void }
const nativeApp = (): AppPlugin | null => {
  try { return (window as unknown as { Capacitor?: { Plugins?: { App?: AppPlugin } } }).Capacitor?.Plugins?.App ?? null; } catch { return null; }
};
const native = typeof window !== 'undefined' ? nativeApp() : null;
if (native?.addListener) {
  native.addListener('backButton', ({ canGoBack }) => {
    const top = stack[stack.length - 1];
    if (top) { top.fn(); return; }
    if (canGoBack) window.history.back(); else native.exitApp?.();
  });
}

/** Registra un manejador de «Atrás» (el último registrado tiene prioridad). Devuelve la función que lo quita. */
export function pushBack(fn: () => void): () => void {
  const entry = { id: nextId++, fn };
  stack.push(entry);
  window.clearTimeout(disarmTimer); // StrictMode / cambios de pantalla: desmontar y montar seguidos no deben tocar el historial
  if (!native) arm();
  return () => {
    const i = stack.findIndex((e) => e.id === entry.id);
    if (i >= 0) stack.splice(i, 1);
    if (!native && stack.length === 0) { window.clearTimeout(disarmTimer); disarmTimer = window.setTimeout(() => { if (stack.length === 0) disarm(); }, 80); }
  };
}

/** Mientras `active` sea true, «Atrás» llama a `onClose` (cerrar un modal, pedir confirmación…). */
export function useBackClose(active: boolean, onClose: () => void): void {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!active) return;
    return pushBack(() => ref.current());
  }, [active]);
}
