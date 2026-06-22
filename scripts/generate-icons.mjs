/**
 * Generates the PWA icon set with zero dependencies (built-in zlib only).
 * Draws a premium emerald "bucket" mark on a gradient tile.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "icons");

/* ----------------------------- canvas ----------------------------- */

function createCanvas(size) {
  return { size, data: new Uint8Array(size * size * 4) };
}

function setPixel(cv, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= cv.size || y >= cv.size) return;
  const i = (y * cv.size + x) * 4;
  // Source-over alpha compositing.
  const sa = a / 255;
  const da = cv.data[i + 3] / 255;
  const outA = sa + da * (1 - sa);
  if (outA === 0) return;
  cv.data[i] = (r * sa + cv.data[i] * da * (1 - sa)) / outA;
  cv.data[i + 1] = (g * sa + cv.data[i + 1] * da * (1 - sa)) / outA;
  cv.data[i + 2] = (b * sa + cv.data[i + 2] * da * (1 - sa)) / outA;
  cv.data[i + 3] = outA * 255;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

/** Signed coverage for anti-aliasing (1 inside, 0 outside, partial on edge). */
function aa(dist) {
  return Math.max(0, Math.min(1, 0.5 - dist));
}

function roundedRectDist(x, y, cx, cy, halfW, halfH, r) {
  const qx = Math.abs(x - cx) - (halfW - r);
  const qy = Math.abs(y - cy) - (halfH - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

/* ------------------------------ art ------------------------------- */

const TOP = [13, 148, 136]; // teal-600
const BOTTOM = [16, 185, 129]; // emerald-500
const DARK = [10, 10, 12]; // near-black
const WHITE = [255, 255, 255, 255];

function drawIcon(size, { maskable }) {
  const cv = createCanvas(size);
  const S = size;
  const pad = maskable ? 0 : S * 0.085;
  const tile = { cx: S / 2, cy: S / 2, half: S / 2 - pad, r: maskable ? S * 0.001 : S * 0.22 };

  // Tile background gradient (rounded for "any", full-bleed for maskable).
  for (let y = 0; y < S; y++) {
    const t = y / (S - 1);
    const col = mix(TOP, BOTTOM, t);
    for (let x = 0; x < S; x++) {
      const d = roundedRectDist(x, y, tile.cx, tile.cy, tile.half, tile.half, tile.r);
      const cov = aa(d);
      if (cov > 0) setPixel(cv, x, y, [col[0], col[1], col[2], 255 * cov]);
    }
  }

  // Bucket glyph.
  const cx = S / 2;
  const topY = S * 0.34;
  const botY = S * 0.70;
  const topHalf = S * 0.20;
  const botHalf = S * 0.145;
  const rimRy = S * 0.045;

  for (let y = Math.floor(topY - rimRy); y <= Math.ceil(botY); y++) {
    for (let x = Math.floor(cx - topHalf - 2); x <= Math.ceil(cx + topHalf + 2); x++) {
      // Trapezoid body between topY and botY.
      const t = (y - topY) / (botY - topY);
      const half = lerp(topHalf, botHalf, Math.max(0, Math.min(1, t)));
      const inBody = y >= topY && y <= botY && Math.abs(x - cx) <= half;
      // Top rim ellipse.
      const ex = (x - cx) / topHalf;
      const ey = (y - topY) / rimRy;
      const inRim = ex * ex + ey * ey <= 1;
      if (inBody || inRim) {
        // Bucket opening: carve a darker ellipse into the rim.
        const oy = (y - topY) / (rimRy * 0.74);
        const ox = (x - cx) / (topHalf * 0.78);
        if (ox * ox + oy * oy <= 1 && y <= topY + rimRy * 0.2) {
          const col = mix(TOP, BOTTOM, y / (S - 1));
          setPixel(cv, x, y, [col[0], col[1], col[2], 255]);
        } else {
          setPixel(cv, x, y, WHITE);
        }
      }
    }
  }

  // A small coin dropping into the bucket, for a finance hint.
  const coinR = S * 0.052;
  const coinCx = cx;
  const coinCy = S * 0.235;
  for (let y = Math.floor(coinCy - coinR - 1); y <= Math.ceil(coinCy + coinR + 1); y++) {
    for (let x = Math.floor(coinCx - coinR - 1); x <= Math.ceil(coinCx + coinR + 1); x++) {
      const d = Math.hypot(x - coinCx, y - coinCy) - coinR;
      const cov = aa(d);
      if (cov > 0) setPixel(cv, x, y, [DARK[0], DARK[1], DARK[2], 255 * cov]);
    }
  }

  return cv;
}

/* --------------------------- PNG encode --------------------------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(cv) {
  const { size, data } = cv;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // raw scanlines with filter byte 0
  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  const pixels = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------ main ------------------------------ */

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "maskable-192.png", size: 192, maskable: true },
  { file: "maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
];

for (const t of targets) {
  const cv = drawIcon(t.size, { maskable: t.maskable });
  writeFileSync(resolve(OUT_DIR, t.file), encodePng(cv));
  console.log("✓", t.file);
}

// Favicon (32px) as PNG named favicon.ico-style is not valid; emit favicon.png.
const fav = drawIcon(32, { maskable: false });
writeFileSync(resolve(__dirname, "..", "public", "icon.png"), encodePng(fav));
console.log("✓ icon.png");
