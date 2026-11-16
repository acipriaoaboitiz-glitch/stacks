import { useEffect, useRef } from 'react';
import { THEMES, useSettings } from '../../store/settings.ts';

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';

/** Galaxia: capas de estrellas que centellean y giran despacio, nebulosa suave y repulsión con el puntero. */
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uHue;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
mat2 rot(float a){ float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
vec3 hsv(float h, float s, float v){ vec3 k = clamp(abs(mod(h * 6. + vec3(0., 4., 2.), 6.) - 3.) - 1., 0., 1.); return v * mix(vec3(1.), k, s); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 4; i++){ v += a * noise(p); p = rot(.5) * p * 2.02; a *= .5; } return v; }
vec3 stars(vec2 uv, float scale, float seed){
  vec2 g = uv * scale; vec2 id = floor(g); vec2 f = fract(g) - .5;
  float h = hash(id + seed);
  vec2 off = vec2(hash(id + seed + 1.7), hash(id + seed + 3.1)) - .5;
  float d = length(f - off * .7);
  float size = .018 + .05 * h * h;
  float tw = .55 + .45 * sin(uTime * (.8 + 2.4 * h) + h * 40.);
  float s = (1. - smoothstep(0., size, d)) * tw * step(.42, h);
  s += (1. - smoothstep(0., size * 4., d)) * .12 * tw * step(.42, h);
  vec3 col = mix(vec3(1., .93, .7), hsv(fract(uHue + h * .08), .3, 1.), .55 + .3 * h);
  return col * s;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  vec2 m = (uMouse - .5 * uRes) / uRes.y;
  vec2 dm = uv - m; float push = .09 * exp(-dot(dm, dm) * 9.);
  uv += normalize(dm + 1e-4) * push;
  uv = rot(uTime * .012) * uv;
  vec3 col = vec3(0.);
  col += stars(uv + vec2(uTime * .004, 0.), 14., 1.) * .9;
  col += stars(rot(.7) * uv + vec2(0., uTime * .006), 26., 7.) * .75;
  col += stars(rot(1.4) * uv - vec2(uTime * .008, 0.), 48., 13.) * .6;
  float n = fbm(uv * 2.2 + vec2(uTime * .01, -uTime * .006));
  float n2 = fbm(uv * 3.4 - uTime * .008 + 4.);
  col += hsv(fract(uHue + .02), .7, 1.) * pow(n, 2.6) * .22;
  col += hsv(fract(uHue + .07), .55, 1.) * pow(n2, 3.) * .14;
  col *= 1. - .35 * length(gl_FragCoord.xy / uRes - .5);
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

export function Galaxy() {
  const hue = THEMES[useSettings().theme].hue;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return; // sin WebGL: queda el fondo oscuro de la página
    const sh = (type: number, src: string): WebGLShader => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uHue = gl.getUniformLocation(prog, 'uHue');

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = (): void => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: canvas.width / 2, y: canvas.height / 2, tx: canvas.width / 2, ty: canvas.height / 2 };
    const onMove = (e: PointerEvent): void => { mouse.tx = e.clientX * dpr; mouse.ty = canvas.height - e.clientY * dpr; };
    window.addEventListener('pointermove', onMove, { passive: true });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number): void => {
      mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 12 : (now - t0) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uHue, hue);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const onVis = (): void => { if (!document.hidden && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } };
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [hue]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 h-full w-full" style={{ zIndex: 0, background: '#04070a' }} />;
}
