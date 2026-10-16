/**
 * Linktivity (.lrec) lecture recording parser for Syrian Virtual University (SVU).
 *
 * Format overview:
 * - Linktivity session files begin with magic markers and screen dimensions (width, height, color depth).
 * - Screen updates (record 0x8E) contain Deflate-compressed delta rectangles.
 * - Audio packets (record 0x80) carry 8.5 kbps TrueSpeech voice frames (30ms chunks at 8000 Hz).
 */

// @ts-nocheck
import TS from './truespeech';

const sleep = (ms: number) => ms > 40 ? new Promise(r => setTimeout(r, ms)) : new Promise(r => {
  if (typeof MessageChannel !== 'undefined') {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => r();
    ch.port2.postMessage(0);
  } else {
    setTimeout(r, 0);
  }
});

/* Standard Windows 8-bit colour table: 20 system colours at both ends, the rest is a 3-3-2 ramp (red 8 levels, green 8 levels, blue 4 levels). */
const SYS_LO = [
  [0, 0, 0], [128, 0, 0], [0, 128, 0], [128, 128, 0],
  [0, 0, 128], [128, 0, 128], [0, 128, 128], [192, 192, 192],
  [192, 220, 192], [166, 202, 240]
];

const SYS_HI = [
  [255, 251, 240], [160, 160, 164], [128, 128, 128], [255, 0, 0],
  [0, 255, 0], [255, 255, 0], [0, 0, 255], [255, 0, 255],
  [0, 255, 255], [255, 255, 255]
];

const PAL = (() => {
  const p = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i < 10 ? SYS_LO[i] : i >= 246 ? SYS_HI[i - 246] : [(i & 7) * 32, ((i >> 3) & 7) * 32, ((i >> 6) & 3) * 64];
    p[i] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
  }
  return p;
})();

/* ---------- LREC parsing ---------- */
function chainOk(d: Uint8Array, start: number, hops: number): boolean {
  let o = start;
  for (let i = 0; i < hops; i++) {
    if (o + 24 > d.length || d[o + 8] !== 0x10 || d[o + 9] !== 0x04) return false;
    o += (d[o + 10] | d[o + 11] << 8 | d[o + 12] << 16) + 13;
    if (o > d.length) return false;
  }
  return true;
}

function findStart(d: Uint8Array): number {
  if (chainOk(d, 2240, 5)) return 2240;
  for (let s = 0; s < Math.min(d.length - 30, 20000); s++) {
    if (d[s + 8] === 0x10 && d[s + 9] === 0x04 && chainOk(d, s, 5)) return s;
  }
  return -1;
}

