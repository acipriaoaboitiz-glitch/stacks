# ClubStacks (`STACKS`) — reglas invariables

Stack: React 19 + TypeScript + Vite + Tailwind 4 + Framer Motion + Web Audio + Supabase + Capacitor. Idioma de trabajo: español.

## Paleta y estética
- Fondo radial esmeralda 100 % liso, sin cuadrículas ni patrones: `radial-gradient(circle at 50% 35%, #0E3323 0%, #061810 55%, #030D09 100%)`.
- Oro cepillado `#D4AF37` / `#FCE38A`; obsidiana `#08110E`; paneles `bg-[#091511] border border-white/[0.08] rounded-2xl`.
- Mesas con marco de cuero cosido (`.table-leather`) y fieltro sin texto impreso.

## Tipografía e iconografía
- `Outfit` global con `tabular-nums`; wordmark `STACKS` centrado en `Unbounded`.
- Isotipo: "S" geométrica dorada suelta, sin marco cuadrado (`public/favicon.svg` transparente; iconos de app sobre `#061810` sólido).
- Cero emojis como iconos de interfaz: `lucide-react` (`strokeWidth={1.75}`) o SVG propios con `shapeRendering="geometricPrecision"`. El nombre `COME💩` es la única excepción.

## Arquitectura de partida
- Tres franjas rígidas: `Top HUD` (salir, marcador, reglas, audio) · mesa/tablero central 100 % despejado (sin carteles, botones ni bocadillos flotantes; el turno solo ilumina el anillo dorado del avatar) · dock inferior con `Action Rail` de altura fija.
- Todos los juegos usan `GameFrame` (`src/games/shared/`). Motores puros: `apply(estado, pid, acción) → estado | null`; online con `useSeating` + `useReplica` (el anfitrión manda, los bots solo corren en el anfitrión).
- Temporizadores solo con `gameTimeout/gameInterval` (`useGameTimers` los cancela al salir); salir siempre con `exitMatch`.
- Tableros en PC: tamaño por contenedor (`cqw/cqh`) con tope en px dividido entre `--z` (zoom de escritorio).

## Datos y rendimiento
- Supabase: prefijo estricto `stacks_`; jamás tocar `onlinemus`. Solo se escribe `supabase/schema.sql`; no se ejecuta SQL en el proyecto del usuario.
- Pruebas locales con `?local=1` (y `?as=Nombre`); nunca contra el Supabase real.
- Modales y drawers con `createPortal` (`components/ui/Portal.tsx`) en `fixed inset-0 z-50`. Jerarquía: carrusel `z-10` · header/categorías `z-20` · modales `z-50` · avisos `z-[60]` · cinemáticas `z-[70]`.
- 60 FPS: animar solo `transform` y `opacity`; sin `backdrop-filter` en móvil ni en `html.is-standalone`.

## Idiomas
- ES, EN, FR, DE (EU cae al español). Textos en `src/i18n/*`; bots `Jugador/Player/Joueur/Spieler N`.

## Flujo
- No ejecutar `npm install` sin permiso. El usuario hace los commits y los push.
- Verificar siempre con `npx tsc -b` y `npm run build` antes de dar algo por hecho.
