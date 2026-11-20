// news-image-20261120 — "The World: Friday 20 November 2026"
// A newspaper front page drawn at runtime, in pure Node 22 stdlib.
// No network, no dependencies. Writes /output/entry.png (1024x1024,
// under 1 MiB). Deterministic: same bytes on every run.
//
// Stories (all first reported on Friday 20 November 2026):
//  1. Trump defers any Iran decision to 2027 — Reuters / TOI
//  2. Cyclone Akvan makes landfall near Gopalpur, Odisha — IMD
//  3. NASA: Voyager 1 passes one light-day from Earth
//  4. Russian strikes damage Austrian and Dutch embassies in Kyiv
//  5. GTA 6 sales pass The Odyssey's $1.8bn global run
//  6. Hayabusa2: engine trouble ends the asteroid-landing plan

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- PNG out
const W = 1024;
const H = 1024;

function crc32(buf: Buffer): number {
  let table = (crc32 as any)._t;
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    (crc32 as any)._t = table;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(rgb: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    rgb.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ font
// Hand-drawn 5x7 bitmap font, uppercase only. Each glyph: 7 rows of 5 bits.
const GLYPHS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '01010', '00000', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '*': ['00000', '10101', '01110', '10101', '00000', '00000', '00000'],
  '>': ['10000', '01000', '00100', '00010', '00100', '01000', '10000'],
  '<': ['00001', '00010', '00100', '01000', '00100', '00010', '00001'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
};

// ---------------------------------------------------------------- canvas
type RGB = [number, number, number];
const PAPER: RGB = [246, 241, 231];
const INK: RGB = [26, 26, 26];
const NAVY: RGB = [20, 33, 61];
const RED: RGB = [185, 28, 28];
const TEAL: RGB = [14, 116, 144];
const AMBER: RGB = [180, 83, 9];
const GREEN: RGB = [22, 101, 52];
const GREY: RGB = [90, 86, 78];
const WHITE: RGB = [255, 255, 255];
const SKY: RGB = [186, 220, 235];
const GOLD: RGB = [201, 162, 39];

class Canvas {
  px = Buffer.alloc(W * H * 3);
  constructor() {
    this.fill(PAPER);
  }
  fill(c: RGB) {
    for (let i = 0; i < W * H; i++) {
      this.px[i * 3] = c[0];
      this.px[i * 3 + 1] = c[1];
      this.px[i * 3 + 2] = c[2];
    }
  }
  set(x: number, y: number, c: RGB) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }
  hline(x: number, y: number, w: number, c: RGB, t = 1) {
    this.rect(x, y, w, t, c);
  }
  vline(x: number, y: number, h: number, c: RGB, t = 1) {
    this.rect(x, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    for (let guard = 0; guard < 4000; guard++) {
      this.rect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB, fill = false) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = x * x + y * y;
        if (fill ? d <= r * r : d <= r * r && d >= (r - 2) * (r - 2)) {
          this.set(cx + x, cy + y, c);
        }
      }
    }
  }
  // text: scale = pixel size of one bitmap cell. Returns width drawn.
  text(x: number, y: number, s: string, scale: number, c: RGB): number {
    const up = s.toUpperCase();
    let cx = x;
    for (const ch of up) {
      const g = GLYPHS[ch] ?? GLYPHS['?'];
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (g[r][col] === '1') {
            this.rect(cx + col * scale, y + r * scale, scale, scale, c);
          }
        }
      }
      cx += 6 * scale;
    }
    return cx - x - scale;
  }
  textWidth(s: string, scale: number): number {
    return s.toUpperCase().length * 6 * scale - scale;
  }
  // Word-wrap a paragraph into lines that fit maxW. Returns lines.
  wrap(s: string, scale: number, maxW: number): string[] {
    const words = s.toUpperCase().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const trial = cur ? cur + ' ' + w : w;
      if (this.textWidth(trial, scale) <= maxW) {
        cur = trial;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  para(x: number, y: number, s: string, scale: number, maxW: number, c: RGB, lh?: number): number {
    const lines = this.wrap(s, scale, maxW);
    const step = lh ?? Math.round(9 * scale);
    lines.forEach((ln, i) => this.text(x, y + i * step, ln, scale, c));
    return y + lines.length * step;
  }
  centerText(y: number, s: string, scale: number, c: RGB, x0 = 0, x1 = W): number {
    const w = this.textWidth(s, scale);
    return this.text(x0 + Math.floor((x1 - x0 - w) / 2), y, s, scale, c);
  }
}

// ------------------------------------------------------------------ icons
function drawClock(cv: Canvas, cx: number, cy: number, r: number) {
  cv.circle(cx, cy, r, WHITE, true);
  cv.circle(cx, cy, r, NAVY, false);
  cv.circle(cx, cy, r - 14, NAVY, false);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const x1 = cx + Math.round(Math.sin(a) * (r - 22));
    const y1 = cy - Math.round(Math.cos(a) * (r - 22));
    const x2 = cx + Math.round(Math.sin(a) * (r - 14));
    const y2 = cy - Math.round(Math.cos(a) * (r - 14));
    cv.line(x1, y1, x2, y2, NAVY, 3);
  }
  // hands: pointing to ~11 and ~2 — the decision is put off
  cv.line(cx, cy, cx - 34, cy - 42, RED, 5);
  cv.line(cx, cy, cx + 44, cy - 30, NAVY, 5);
  cv.circle(cx, cy, 7, RED, true);
}

