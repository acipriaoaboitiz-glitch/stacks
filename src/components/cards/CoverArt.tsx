import { PieceShapes } from '../../games/ajedrez/Pieces.tsx';
import { CupGroup, IsoDie } from '../../games/mentiroso/Dice.tsx';
import { Body2 } from './TableArt2.tsx';

/**
 * Portadas 2.5D de los juegos de mesa del lobby (cuadro 150×150): materiales con degradados, bisel, brillo especular y sombra de
 * contacto. Se incluyen dentro del <svg> de `TableArt`, que ya aporta los degradados `t2-*` y `ta-*`.
 */
export const COVER = new Set(['flota', 'parchis', 'domino', 'ajedrez', 'damas', 'buscaminas', 'mentiroso', 'tres', 'cuatro', 'mahjong', 'game2048', 'sudoku']);

export function CoverDefs() {
  const pips = [['#ff6b7e', '#b3122a', '#4d0711'], ['#4fe0a6', '#0f8a5c', '#053a27'], ['#7fa8ff', '#1d4fbf', '#0a1f5c'], ['#ffd36b', '#d98a0b', '#6b3d02'], ['#c79bff', '#7a3fc2', '#2f1160'], ['#4a4a4a', '#141414', '#000']];
  return (
    <defs>
      <linearGradient id="cv-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EEF3F6" /><stop offset=".45" stopColor="#9aa7b0" /><stop offset="1" stopColor="#4c5861" /></linearGradient>
      <linearGradient id="cv-steeld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9c4cb" /><stop offset=".5" stopColor="#6c7a84" /><stop offset="1" stopColor="#2f3a42" /></linearGradient>
      <linearGradient id="cv-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".38" /><stop offset=".55" stopColor="#fff" stopOpacity="0" /></linearGradient>
      <radialGradient id="cv-sweepbg" cx=".5" cy=".5" r=".75"><stop offset="0" stopColor="#0f5a42" /><stop offset=".6" stopColor="#07261c" /><stop offset="1" stopColor="#02100b" /></radialGradient>
      <linearGradient id="cv-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3fe0a8" stopOpacity=".6" /><stop offset="1" stopColor="#3fe0a8" stopOpacity="0" /></linearGradient>
      <linearGradient id="cv-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d8c996" /><stop offset="1" stopColor="#8d7c4a" /></linearGradient>
      <radialGradient id="cv-ball" cx=".34" cy=".28" r=".85"><stop offset="0" stopColor="#8d99a2" /><stop offset=".45" stopColor="#2b353c" /><stop offset="1" stopColor="#0a0e11" /></radialGradient>
      <radialGradient id="cv-ob" cx=".34" cy=".28" r=".85"><stop offset="0" stopColor="#5b625f" /><stop offset=".5" stopColor="#171c1a" /><stop offset="1" stopColor="#040605" /></radialGradient>
      <radialGradient id="cv-felt" cx=".5" cy=".5" r=".6"><stop offset="0" stopColor="#14684c" /><stop offset="1" stopColor="#06281d" /></radialGradient>
      {pips.map(([hi, mid, lo], i) => <radialGradient key={i} id={`cv-p${i + 1}`} cx=".38" cy=".34" r=".8"><stop offset="0" stopColor={hi} /><stop offset=".6" stopColor={mid} /><stop offset="1" stopColor={lo} /></radialGradient>)}
    </defs>
  );
}

const Shadow = ({ y = 136, rx = 56 }: { y?: number; rx?: number }) => <ellipse cx="75" cy={y} rx={rx} ry="7" fill="rgba(0,0,0,.55)" />;
const Gloss = ({ x, y, w, h, r }: { x: number; y: number; w: number; h: number; r: number }) => <rect x={x} y={y} width={w} height={h} rx={r} fill="url(#cv-gloss)" opacity=".55" pointerEvents="none" />;

