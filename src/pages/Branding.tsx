import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { WORDMARK_FONTS, WordmarkText } from '../components/ui/WordmarkPicker.tsx';

/** Pantalla temporal para elegir tipografía e icono «S». Ruta: /#/branding */

const FONTS: { id: string; name: string; family: string; note: string }[] = [
  { id: 'F1', name: 'Outfit', family: "'Outfit', sans-serif", note: 'Geométrica moderna, fuerte en números' },
  { id: 'F2', name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", note: 'Fintech / gaming premium' },
  { id: 'F3', name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", note: 'Técnica, ideal para marcadores' },
  { id: 'F4', name: 'Syne', family: "'Syne', sans-serif", note: 'Personalidad única en títulos' },
  { id: 'F5', name: 'Chakra Petch', family: "'Chakra Petch', sans-serif", note: 'Gaming competitivo y afilado' },
  { id: 'F6', name: 'Kanit', family: "'Kanit', sans-serif", note: 'Compacta, deportiva' },
  { id: 'F7', name: 'Unbounded', family: "'Unbounded', sans-serif", note: 'Ancha, rotunda y visual' },
  { id: 'F8', name: 'Montserrat', family: "'Montserrat', sans-serif", note: 'Clásica y profesional' },
];

function FontCard({ f }: { f: (typeof FONTS)[number] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B2218] p-3" style={{ fontFamily: f.family }}>
      <div className="mb-2 flex items-baseline justify-between" style={{ fontFamily: 'system-ui' }}>
        <b className="text-[13px] text-amber-300">{f.id} · {f.name}</b>
      </div>
      <p className="text-[11px] text-stone-400" style={{ fontFamily: 'system-ui' }}>{f.note}</p>
      <h3 className="mt-2 text-[26px] font-extrabold leading-tight text-[#FAF8F0]">Brisca</h3>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full border border-amber-300/40 bg-black/30 px-3 py-1 text-[14px] font-bold tabular-nums text-amber-200">1.300 fichas</span>
        <span className="rounded-full bg-black/30 px-3 py-1 text-[12px] font-bold text-stone-200">Marcador 27/120</span>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-full bg-gradient-to-br from-amber-300 to-amber-500 px-4 py-2 text-[13px] font-extrabold text-amber-950">Pedir carta</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[13px] font-bold text-stone-100">Plantarse</span>
        <span className="rounded-full border border-emerald-400/50 bg-emerald-900/60 px-4 py-2 text-[13px] font-bold text-emerald-50">Igualar 20</span>
      </div>
      <p className="mt-3 text-[13px] font-semibold text-stone-300">Te toca: elige una carta</p>
    </div>
  );
}

// ─── Iconos «S» ──────────────────────────────────────────────────────────────────────────────────
const BG = '#061810';
const S_PATH = 'M340 190C340 130 172 130 172 206C172 282 340 238 340 316C340 392 172 384 172 322';
const SQ = 'M0 256C0 38 38 0 256 0S512 38 512 256 474 512 256 512 0 474 0 256Z';

function Defs({ k }: { k: string }) {
  return (
    <defs>
      <linearGradient id={`g${k}`} x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stopColor="#F5D061" /><stop offset="1" stopColor="#D4AF37" /></linearGradient>
      <linearGradient id={`d${k}`} x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stopColor="#D4AF37" /><stop offset="1" stopColor="#8E6A14" /></linearGradient>
      <clipPath id={`q${k}`}><path d={SQ} /></clipPath>
    </defs>
  );
}
const Base = ({ k, children, bg = BG }: { k: string; children: ReactNode; bg?: string }) => (
  <svg viewBox="0 0 512 512" width="100%" height="100%" aria-hidden>
    <Defs k={k} />
    <g clipPath={`url(#q${k})`}>
      <rect width="512" height="512" fill={bg} />
      {children}
    </g>
  </svg>
);

const ICONS: { id: string; name: string; render: (k: string) => ReactNode }[] = [
  { id: 'S01', name: 'Dos bloques en diagonal', render: (k) => (
    <Base k={k}><path d="M222 138H384L340 236H178Z" fill={`url(#g${k})`} /><path d="M172 276H334L290 374H128Z" fill={`url(#d${k})`} /></Base>) },
  { id: 'S02', name: 'Monolítica biselada', render: (k) => (
    <Base k={k}><path d="M178 132H352L392 172V214H328V196H206V238H340L384 282V350L344 392H166L124 350V312H190V330H316V288H172L128 244V176Z" fill={`url(#g${k})`} /></Base>) },
  { id: 'S03', name: 'Tres franjas escalonadas', render: (k) => (
    <Base k={k}><rect x="150" y="126" width="212" height="64" rx="10" fill={`url(#g${k})`} /><rect x="150" y="224" width="212" height="64" rx="10" fill={`url(#g${k})`} opacity=".88" /><rect x="150" y="322" width="212" height="64" rx="10" fill={`url(#d${k})`} />
      <rect x="150" y="126" width="62" height="162" rx="10" fill={`url(#g${k})`} /><rect x="300" y="224" width="62" height="162" rx="10" fill={`url(#d${k})`} /></Base>) },
  { id: 'S04', name: 'Moneda con S calada', render: (k) => (
    <Base k={k}><circle cx="256" cy="256" r="196" fill={`url(#g${k})`} /><circle cx="256" cy="256" r="176" fill="none" stroke="#8E6A14" strokeOpacity=".5" strokeWidth="4" /><path d={S_PATH} fill="none" stroke={BG} strokeWidth="54" strokeLinecap="round" /></Base>) },
  { id: 'S05', name: 'S con corte de rombo', render: (k) => (
    <Base k={k}><path d="M344 156H206V256H318V356H168" fill="none" stroke={`url(#g${k})`} strokeWidth="58" strokeLinejoin="miter" /><path d="M256 222L292 256 256 290 220 256Z" fill={BG} /></Base>) },
  { id: 'S06', name: 'Cinta plegada 3D', render: (k) => (
    <Base k={k}><path d="M344 176C344 124 176 124 176 200" fill="none" stroke={`url(#g${k})`} strokeWidth="54" strokeLinecap="butt" /><path d="M176 200C176 282 344 238 344 316" fill="none" stroke={`url(#d${k})`} strokeWidth="54" /><path d="M344 316C344 390 176 386 176 336" fill="none" stroke={`url(#g${k})`} strokeWidth="54" /></Base>) },
  { id: 'S07', name: 'Esport con puntas', render: (k) => (
    <Base k={k}><path d="M330 196C330 140 190 140 190 208C190 276 330 244 330 312C330 376 190 374 190 330" fill="none" stroke={`url(#g${k})`} strokeWidth="50" /><path d="M356 150L318 196 364 214Z M156 376L194 330 148 312Z" fill={`url(#g${k})`} /></Base>) },
  { id: 'S08', name: 'Dos curvas con corte', render: (k) => (
    <Base k={k}><path d={S_PATH} fill="none" stroke={`url(#g${k})`} strokeWidth="60" strokeLinecap="round" /><path d="M120 330L400 188" stroke={BG} strokeWidth="12" strokeLinecap="round" /></Base>) },
  { id: 'S09', name: 'Stencil dividida', render: (k) => (
    <Base k={k}><path d={S_PATH} fill="none" stroke={`url(#g${k})`} strokeWidth="62" strokeLinecap="butt" /><rect x="100" y="256" width="320" height="200" fill="#000" opacity=".28" style={{ mixBlendMode: 'multiply' }} /><rect x="100" y="140" width="320" height="10" fill={BG} /><rect x="100" y="250" width="320" height="12" fill={BG} /><rect x="100" y="362" width="320" height="10" fill={BG} /></Base>) },
  { id: 'S10', name: 'Dentro de una carta', render: (k) => (
    <Base k={k}><rect x="146" y="82" width="220" height="348" rx="46" fill="none" stroke={`url(#g${k})`} strokeWidth="14" /><path d="M318 204C318 160 206 160 206 214C206 268 318 240 318 296C318 350 206 346 206 308" fill="none" stroke={`url(#g${k})`} strokeWidth="38" strokeLinecap="round" /></Base>) },
  { id: 'S11', name: 'Club VIP elegante', render: (k) => (
    <Base k={k}><path d={S_PATH} fill="none" stroke={`url(#g${k})`} strokeWidth="76" strokeLinecap="butt" /><path d={S_PATH} fill="none" stroke={BG} strokeWidth="4" strokeLinecap="butt" opacity=".9" /><rect x="136" y="116" width="240" height="6" fill={`url(#g${k})`} opacity=".6" /><rect x="136" y="390" width="240" height="6" fill={`url(#g${k})`} opacity=".6" /></Base>) },
  { id: 'S12', name: 'S calada sobre oro', render: (k) => (
    <Base k={k} bg={`url(#g${k})`}><path d={S_PATH} fill="none" stroke={BG} strokeWidth="62" strokeLinecap="round" /></Base>) },
];

function IconCard({ ic }: { ic: (typeof ICONS)[number] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B2218] p-3">
      <b className="text-[13px] text-amber-300">{ic.id} · {ic.name}</b>
      <div className="mt-3 flex items-end gap-4">
        <div style={{ width: 96, height: 96 }}>{ic.render(`${ic.id}a`)}</div>
        <div className="grid justify-items-center gap-1">
          {/* Android / Play Store: squircle con margen de seguridad maskable */}
          <div className="grid place-items-center overflow-hidden" style={{ width: 56, height: 56, borderRadius: '24%', background: BG, boxShadow: '0 2px 6px rgba(0,0,0,.5)' }}>
            <div style={{ width: '80%', height: '80%' }}>{ic.render(`${ic.id}b`)}</div>
          </div>
          <span className="text-[10px] text-stone-300">Stacks</span>
        </div>
        <div className="grid gap-1">
          {/* pestaña del navegador */}
          <div className="flex items-center gap-1.5 rounded-t-md bg-[#1f2a25] px-2 py-1 text-[11px] text-stone-200" style={{ fontFamily: 'system-ui' }}>
            <div style={{ width: 16, height: 16 }}>{ic.render(`${ic.id}c`)}</div>
            <span>Stacks</span>
          </div>
          <span className="text-[10px] text-stone-500">16×16</span>
        </div>
      </div>
    </div>
  );
}