function drawCyclone(cv: Canvas, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  for (let k = 0; k < 4; k++) {
    const r = 16 + k * 11;
    const a0 = k * 1.1;
    for (let a = a0; a < a0 + 4.6; a += 0.12) {
      const rr = r + (a - a0) * 2.2;
      cv.set(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * 0.85), TEAL);
      cv.set(Math.round(cx + Math.cos(a) * rr) + 1, Math.round(cy + Math.sin(a) * rr * 0.85), TEAL);
    }
  }
  cv.circle(cx, cy, 5, RED, true);
  // rain streaks
  for (let i = 0; i < 5; i++) {
    const rx = x + 12 + i * 16;
    cv.line(rx, y + h - 16, rx - 6, y + h - 4, TEAL, 2);
  }
}

function drawVoyager(cv: Canvas, x: number, y: number, w: number, h: number) {
  cv.rect(x, y, w, h, NAVY);
  // stars (fixed positions, deterministic)
  const stars: [number, number][] = [
    [8, 8], [30, 20], [55, 6], [80, 24], [110, 10], [140, 28], [170, 8],
    [200, 18], [230, 6], [260, 22], [20, 40], [150, 44], [240, 44], [100, 48],
  ];
  for (const [sx, sy] of stars) {
    cv.set(x + sx, y + sy, WHITE);
    cv.set(x + sx + 1, y + sy, WHITE);
  }
  // dotted trajectory
  for (let i = 0; i < 14; i++) {
    cv.rect(x + 12 + i * 16, y + h - 18 - Math.floor(i * 1.6), 5, 3, GOLD);
  }
  // probe: body + dish + boom
  const px = x + w - 78;
  const py = y + 16;
  cv.rect(px, py + 10, 34, 16, WHITE);
  cv.line(px + 34, py + 18, px + 56, py + 8, GOLD, 3);
  cv.line(px, py + 18, px - 22, py + 26, WHITE, 3);
  cv.circle(px + 58, py + 6, 7, GOLD, false);
  cv.line(px + 8, py + 10, px + 8, py - 6, WHITE, 2);
  cv.circle(px + 8, py - 8, 3, RED, true);
}

function drawKyiv(cv: Canvas, x: number, y: number, w: number, h: number) {
  const bx = x + 14;
  const by = y + 12;
  const bw = 74;
  const bh = h - 24;
  cv.rect(bx, by, bw, bh, GREY);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++) cv.rect(bx + 8 + c * 22, by + 8 + r * 12, 12, 7, GOLD);
  // crack
  cv.line(bx + 30, by, bx + 24, by + 18, RED, 3);
  cv.line(bx + 24, by + 18, bx + 34, by + 34, RED, 3);
  cv.line(bx + 34, by + 34, bx + 28, by + 50, RED, 3);
  // blast star
  const sx = x + w - 62;
  const sy = y + h / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    cv.line(sx, sy, Math.round(sx + Math.cos(a) * 26), Math.round(sy + Math.sin(a) * 26), RED, 4);
  }
  cv.circle(sx, sy, 9, AMBER, true);
  cv.text(x + 108, y + h - 22, 'KYIV', 2, RED);
}