/** Destructor naval en acero (origen arriba-izquierda, 90 de largo). */
function Destroyer({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke="#1b232a" strokeLinejoin="round">
      <ellipse cx="45" cy="36" rx="46" ry="4.5" fill="#000" opacity=".4" stroke="none" />
      <path d="M0 12 H88 L74 31 H12 Q0 29 0 20 Z" fill="url(#cv-steel)" strokeWidth="1.8" />
      <path d="M5 26 H72" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M4 15 H84" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" fill="none" />
      <rect x="28" y="3" width="28" height="10" rx="3" fill="url(#cv-steeld)" strokeWidth="1.4" />
      <rect x="36" y="-5" width="13" height="9" rx="2.5" fill="url(#cv-steeld)" strokeWidth="1.4" />
      <path d="M42.5 -5 V-17 M37 -12 H48" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <rect x="58" y="0" width="7" height="13" rx="2" fill="#2f3a42" strokeWidth="1.2" />
      {[[16, 9], [76, 9]].map(([cx, cy]) => <g key={cx}><circle cx={cx} cy={cy} r="5.2" fill="#D4AF37" strokeWidth="1.2" /><rect x={cx} y={cy! - 1.6} width="11" height="3.2" rx="1.6" fill="#2f3a42" strokeWidth=".8" transform={cx === 16 ? `rotate(180 ${cx} ${cy})` : undefined} /></g>)}
    </g>
  );
}

function Pawn({ x, y, fill, s = 1 }: { x: number; y: number; fill: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="7" rx="7.5" ry="2.8" fill="rgba(0,0,0,.55)" />
      <ellipse cx="0" cy="3.5" rx="7" ry="3.4" fill="#000" opacity=".35" />
      <circle cx="0" cy="-1" r="7" fill={`url(#${fill})`} stroke="#000" strokeOpacity=".35" strokeWidth=".8" />
      <circle cx="-2.4" cy="-3.6" r="2.2" fill="#fff" opacity=".55" />
    </g>
  );
}

function CTile({ x, y, r, a, b }: { x: number; y: number; r: number; a: number; b: number }) {
  const P: Record<string, [number, number]> = { tl: [14, 14], tr: [36, 14], ml: [14, 25], mr: [36, 25], c: [25, 25], bl: [14, 36], br: [36, 36] };
  const PIPS: Record<number, string[]> = { 1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'] };
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(.8) translate(-50 -25)`} style={{ filter: 'drop-shadow(0 7px 5px rgba(0,0,0,.6))' }}>
      <rect x="4" y="5" width="98" height="48" rx="7" fill="url(#cv-edge)" />
      <rect x="1" y="1" width="98" height="48" rx="7" fill="url(#ta-ivory)" stroke="#8B7A45" strokeWidth="1" />
      <rect x="2.5" y="2.5" width="95" height="45" rx="5.5" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".8" />
      <rect x="3" y="3" width="94" height="20" rx="5" fill="url(#cv-gloss)" opacity=".7" />
      <rect x="48.8" y="7" width="2.6" height="36" rx="1.3" fill="url(#ta-gold)" />
      <circle cx="50" cy="25" r="3.6" fill="url(#ta-hub)" stroke="#6b4a08" strokeWidth=".6" />
      {[[a, 0], [b, 50]].map(([n, ox]) => (PIPS[n!] ?? []).map((k) => (
        <g key={`${ox}${k}`}><circle cx={P[k]![0] + ox! + .6} cy={P[k]![1] + .9} r="5.8" fill="#fff" opacity=".8" /><circle cx={P[k]![0] + ox!} cy={P[k]![1]} r="5.2" fill={`url(#cv-p${n})`} /></g>
      )))}
    </g>
  );
}

function Disc({ x, y, fill, k }: { x: number; y: number; fill: string; k?: boolean }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 6} rx="8.4" ry="3" fill="rgba(0,0,0,.55)" />
      <ellipse cx={x} cy={y + 3.2} rx="8.4" ry="4.2" fill="#000" opacity=".4" />
      <ellipse cx={x} cy={y + 1.6} rx="8.4" ry="4.4" fill={fill === 'gold' ? '#7a5a0c' : '#e5dcc0'} />
      <ellipse cx={x} cy={y - 1} rx="8.4" ry="4.4" fill={fill === 'gold' ? 'url(#t2-dg)' : 'url(#t2-di)'} stroke="#000" strokeOpacity=".3" strokeWidth=".6" />
      <ellipse cx={x} cy={y - 1} rx="5.2" ry="2.5" fill="none" stroke="#000" strokeOpacity=".25" strokeWidth=".8" />
      {k && <path d={`M${x - 4.4} ${y + .6} l-1.2 -5 3 2.2 2.6 -3.6 2.6 3.6 3 -2.2 -1.2 5Z`} fill="#4a3204" opacity=".9" />}
    </g>
  );
}

