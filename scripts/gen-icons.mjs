/**
 * Genera todos los iconos de STACKS a partir de UNA sola definición de la «S» dorada geométrica.
 * Requiere (temporalmente): npm i -D @resvg/resvg-js opentype.js @fontsource/unbounded
 * Uso: node scripts/gen-icons.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import opentype from 'opentype.js';

const OUT = new URL('../public/', import.meta.url);
const BG = '#061810';
const SQUIRCLE = 'M0 256C0 38 38 0 256 0S512 38 512 256 474 512 256 512 0 474 0 256Z';

const DEFS = `<defs>
<linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FCE38A"/><stop offset="1" stop-color="#E3BD4A"/></linearGradient>
<linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E3BD4A"/><stop offset="1" stop-color="#D4AF37"/></linearGradient>
<linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D4AF37"/><stop offset="1" stop-color="#8C6314"/></linearGradient>
<clipPath id="sq"><path d="${SQUIRCLE}"/></clipPath>
<clipPath id="c1"><polygon points="0,0 512,0 512,196 0,240"/></clipPath>
<clipPath id="c2"><polygon points="0,240 512,196 512,306 0,334"/></clipPath>
<clipPath id="c3"><polygon points="0,334 512,306 512,512 0,512"/></clipPath>
</defs>`;
const P = 'M346 160H204V256H318V352H168';
const part = (c, f) => `<g clip-path="url(#${c})"><g transform="translate(256 256) skewX(-10) translate(-256 -256)"><path d="${P}" fill="none" stroke="url(#${f})" stroke-width="64" stroke-linejoin="miter" stroke-miterlimit="10"/></g></g>`;
/** La «S»: tres segmentos facetados con cortes diagonales. */
const S = part('c1', 't') + part('c2', 'm') + part('c3', 'l') + `<path d="M0 240L512 196M0 334L512 306" stroke="${BG}" stroke-width="6"/>`;
const scaled = (k) => `<g transform="translate(256 256) scale(${k}) translate(-256 -256)">${S}</g>`;
const svg = (inner, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${DEFS}${inner}${extra}</svg>\n`;
const ring = `<path d="${SQUIRCLE}" fill="none" stroke="#D4AF37" stroke-opacity=".55" stroke-width="2" transform="translate(1 1) scale(.9961)"/>`;

const FILES = {
  'icon.svg': svg(`<g clip-path="url(#sq)"><rect width="512" height="512" fill="${BG}"/>${S}</g>`, ring),
  'favicon.svg': svg(`<g clip-path="url(#sq)"><rect width="512" height="512" fill="${BG}"/>${S}</g>`),
  // Margen de seguridad del 20 % para iconos adaptativos de Android / Google Play.
  'icon-maskable.svg': svg(`<rect width="512" height="512" fill="${BG}"/>${scaled(0.6)}`),
  // iOS recorta las esquinas: fondo a sangre completa, sin transparencias.
  '_apple.svg': svg(`<rect width="512" height="512" fill="${BG}"/>${scaled(0.82)}`),
};
for (const [name, text] of Object.entries(FILES)) if (!name.startsWith('_')) writeFileSync(new URL(name, OUT), text);

const png = (text, size) => new Resvg(text, { fitTo: { mode: 'width', value: size } }).render().asPng();
const save = (name, buf) => writeFileSync(new URL(name, OUT), buf);

save('icon-192.png', png(FILES['icon.svg'], 192));
save('icon-512.png', png(FILES['icon.svg'], 512));
save('icon-maskable-512.png', png(FILES['icon-maskable.svg'], 512));
save('apple-touch-icon.png', png(FILES['_apple.svg'], 180));
save('apple-touch-icon-precomposed.png', png(FILES['_apple.svg'], 180));

// favicon.ico multi-resolución (16, 32, 48) con PNG incrustados
const sizes = [16, 32, 48];
const pngs = sizes.map((n) => png(FILES['favicon.svg'], n));
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const dir = sizes.map((n, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(n, 0); e.writeUInt8(n, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(offset, 12); offset += pngs[i].length; return e;
});
save('favicon.ico', Buffer.concat([head, ...dir, ...pngs]));

// og-image 1200×630: emblema + STACKS en Unbounded (convertido a trazados para no depender de fuentes)
const fontBuf = readFileSync(new URL('../node_modules/@fontsource/unbounded/files/unbounded-latin-700-normal.woff', import.meta.url));
const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));
const fs = 84;
const track = fs * 0.14;
let x = 0;
let d = '';
for (const ch of 'STACKS') {
  const g = font.charToGlyph(ch);
  d += g.getPath(x, 0, fs).toPathData(2);
  x += (g.advanceWidth * fs) / font.unitsPerEm + track;
}
const textW = x - track;
const ogInner = `<rect width="1200" height="630" fill="${BG}"/>
<radialGradient id="glow" cx="30%" cy="50%" r="60%"><stop offset="0" stop-color="#0F3A2A"/><stop offset="1" stop-color="${BG}"/></radialGradient>
<rect width="1200" height="630" fill="url(#glow)"/>
<g transform="translate(120 135) scale(0.7)"><g clip-path="url(#sq)"><rect width="512" height="512" fill="${BG}"/>${S}</g>${ring}</g>
<linearGradient id="goldText" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6D87A"/><stop offset="1" stop-color="#D4AF37"/></linearGradient>
<g transform="translate(540 340)"><path d="${d}" fill="url(#goldText)"/></g>`;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">${DEFS}${ogInner}</svg>`;
save('og-image.png', new Resvg(og, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true } }).render().asPng());
console.log('Iconos generados. Ancho del texto OG:', Math.round(textW));