function drawChart(cv: Canvas, x: number, y: number, w: number, h: number) {
  const bars = [14, 22, 18, 30, 26, 40];
  const bw = 26;
  const gap = 14;
  for (let i = 0; i < bars.length; i++) {
    const bh = bars[i];
    const bx = x + 16 + i * (bw + gap);
    cv.rect(bx, y + h - 10 - bh, bw, bh, i === bars.length - 1 ? GREEN : TEAL);
  }
  cv.line(x + 10, y + h - 10, x + w - 10, y + h - 10, INK, 2);
  cv.text(x + w - 112, y + 6, '$1.8BN', 3, RED);
}

function drawAsteroid(cv: Canvas, x: number, y: number, w: number, h: number) {
  const cx = x + 46;
  const cy = y + h / 2;
  const pts: [number, number][] = [
    [cx - 26, cy - 6], [cx - 12, cy - 22], [cx + 8, cy - 24], [cx + 26, cy - 10],
    [cx + 30, cy + 10], [cx + 12, cy + 24], [cx - 12, cy + 22], [cx - 28, cy + 10],
  ];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    cv.line(x1, y1, x2, y2, AMBER, 3);
  }
  cv.circle(cx - 6, cy - 6, 4, AMBER, true);
  cv.circle(cx + 10, cy + 8, 3, AMBER, true);
  // probe flying away, red X over the landing plan
  const px = x + w - 104;
  const py = y + 12;
  cv.rect(px, py, 34, 14, GREY);
  cv.line(px + 34, py + 7, px + 54, py + 2, GOLD, 3);
  cv.circle(px + 56, py + 1, 6, GOLD, false);
  cv.line(px, py + 7, px - 18, py + 14, WHITE, 3);
  cv.line(px + 60, py + 26, px + 84, py + 50, RED, 4);
  cv.line(px + 84, py + 26, px + 60, py + 50, RED, 4);
}

// ------------------------------------------------------------------ panels
function smallPanel(
  cv: Canvas, x: number, y: number, w: number, h: number,
  tag: string, tagC: RGB, headline: string, body: string,
  icon: (cv: Canvas, x: number, y: number, w: number, h: number) => void,
) {
  cv.rect(x, y, w, h, WHITE); // panel paper
  cv.rect(x, y, w, 2, INK);
  cv.rect(x, y + h - 2, w, 2, INK);
  cv.rect(x, y, 2, h, INK);
  cv.rect(x + w - 2, y, 2, h, INK);
  cv.rect(x, y, w, 28, tagC);
  cv.text(x + 10, y + 6, tag, 2, WHITE);
  const iconH = 62;
  icon(cv, x + 2, y + 30, w - 4, iconH);
  const lines = cv.wrap(headline, 3, w - 24);
  lines.slice(0, 2).forEach((ln, i) => cv.text(x + 12, y + 30 + iconH + 8 + i * 28, ln, 3, INK));
  cv.para(x + 12, y + 30 + iconH + 8 + 2 * 28 + 4, body, 2, w - 24, INK, 17);
}