export function CoverBody({ id }: { id: string }) {
  switch (id) {
    case 'flota': {
      const sx = (a: number, r: number) => 75 + r * Math.cos((a * Math.PI) / 180);
      const sy = (a: number, r: number) => 75 + r * Math.sin((a * Math.PI) / 180);
      return (
        <g>
          <Shadow />
          <rect x="16" y="16" width="118" height="118" rx="16" fill="url(#cv-sweepbg)" stroke="url(#ta-gold)" strokeWidth="2.2" />
          {[52, 38, 24, 10].map((r) => <circle key={r} cx="75" cy="75" r={r} fill="none" stroke="#D4AF37" strokeOpacity=".28" strokeWidth="1" />)}
          {[1, 2, 3, 4, 5, 6].map((i) => <g key={i}><line x1={16 + i * 16.9} y1="22" x2={16 + i * 16.9} y2="128" stroke="#3fe0a8" strokeOpacity=".2" strokeWidth=".8" /><line x1="22" y1={16 + i * 16.9} x2="128" y2={16 + i * 16.9} stroke="#3fe0a8" strokeOpacity=".2" strokeWidth=".8" /></g>)}
          <path d={`M75 75 L${sx(-75, 58)} ${sy(-75, 58)} A58 58 0 0 1 ${sx(-20, 58)} ${sy(-20, 58)} Z`} fill="#3fe0a8" opacity=".22" />
          <path d={`M75 75 L${sx(-20, 58)} ${sy(-20, 58)}`} stroke="#7dffd0" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="75" cy="75" r="2.6" fill="#7dffd0" />
          <Destroyer x={30} y={92} s={0.95} />
          <g transform="translate(99 50)" fill="none" stroke="#FCE38A" strokeWidth="1.5" strokeLinecap="round"><circle r="13" /><circle r="5" strokeOpacity=".9" /><path d="M-19 0H-8M8 0H19M0 -19V-8M0 8V19" /><circle r="13" stroke="#FCE38A" strokeOpacity=".25" strokeWidth="5" /></g>
          <g transform="translate(46 58)"><circle r="6.6" fill="#b91c1c" stroke="#FCE38A" strokeWidth="1.8" /><path d="M-3 -3L3 3M3 -3L-3 3" stroke="#FFF0B0" strokeWidth="1.8" strokeLinecap="round" /><circle r="11" fill="none" stroke="#ef4444" strokeOpacity=".4" strokeWidth="1.4" /></g>
          <g transform="translate(112 100)"><circle r="5.4" fill="none" stroke="#38bdf8" strokeWidth="2.2" /><circle r="10" fill="none" stroke="#38bdf8" strokeOpacity=".4" strokeWidth="1.2" /></g>
          <Gloss x={18} y={18} w={114} h={52} r={14} />
        </g>
      );
    }
    case 'parchis': {
      const cols = ['t2-r', 't2-b', 't2-y', 't2-g'];
      const house: [number, number][] = [[-52, -52], [18, -52], [18, 18], [-52, 18]];
      return (
        <g>
          <Shadow y={138} />
          <g transform="translate(75 74) scale(1 .76)">
            <rect x="-62" y="-62" width="124" height="124" rx="12" fill="url(#t2-wood)" stroke="url(#t2-gold)" strokeWidth="2.4" />
            <rect x="-56" y="-56" width="112" height="112" rx="8" fill="#1c120a" />
            {house.map(([x, y], i) => (
              <g key={i}><rect x={x} y={y} width="34" height="34" rx="7" fill={`url(#${cols[i]})`} stroke="#000" strokeOpacity=".4" /><rect x={x + 6} y={y + 6} width="22" height="22" rx="5" fill="#000" opacity=".25" /></g>
            ))}
            <rect x="-17" y="-56" width="34" height="112" rx="3" fill="url(#t2-ivory)" />
            <rect x="-56" y="-17" width="112" height="34" rx="3" fill="url(#t2-ivory)" />
            {[-5.7, 5.7].map((v) => <g key={v}><line x1={v} y1="-56" x2={v} y2="-17" stroke="#8a7a55" strokeWidth=".6" /><line x1={v} y1="17" x2={v} y2="56" stroke="#8a7a55" strokeWidth=".6" /><line x1="-56" y1={v} x2="-17" y2={v} stroke="#8a7a55" strokeWidth=".6" /><line x1="17" y1={v} x2="56" y2={v} stroke="#8a7a55" strokeWidth=".6" /></g>)}
            {[0, 1, 2, 3, 4].map((i) => <g key={i}><line x1="-17" y1={-56 + i * 7.8} x2="17" y2={-56 + i * 7.8} stroke="#8a7a55" strokeWidth=".5" /><line x1="-17" y1={17 + i * 7.8} x2="17" y2={17 + i * 7.8} stroke="#8a7a55" strokeWidth=".5" /><line x1={-56 + i * 7.8} y1="-17" x2={-56 + i * 7.8} y2="17" stroke="#8a7a55" strokeWidth=".5" /><line x1={17 + i * 7.8} y1="-17" x2={17 + i * 7.8} y2="17" stroke="#8a7a55" strokeWidth=".5" /></g>)}
            <rect x="-5.7" y="-56" width="11.4" height="39" fill="url(#t2-b)" opacity=".85" /><rect x="-5.7" y="17" width="11.4" height="39" fill="url(#t2-g)" opacity=".85" />
            <rect x="-56" y="-5.7" width="39" height="11.4" fill="url(#t2-r)" opacity=".85" /><rect x="17" y="-5.7" width="39" height="11.4" fill="url(#t2-y)" opacity=".85" />
            <polygon points="-17,-17 17,-17 0,0" fill="#1D4FBF" /><polygon points="-17,17 17,17 0,0" fill="#0a8a5c" /><polygon points="-17,-17 -17,17 0,0" fill="#C3162C" /><polygon points="17,-17 17,17 0,0" fill="#E0A21A" />
            <polygon points="0,-9 2.6,-3 9,-3 3.8,1 5.8,7 0,3.4 -5.8,7 -3.8,1 -9,-3 -2.6,-3" fill="url(#t2-gold)" />
          </g>
          <Pawn x={40} y={50} fill="t2-r" s={1.15} /><Pawn x={110} y={50} fill="t2-b" s={1.15} /><Pawn x={110} y={100} fill="t2-y" s={1.15} /><Pawn x={50} y={98} fill="t2-g" s={1.15} /><Pawn x={75} y={60} fill="t2-r" />
          <g transform="translate(112 112) scale(.5) rotate(8) translate(-50 -50)" style={{ filter: 'drop-shadow(0 5px 4px rgba(0,0,0,.55))' }}><IsoDie face={5} /></g>
        </g>
      );
    }
    case 'domino':
      return (
        <g>
          <ellipse cx="75" cy="130" rx="60" ry="9" fill="rgba(0,0,0,.55)" />
          <CTile x={50} y={96} r={-22} a={6} b={4} />
          <CTile x={100} y={98} r={16} a={3} b={5} />
          <CTile x={76} y={50} r={-4} a={6} b={6} />
        </g>
      );
    case 'ajedrez':
      return (
        <g>
          <Shadow y={138} />
          <g transform="translate(75 96) scale(1 .5)">
            <rect x="-64" y="-64" width="128" height="128" rx="10" fill="url(#t2-wood)" stroke="url(#t2-gold)" strokeWidth="3" />
            {Array.from({ length: 64 }, (_, i) => { const c = i % 8; const r = Math.floor(i / 8); return <rect key={i} x={-56 + c * 14} y={-56 + r * 14} width="14" height="14" fill={(r + c) % 2 ? 'url(#t2-walnut)' : 'url(#t2-ivory)'} />; })}
          </g>
          <g transform="translate(10 10) scale(1.75)"><PieceShapes kind="k" side={0} /></g>
          <g transform="translate(68 28) scale(1.45)"><PieceShapes kind="n" side={1} /></g>
          <Gloss x={14} y={60} w={122} h={30} r={8} />
        </g>
      );
    case 'damas':
      return (
        <g>
          <Shadow y={138} />
          <g transform="translate(75 92) scale(1 .56)">
            <rect x="-62" y="-62" width="124" height="124" rx="10" fill="url(#t2-wood)" stroke="url(#t2-gold)" strokeWidth="3" />
            {Array.from({ length: 36 }, (_, i) => { const c = i % 6; const r = Math.floor(i / 6); return <rect key={i} x={-54 + c * 18} y={-54 + r * 18} width="18" height="18" fill={(r + c) % 2 ? 'url(#t2-marble)' : '#c9a26b'} />; })}
          </g>
          <Disc x={34} y={84} fill="ivory" /><Disc x={58} y={74} fill="gold" /><Disc x={118} y={86} fill="ivory" /><Disc x={96} y={74} fill="gold" />
          <g transform="translate(0 -6) scale(1.5) translate(-25 -14)"><Disc x={75} y={50} fill="gold" k /></g>
          <g transform="translate(0 -4) scale(1.5) translate(-52 -22)"><Disc x={100} y={64} fill="ivory" k /></g>
        </g>
      );
    case 'buscaminas':
      return (
        <g>
          <Shadow />
          <rect x="16" y="18" width="118" height="116" rx="12" fill="#041410" stroke="url(#ta-gold)" strokeWidth="2" />
          {Array.from({ length: 16 }, (_, i) => {
            const c = i % 4; const r = Math.floor(i / 4); const x = 23 + c * 26; const y = 25 + r * 25.5;
            const open = (r === 1 && c < 3) || (r === 2 && c < 2) || (r === 0 && c === 0);
            return (
              <g key={i}>
                <rect x={x} y={y + (open ? 0 : 2.2)} width="24" height="23" rx="4" fill={open ? '#050b08' : '#031b12'} />
                <rect x={x} y={y} width="24" height="23" rx="4" fill={open ? '#0a1511' : 'url(#t2-em)'} stroke={open ? '#000' : '#9ff5d2'} strokeOpacity={open ? 0.5 : 0.35} />
                {!open && <rect x={x + 2} y={y + 2} width="20" height="8" rx="3" fill="#fff" opacity=".2" />}
              </g>
            );
          })}
          {[[1, 1, '1', '#4da3ff'], [2, 1, '2', '#3ecf6e'], [0, 2, '3', '#ff5a5a'], [1, 2, '1', '#4da3ff']].map(([c, r, d, col]) => <text key={`${c}${r}`} x={23 + Number(c) * 26 + 12} y={25 + Number(r) * 25.5 + 18} textAnchor="middle" fontSize="17" fontWeight="800" fill={String(col)} fontFamily="Outfit, system-ui, sans-serif">{d}</text>)}
          {/* bandera clásica */}
          <g transform="translate(76 76) scale(.5)" style={{ filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.7))' }}>
            <rect x="22" y="82" width="56" height="9" rx="2.5" fill="#0F172A" /><rect x="32" y="74" width="36" height="9" rx="2" fill="#0F172A" />
            <rect x="47" y="10" width="6" height="66" rx="2" fill="#F8FAFC" /><path d="M53 12 L88 27 Q78 31 70 29 Q62 33 53 42 Z" fill="#EF4444" /><path d="M53 12 L88 27 L72 30 L53 22 Z" fill="#FCA5A5" opacity=".8" />
          </g>
          {/* mina */}
          <g transform="translate(112 104)">
            <ellipse cy="14" rx="13" ry="3.4" fill="#000" opacity=".5" />
            {Array.from({ length: 8 }, (_, i) => <g key={i} transform={`rotate(${i * 45})`}><path d="M-3 -9 L0 -17 L3 -9Z" fill="url(#ta-gold)" stroke="#5c430b" strokeWidth=".6" /></g>)}
            <circle r="10" fill="url(#cv-ball)" stroke="#05080a" /><circle cx="-3.4" cy="-3.6" r="2.6" fill="#fff" opacity=".6" />
          </g>
        </g>
      );
    case 'mentiroso':
      return (
        <g>
          <ellipse cx="75" cy="112" rx="62" ry="22" fill="url(#cv-felt)" stroke="#D4AF37" strokeOpacity=".5" strokeWidth="1.4" />
          <ellipse cx="75" cy="132" rx="52" ry="6" fill="rgba(0,0,0,.5)" />
          <g transform="translate(60 12) scale(.82) rotate(-9 40 33)" style={{ filter: 'drop-shadow(0 8px 6px rgba(0,0,0,.6))' }}><CupGroup /></g>
          <g transform="translate(44 108) rotate(-12) scale(.74) translate(-50 -50)" style={{ filter: 'drop-shadow(0 6px 4px rgba(0,0,0,.55))' }}><IsoDie face={5} /></g>
          <g transform="translate(94 112) rotate(14) scale(.66) translate(-50 -50)" style={{ filter: 'drop-shadow(0 6px 4px rgba(0,0,0,.55))' }}><IsoDie face={3} /></g>
          <g transform="translate(122 104)"><ellipse cy="5" rx="11" ry="4" fill="#000" opacity=".5" /><circle r="11" fill="#7f1d1d" stroke="#fde68a" strokeWidth="2" strokeDasharray="5 3" /><circle r="6" fill="none" stroke="#fde68a" strokeWidth="1" /><circle cx="-3.5" cy="-3.5" r="2.4" fill="#fff" opacity=".4" /></g>
        </g>
      );
    case 'tres': {
      const X = ({ x, y }: { x: number; y: number }) => <g strokeLinecap="round"><path d={`M${x} ${y}l17 17M${x + 17} ${y}l-17 17`} stroke="#000" strokeOpacity=".45" strokeWidth="8" transform="translate(1.5 3)" /><path d={`M${x} ${y}l17 17M${x + 17} ${y}l-17 17`} stroke="url(#ta-gold)" strokeWidth="7" /><path d={`M${x + 1} ${y + 1}l15 15`} stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" /></g>;
      const O = ({ x, y }: { x: number; y: number }) => <g><circle cx={x + 8.5} cy={y + 11} r="9" fill="none" stroke="#000" strokeOpacity=".45" strokeWidth="7" /><circle cx={x + 8.5} cy={y + 8.5} r="9" fill="none" stroke="url(#t2-di)" strokeWidth="6.5" /><circle cx={x + 5} cy={y + 4.5} r="1.6" fill="#fff" /></g>;
      return (
        <g>
          <Shadow y={138} rx={54} />
          <rect x="18" y="20" width="114" height="114" rx="13" fill="url(#t2-wood)" stroke="url(#ta-gold)" strokeWidth="2.2" />
          <rect x="24" y="26" width="102" height="102" rx="8" fill="#150c05" stroke="#000" strokeOpacity=".6" />
          {[58, 92].map((p) => <g key={p}><line x1={p} y1="34" x2={p} y2="120" stroke="url(#ta-gold)" strokeWidth="2" /><line x1="32" y1={p + 6} x2="118" y2={p + 6} stroke="url(#ta-gold)" strokeWidth="2" /></g>)}
          <X x={31} y={36} /><X x={96} y={100} /><X x={63} y={69} /><O x={64} y={36} /><O x={31} y={69} />
          <path d="M34 40 L116 122" stroke="#FCE38A" strokeOpacity=".4" strokeWidth="9" strokeLinecap="round" /><path d="M34 40 L116 122" stroke="#FFF6C6" strokeWidth="2.4" strokeLinecap="round" />
          <Gloss x={20} y={22} w={110} h={46} r={12} />
        </g>
      );
    }
    case 'cuatro': {
      const gold = [[2, 4], [3, 4], [3, 3], [4, 4], [5, 4], [3, 2]];
      const ruby = [[1, 4], [2, 3], [4, 3], [2, 2]];
      const has = (l: number[][], c: number, r: number): boolean => l.some(([a, b]) => a === c && b === r);
      return (
        <g>
          <Shadow y={138} />
          <rect x="12" y="22" width="126" height="112" rx="12" fill="url(#t2-wood)" stroke="url(#ta-gold)" strokeWidth="2" />
          <rect x="17" y="27" width="116" height="102" rx="8" fill="#04100c" />
          {Array.from({ length: 30 }, (_, i) => {
            const c = i % 6; const r = Math.floor(i / 6); const x = 28 + c * 19; const y = 40 + r * 19.6;
            const g = has(gold, c, r); const rb = has(ruby, c, r);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="8.6" fill="#0b1512" stroke="#6c7a72" strokeOpacity=".7" strokeWidth="1.2" />
                {(g || rb) && <><circle cx={x} cy={y + 1.6} r="8" fill="#000" opacity=".4" /><circle cx={x} cy={y} r="8" fill={g ? 'url(#t2-dg)' : 'url(#t2-r)'} stroke="#000" strokeOpacity=".3" strokeWidth=".6" /><circle cx={x} cy={y} r="4.8" fill="none" stroke="#000" strokeOpacity=".2" /><circle cx={x - 2.6} cy={y - 3} r="2.2" fill="#fff" opacity=".6" /></>}
              </g>
            );
          })}
          <Gloss x={14} y={24} w={122} h={44} r={10} />
        </g>
      );
    }
    default: // mahjong, 2048, sudoku: la pieza 2.5D de siempre con relieve, sombra y brillo
      return (
        <g>
          <g style={{ filter: 'drop-shadow(0 6px 5px rgba(0,0,0,.55))' }}><Body2 id={id} /></g>
          <Gloss x={16} y={20} w={118} h={50} r={14} />
        </g>
      );
  }
}