export default function Branding() {
  const nav = useNavigate();
  return (
    <div className="min-h-dvh overflow-y-auto px-4 py-5 text-stone-100" style={{ background: '#071A12', position: 'fixed', inset: 0 }}>
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => nav('/')} className="mb-3 rounded-full border border-white/15 px-3 py-1 text-[12px] font-bold">← Volver</button>
        <h1 className="mb-1 text-xl font-extrabold text-amber-300">Elegir fuente e icono</h1>
        <p className="mb-5 text-[12px] text-stone-400">Dime la fuente (F1–F8) y el icono (S01–S12) que prefieres.</p>
        <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-widest text-amber-200/80">A · Tipografías</h2>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{FONTS.map((f) => <FontCard key={f.id} f={f} />)}</div>
        <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-widest text-amber-200/80">A2 · Palabra STACKS (12 fuentes)</h2>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WORDMARK_FONTS.map((f, i) => (
            <div key={f.name} className="rounded-2xl border border-white/10 bg-[#0B2218] p-3">
              <b className="text-[12px] text-amber-300">{String(i + 1).padStart(2, '0')} · {f.name}</b>
              <div className="mt-2 grid gap-2"><WordmarkText i={i} gold={false} size={26} /><WordmarkText i={i} gold size={26} /></div>
            </div>
          ))}
        </div>
        <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-widest text-amber-200/80">B · Iconos «S»</h2>
        <div className="grid gap-3 pb-10 sm:grid-cols-2 lg:grid-cols-3">{ICONS.map((ic) => <IconCard key={ic.id} ic={ic} />)}</div>
      </div>
    </div>
  );
}