// ------------------------------------------------------------------- page
function drawPage(): Canvas {
  const cv = new Canvas();

  // Masthead
  cv.rect(0, 0, W, 128, NAVY);
  cv.centerText(14, 'THE WORLD', 8, WHITE);
  cv.rect(60, 84, W - 120, 3, GOLD);
  cv.centerText(94, 'FRIDAY - 20 NOVEMBER 2026', 4, GOLD);

  // Lead story
  const lx = 16;
  const ly = 140;
  const lw = 992;
  const lh = 256;
  cv.rect(lx, ly, lw, lh, WHITE);
  cv.rect(lx, ly, lw, 6, RED);
  cv.rect(lx, ly, lw, 2, INK);
  cv.rect(lx, ly + lh - 2, lw, 2, INK);
  cv.rect(lx, ly, 2, lh, INK);
  cv.rect(lx + lw - 2, ly, 2, lh, INK);
  cv.text(lx + 16, ly + 18, 'THE LEAD - WASHINGTON', 2, RED);
  const head = cv.wrap('TRUMP PUTS IRAN DECISION OFF TO 2027', 4, 600);
  head.forEach((ln, i) => cv.text(lx + 16, ly + 48 + i * 38, ln, 4, INK));
  cv.para(
    lx + 16, ly + 48 + head.length * 38 + 8,
    'No rush, the president says: he will "see what happens" after Jan 1. Allies and rivals alike read the delay as a pause in the march to war.',
    2, 600, INK, 18,
  );
  cv.text(lx + 16, ly + lh - 30, 'REUTERS - REPORTED 20 NOV', 2, GREY);
  // clock illustration on the right
  drawClock(cv, lx + 800, ly + 118, 82);
  cv.centerText(ly + 216, '2027', 5, RED, lx + 640, lx + lw - 16);

  // Grid of five stories + "also today"
  const gx = [16, 348, 680];
  const gy = [408, 662];
  const pw = 320;
  const ph = 242;
  smallPanel(cv, gx[0], gy[0], pw, ph, 'WEATHER - INDIA', TEAL,
    'CYCLONE AKVAN HITS ODISHA',
    'Landfall near Gopalpur at noon. 300,000 people evacuated, 423 rescue teams out, winds to 110 km/h.',
    drawCyclone);
  smallPanel(cv, gx[1], gy[0], pw, ph, 'SPACE', NAVY,
    'VOYAGER 1 PASSES ONE LIGHT-DAY',
    'NASA confirms the 1977 probe is now a light-day from Earth, the farthest any human-made object has flown.',
    drawVoyager);
  smallPanel(cv, gx[2], gy[0], pw, ph, 'WAR IN UKRAINE', RED,
    'KYIV EMBASSIES HIT',
    'Russian missiles damage the Austrian and Dutch embassies. Europe says it is ready for talks to end the war.',
    drawKyiv);
  smallPanel(cv, gx[0], gy[1], pw, ph, 'CULTURE', AMBER,
    'GTA 6 SALES PASS $1.8BN',
    'The game outsells The Odyssey global box-office run, in its opening weeks on sale.',
    drawChart);
  smallPanel(cv, gx[1], gy[1], pw, ph, 'SCIENCE - JAPAN', GREY,
    'HAYABUSA2 LANDING IS OFF',
    'Engine trouble forces Japan to scrap the asteroid landing. The probe flies on to new targets instead.',
    drawAsteroid);
  // Also today
  const ax = gx[2];
  const ay = gy[1];
  cv.rect(ax, ay, pw, ph, NAVY);
  cv.text(ax + 12, ay + 10, 'ALSO TODAY', 3, GOLD);
  cv.hline(ax + 12, ay + 44, pw - 24, GOLD, 2);
  const also = [
    'ICJ MYANMAR RULING:',
    'WORLD REACTS TO THE',
    'GENOCIDE VERDICT',
    '',
    'UK-EU SUMMIT OPENS',
    'IN BRUSSELS',
    '',
    'APEC ADOPTS THE',
    'SHENZHEN OUTLOOK',
  ];
  also.forEach((ln, i) => {
    if (ln) cv.text(ax + 12, ay + 56 + i * 19, ln, 2, WHITE);
  });

  // Ticker
  cv.rect(0, 916, W, 44, RED);
  cv.centerText(928, 'IRAN DELAYED - AKVAN LANDFALL - VOYAGER 1 - KYIV HIT - GTA 6 $1.8BN', 2, WHITE);

  // Footer
  cv.centerText(972, 'SOURCES: REUTERS - BBC - THE HINDU - NASA - IMD - AP', 2, GREY);
  cv.centerText(994, 'DRAWN FROM REPORTS OF FRIDAY 20 NOVEMBER 2026 - ONE DAY, ONE PAGE', 2, GREY);

  return cv;
}

// -------------------------------------------------------------------- main
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const png = encodePNG(drawPage().px);
writeFileSync(join(outDir, 'entry.png'), png);