async function inflate(u8: Uint8Array): Promise<Uint8Array> {
  const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

/* the screen header holds width, height (twice) and the colour depth; it sits before the first record */
function readScreenHeader(d: Uint8Array, start: number): { W: number; H: number; bpp: number } | null {
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
  const lim = Math.min(start, d.length - 24);
  for (let p = 0; p < lim; p++) {
    const w = dv.getUint32(p, true);
    const h = dv.getUint32(p + 4, true);
    if (w < 16 || h < 16 || w > 16000 || h > 16000) continue;
    if (dv.getUint32(p + 8, true) !== w || dv.getUint32(p + 12, true) !== h) continue;
    const bpp = dv.getUint32(p + 16, true);
    if ([8, 15, 16, 24, 32].includes(bpp)) return { W: w, H: h, bpp };
  }
  return null;
}

/* converts one rectangle to 0xAABBGGRR pixels; bytes per pixel decides the layout (1 = palette index, 2 = 16-bit, 3/4 = BGR) */
function toTrueColor(src: Uint8Array, n: number, bpx: number, is555: boolean): Uint32Array {
  const o = new Uint32Array(n);
  if (bpx === 1) {
    const pal = PAL;
    for (let i = 0; i < n; i++) o[i] = pal[src[i]];
  } else if (bpx === 2) {
    for (let i = 0; i < n; i++) {
      const v = src[i * 2] | src[i * 2 + 1] << 8;
      let r: number, g: number, b: number;
      if (!is555) {
        r = (v >> 11) & 31;
        g = (v >> 5) & 63;
        b = v & 31;
        r = r << 3 | r >> 2;
        g = g << 2 | g >> 4;
        b = b << 3 | b >> 2;
      } else {
        r = (v >> 10) & 31;
        g = (v >> 5) & 31;
        b = v & 31;
        r = r << 3 | r >> 2;
        g = g << 3 | g >> 2;
        b = b << 3 | b >> 2;
      }
      o[i] = 0xFF000000 | b << 16 | g << 8 | r;
    }
  } else {
    for (let i = 0; i < n; i++) {
      const q = i * bpx;
      o[i] = 0xFF000000 | src[q] << 16 | src[q + 1] << 8 | src[q + 2];
    }
  }
  return o;
}

async function parseLrec(buf: ArrayBuffer, onProgress?: (p: number) => void) {
  const d = new Uint8Array(buf);
  const dv = new DataView(buf);
  const start = findStart(d);
  if (start < 0) throw new Error('هذا الملف لا يطابق بنية تسجيلات Linktivity المعروفة في الجامعة الافتراضية.');
  
  const hdr = readScreenHeader(d, start);
  let tc = hdr && hdr.bpp > 8 ? true : null;
  const recs: { ts: number; o: number; e: number }[] = [];
  const arecs: { ts: number; o: number; e: number }[] = [];
  let o = start;

  while (o + 24 <= d.length && d[o + 8] === 0x10 && d[o + 9] === 0x04) {
    const L = d[o + 10] | d[o + 11] << 8 | d[o + 12] << 16;
    if (o + 13 + L > d.length) break;
    if (d[o + 15] === 0x8e) recs.push({ ts: dv.getUint32(o, true), o: o + 24, e: o + 13 + L });
    else if (d[o + 15] === 0x80) arecs.push({ ts: dv.getUint32(o, true), o: o + 24, e: o + 13 + L });
    o += L + 13;
  }

  if (!recs.length) throw new Error('لم يتم العثور في الملف على أي تحديثات مرئية للصورة.');
  
  const ups: any[] = [];
  let W = 0;
  let H = 0;
  let skipped = 0;
  const bad: Record<string, number> = {};

  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    try {
      const b = await inflate(d.subarray(r.o, r.e));
      const bv = new DataView(b.buffer);
      const rects: any[] = [];
      let p = 0;
      while (p + 21 <= b.length) {
        const t = b[p];
        const x = bv.getUint32(p + 1, true);
        const y = bv.getUint32(p + 5, true);
        const w = bv.getUint32(p + 9, true);
        const h = bv.getUint32(p + 13, true);
        const s = bv.getUint32(p + 17, true);
        if (p + 21 + s > b.length) break;
        const px = w * h;
        const bpx = px > 0 ? s / px : 0;
        if (t === 0 && px > 0 && Number.isInteger(bpx) && bpx >= 1 && bpx <= 4 && x < 20000 && y < 20000 && (tc !== false || bpx === 1)) {
          if (tc === null) tc = bpx > 1;
          const raw = b.subarray(p + 21, p + 21 + s);
          rects.push({ x, y, w, h, data: tc ? toTrueColor(raw, px, bpx, hdr && hdr.bpp === 15) : raw });
          W = Math.max(W, x + w);
          H = Math.max(H, y + h);
        } else {
          skipped++;
          const k = t !== 0 ? 'نوع ' + t : 'حجم غير متوقع (' + s + ' لمستطيل ' + w + '×' + h + ')';
          bad[k] = (bad[k] || 0) + 1;
        }
        p += 21 + s;
      }
      ups.push({ ts: r.ts, rects });
    } catch (e) {
      skipped++;
      bad['تعذر فك الضغط'] = (bad['تعذر فك الضغط'] || 0) + 1;
    }
    if (i % 40 === 0 && onProgress) {
      onProgress(i / recs.length);
      await sleep(0);
    }
  }

  if (hdr) {
    W = Math.max(W, hdr.W);
    H = Math.max(H, hdr.H);
  }

  if (!W || !H) {
    const why = Object.entries(bad).slice(0, 4).map(([k, v]) => k + ' ×' + v).join('، ');
    throw new Error('تعذر قراءة صورة هذا التسجيل' + (hdr ? ' (' + hdr.W + '×' + hdr.H + '، ' + hdr.bpp + ' بت)' : '') + (why ? ': ' + why : '') + '.');
  }

  const audio = buildInnerAudio(d, arecs);
  return {
    W,
    H,
    bpp: tc ? 32 : 8,
    ups,
    skipped,
    bad,
    audio,
    duration: ups[ups.length - 1].ts
  };
}

/* The screen recording carries the speaker's voice as TrueSpeech 8.5 packets: 8 blocks of 32 bytes, 30 ms each. */
function buildInnerAudio(d: Uint8Array, arecs: { ts: number; o: number; e: number }[]) {
  if (!arecs.length) return null;
  const dec = new TS.Decoder();
  const lastTs = arecs[arecs.length - 1].ts;
  const pcm = new Float32Array(Math.ceil((lastTs + 2000) * 8) + 16000);
  let cursor = 0;
  let blocks = 0;

  for (const r of arecs) {
    const pl = d.subarray(r.o, r.e);
    const off = pl[2] | pl[3] << 8;
    if (pl.length < off + 21 + 32 || pl[off] !== 0x10 || pl[off + 1] !== 0x04) continue;
    const n = Math.floor((pl.length - off - 21) / 32);
    if (n < 1) continue;
    const smp = dec.decode(pl, off + 21, n);
    const want = Math.max(0, Math.round((r.ts - n * 30) * 8)); // a packet is stamped when it ends
    if (want - cursor > 2000) cursor = want; // silence or a pause: jump to the real time
    if (cursor + smp.length > pcm.length) break;
    for (let i = 0; i < smp.length; i++) pcm[cursor + i] = smp[i] / 32768;
    cursor += smp.length;
    blocks += n;
  }

  if (!blocks) return null;
  return { pcm, len: cursor, rate: 8000, seconds: cursor / 8000 };
}

function applyUpdate(fb: Uint32Array | Uint8Array, W: number, H: number, u: { rects: any[] }) {
  for (const r of u.rects) {
    const w = Math.min(r.w, W - r.x);
    const h = Math.min(r.h, H - r.y);
    if (w <= 0 || h <= 0) continue;
    for (let j = 0; j < h; j++) {
      fb.set(r.w === w ? r.data.subarray(j * r.w, j * r.w + w) : r.data.subarray(j * r.w, j * r.w + w), (r.y + j) * W + r.x);
    }
  }
}

function newFb(W: number, H: number, bpp: number): Uint32Array | Uint8Array {
  if (bpp > 8) {
    const f = new Uint32Array(W * H);
    f.fill(0xFF000000);
    return f;
  }
  return new Uint8Array(W * H);
}

function drawFb(cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D, fb: Uint32Array | Uint8Array, pal: Uint32Array, W: number, H: number, img: ImageData) {
  const px = new Uint32Array(img.data.buffer);
  const ew = cv.width;
  if (fb instanceof Uint32Array) {
    for (let y = 0; y < H; y++) {
      px.set(fb.subarray(y * W, y * W + W), y * ew);
    }
  } else {
    for (let y = 0; y < H; y++) {
      const a = y * W;
      const b = y * ew;
      for (let x = 0; x < W; x++) {
        px[b + x] = pal[fb[a + x]];
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

export {
  SYS_LO,
  SYS_HI,
  PAL,
  chainOk,
  findStart,
  inflate,
  readScreenHeader,
  toTrueColor,
  parseLrec,
  buildInnerAudio,
  applyUpdate,
  newFb,
  drawFb
};
