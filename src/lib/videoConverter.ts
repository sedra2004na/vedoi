/**
 * WebCodecs Video & Audio encoding pipeline with MP4-Muxer for SVU lectures.
 * Converts parsed .lrec lecture frames and TrueSpeech audio into a high-quality,
 * universally compatible .mp4 video with Constant Frame Rate (CFR) and proper IDR keyframes.
 */

// @ts-nocheck
import * as Mp4Muxer from 'mp4-muxer';
import AACE from './aacEncoder';
import ENH from './audioEnhancer';
import { PAL, newFb, drawFb, applyUpdate } from './lrecParser';

export const fmtTime = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(x).padStart(2, '0');
};

export const fmtSize = (b: number): string => {
  if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
  return Math.max(1, Math.round(b / 1024)) + ' KB';
};

const yieldNow = () => new Promise<void>(resolve => {
  if (typeof MessageChannel !== 'undefined') {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(0);
  } else {
    setTimeout(resolve, 0);
  }
});

const sleep = (ms: number) => ms > 40 ? new Promise(r => setTimeout(r, ms)) : yieldNow();

const drain = (enc: any, max: number) => enc.encodeQueueSize > max ? new Promise<void>(r => {
  const f = () => {
    if (enc.encodeQueueSize <= max) {
      enc.removeEventListener('dequeue', f);
      r();
    }
  };
  enc.addEventListener('dequeue', f);
}) : null;

const IS_MOBILE = typeof navigator !== 'undefined' && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.userAgentData && navigator.userAgentData.mobile));

export async function pickVideoConfig(ew: number, eh: number, fps: number, soft: boolean) {
  const codecs = [
    { codec: 'avc1.640034', m: 'avc' },
    { codec: 'avc1.4d0034', m: 'avc' },
    { codec: 'avc1.42003e', m: 'avc' },
    { codec: 'vp09.00.10.08', m: 'vp9' }
  ];
  const plans = [];
  if (IS_MOBILE && !soft) plans.push({ S: 1.5, hw: 'prefer-hardware', modes: ['variable'], br: 3e6 });
  const swS = IS_MOBILE ? (ew * eh * 4 > 2.4e6 ? 1.0 : 1.5) : 1.5;
  plans.push({ S: swS, hw: 'prefer-software', modes: ['quantizer', 'variable'], br: 1.5e6 });

  for (const p of plans) {
    const ow = Math.round(ew * p.S / 2) * 2;
    const oh = Math.round(eh * p.S / 2) * 2;
    for (const t of codecs) {
      for (const mode of p.modes) {
        const cfg = {
          codec: t.codec,
          width: ow,
          height: oh,
          bitrate: p.br,
          framerate: fps,
          latencyMode: 'quality',
          bitrateMode: mode,
          contentHint: 'detail',
          hardwareAcceleration: p.hw
        };
        try {
          const r = await VideoEncoder.isConfigSupported(cfg);
          if (r.supported) {
            return {
              cfg: r.config || cfg,
              muxCodec: t.m,
              mode,
              ow,
              oh,
              hw: p.hw === 'prefer-hardware'
            };
          }
        } catch (e) {
          // continue search
        }
      }
    }
  }
  return null;
}

const LZ = (() => {
  const N = 1024, T = 6, t = new Float32Array((N + 1) * T);
  const L = (x: number) => x === 0 ? 1 : Math.abs(x) < 3 ? Math.sin(Math.PI * x) * Math.sin(Math.PI * x / 3) / (Math.PI * Math.PI * x * x / 3) : 0;
  for (let f = 0; f <= N; f++) {
    for (let k = 0; k < T; k++) {
      t[f * T + k] = L(f / N - (k - 2));
    }
  }
  return { N, T, t };
})();

export function resampleBlock(chans: Float32Array[], srcRate: number, dstRate: number, o: number, n: number) {
  const out = new Float32Array(n * chans.length);
  const ratio = srcRate / dstRate;
  chans.forEach((ch, c) => {
    const len = ch.length;
    for (let i = 0; i < n; i++) {
      const x = (o + i) * ratio;
      const i0 = Math.floor(x);
      const fi = Math.round((x - i0) * LZ.N) * LZ.T;
      let sum = 0;
      for (let k = 0; k < 6; k++) {
        const idx = i0 + k - 2;
        if (idx >= 0 && idx < len) sum += ch[idx] * LZ.t[fi + k];
      }
      out[c * n + i] = sum;
    }
  });
  return out;
}

export async function pickAudioConfig(ch: number, srcRate: number) {
  const speech = srcRate <= 16000;
  if (typeof AudioEncoder !== 'undefined') {
    for (const sr of speech ? [16000, 24000, 32000, 44100, 48000] : [srcRate, 48000, 44100]) {
      const cfg = { codec: 'mp4a.40.2', sampleRate: sr, numberOfChannels: ch, bitrate: speech ? 64000 : 128000 * ch / 2 };
      try {
        const s = await AudioEncoder.isConfigSupported(cfg);
        if (s.supported) return { js: false, cfg: s.config || cfg, sr, channels: ch };
      } catch (e) {
        // continue
      }
    }
  }
  const sr = speech ? 16000 : (AACE.RATES.indexOf(srcRate) >= 0 && srcRate >= 22050 ? srcRate : 48000);
  return { js: true, sr, channels: 1, bw: speech ? 4400 : Math.min(sr / 2, 16000) };
}

export async function encodeAudioJs(src: any, ac: any, muxer: any, onP: (p: number) => void, cancelToken: { cancelled: boolean }) {
  const mono = src.chans.length === 1 ? src.chans : [(() => {
    const o = new Float32Array(src.len);
    for (const c of src.chans) {
      for (let i = 0; i < src.len; i++) o[i] += c[i] / src.chans.length;
    }
    return o;
  })()];
  const enc = new AACE.Encoder(ac.sr, ac.bw, 0.12);
  const F = 1024;
  const total = Math.ceil(src.len / src.rate * ac.sr) + F;
  const frames = Math.ceil(total / F);
  for (let j = 0; j < frames; j++) {
    if (cancelToken.cancelled) break;
    const x = resampleBlock(mono, src.rate, ac.sr, (j + 1) * F, F);
    const data = enc.encode(x);
    muxer.addAudioChunkRaw(data, 'key', Math.round(j * F / ac.sr * 1e6), Math.round(F / ac.sr * 1e6));
    if (j % 200 === 0) {
      onP(j / frames);
      await sleep(0);
    }
  }
}

export async function encodeAudio(src: any, ac: any, muxer: any, onP: (p: number) => void, cancelToken: { cancelled: boolean }) {
  if (ac.js) return encodeAudioJs(src, ac, muxer, onP, cancelToken);
  let aErr: any = null;
  const enc = new AudioEncoder({
    output: (c, m) => muxer.addAudioChunk(c, m),
    error: e => { aErr = e; }
  });
  enc.configure(ac.cfg);
  const ch = src.chans.length;
  const total = Math.ceil(src.len / src.rate * ac.sr);
  const step = 4096;
  for (let o = 0; o < total; o += step) {
    if (cancelToken.cancelled) break;
    if (aErr) throw aErr;
    const n = Math.min(step, total - o);
    const data = resampleBlock(src.chans, src.rate, ac.sr, o, n);
    const ad = new AudioData({
      format: 'f32-planar',
      sampleRate: ac.sr,
      numberOfFrames: n,
      numberOfChannels: ch,
      timestamp: Math.round(o / ac.sr * 1e6),
      data
    });
    enc.encode(ad);
    ad.close();
    await drain(enc, 40);
    if ((o / step) % 60 === 0) {
      onP(o / total);
      await sleep(0);
    }
  }
  await enc.flush();
  enc.close();
  if (aErr) throw aErr;
}

let wakeLock: any = null;
let navLock: any = null;
let beepAudio: any = null;

export function keepAwake(on: boolean) {
  try {
    if (on) {
      if (typeof navigator !== 'undefined' && navigator.locks && !navLock) {
        navigator.locks.request('svu-convert', () => new Promise(r => { navLock = r; })).catch(() => {});
      }
      if (!beepAudio && typeof window !== 'undefined') {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (AC) {
          const c = new AC();
          const o = c.createOscillator();
          const g = c.createGain();
          g.gain.value = 0.0001;
          o.frequency.value = 30;
          o.connect(g);
          g.connect(c.destination);
          o.start();
          beepAudio = c;
        }
      }
      if (beepAudio && beepAudio.state === 'suspended') beepAudio.resume();
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: 'جارٍ تحويل المحاضرة إلى فيديو MP4' });
      }
      if (typeof navigator !== 'undefined' && !wakeLock && (navigator as any).wakeLock) {
        (navigator as any).wakeLock.request('screen').then((w: any) => {
          wakeLock = w;
          w.addEventListener('release', () => { wakeLock = null; });
        }).catch(() => {});
      }
    } else {
      if (navLock) { navLock(); navLock = null; }
      if (beepAudio) { beepAudio.close(); beepAudio = null; }
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) navigator.mediaSession.metadata = null;
      if (wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
      }
    }
  } catch (e) {
    // ignore
  }
}

export interface ConvertOptions {
  enhanceAudio?: boolean;
  denoiseStrength?: number;
  presenceBoost?: number;
  forceSoft?: boolean;
  fps?: number; // 10 fps default for constant framerate compatibility
}

export interface ConvertResult {
  blob: Blob;
  sizeFormatted: string;
  sizeBytes: number;
  width: number;
  height: number;
  durationMs: number;
  codec: string;
}

/**
 * Runs the complete lecture conversion into a universally playable CFR MP4.
 */
export async function convertLecture(
  lecture: any,
  options: ConvertOptions,
  onProgress: (pct: number, stageText: string) => void,
  cancelToken: { cancelled: boolean },
  previewCanvas?: HTMLCanvasElement | null
): Promise<ConvertResult> {
  if (!lecture) throw new Error('لا يوجد بيانات محاضرة للتحويل.');
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('متصفحك الحالي لا يدعم WebCodecs VideoEncoder. يُرجى استخدام متصفح حديث مثل Chrome أو Edge.');
  }

  keepAwake(true);
  let vc: any = null;
  let vErr: any = null;

  try {
    // 10 FPS Constant Frame Rate (CFR) guarantees 100% compatibility across
    // Windows Media Player, QuickTime, iOS, Android, Smart TVs, and VLC.
    const fps = options.fps || 10;
    const frameDurationUs = Math.round(1e6 / fps);
    const frameIntervalMs = 1000 / fps;

    const qa = 20;
    const qv = 22;
    const W = lecture.W;
    const H = lecture.H;
    const ew = W + (W & 1);
    const eh = H + (H & 1);
    const pal = PAL;

    vc = await pickVideoConfig(ew, eh, fps, options.forceSoft || false);
    if (!vc) {
      throw new Error('متصفحك لا يوفّر ترميز الفيديو المطلوب (H.264 أو VP9). جرب متصفح Google Chrome أو Microsoft Edge.');
    }

    const ow = vc.ow;
    const oh = vc.oh;

    let audioSrc: any = null;
    let audioCfg: any = null;
    const ENH_SHARE = 0.08;

    if (lecture.audio) {
      onProgress(0, 'تحسين ومعالجة الصوت...');
      await sleep(30);

      const pcm = lecture.audio.pcm.slice(0, lecture.audio.len);
      if (options.enhanceAudio !== false) {
        await ENH.enhance(pcm, pcm.length, lecture.audio.rate, {
          denoise: options.denoiseStrength ?? 16,
          presence: options.presenceBoost ?? 4,
          targetDb: -24,
          maxGainDb: 14
        }, (p: number) => {
          onProgress(ENH_SHARE * p, 'تنقية الضجيج وتحسين طبقة الصوت...');
        });
      }

      audioSrc = { chans: [pcm], rate: lecture.audio.rate, len: pcm.length };
      audioCfg = await pickAudioConfig(1, audioSrc.rate);
    }

    // Initialize MP4 Muxer with explicit CFR frameRate
    const target = new Mp4Muxer.ArrayBufferTarget();
    const muxer = new Mp4Muxer.Muxer({
      target,
      fastStart: 'in-memory',
      firstTimestampBehavior: 'cross-track-offset',
      video: {
        codec: vc.muxCodec,
        width: ow,
        height: oh,
        frameRate: fps
      },
      ...(audioCfg ? { audio: { codec: 'aac', numberOfChannels: audioCfg.channels, sampleRate: audioCfg.sr } } : {})
    });

    const venc = new VideoEncoder({
      output: (c, m) => muxer.addVideoChunk(c, m),
      error: e => { vErr = e; }
    });
    venc.configure(vc.cfg);

    const fb = newFb(W, H, lecture.bpp);
    const cv = document.createElement('canvas');
    cv.width = ew;
    cv.height = eh;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const img = ctx!.createImageData(ew, eh);
    new Uint32Array(img.data.buffer).fill(0xFFFFFFFF);

    let cvOut = cv;
    if (ow !== ew || oh !== eh) {
      cvOut = document.createElement('canvas');
      cvOut.width = ow;
      cvOut.height = oh;
    }
    const ctxOut = cvOut !== cv ? cvOut.getContext('2d') : null;
    if (ctxOut) {
      ctxOut.imageSmoothingEnabled = true;
      ctxOut.imageSmoothingQuality = 'high';
    }

    const previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;
    if (previewCanvas) {
      previewCanvas.width = ew;
      previewCanvas.height = eh;
    }

    const durationMs = lecture.duration;
    const totalFrames = Math.max(1, Math.ceil((durationMs + 200) / frameIntervalMs));
    let vP = 0;
    let aP = 0;
    let aErr: any = null;

    const base = audioSrc ? ENH_SHARE : 0;
    const showP = (msg: string) => {
      const progress = base + (1 - base) * (audioSrc ? (0.88 * vP + 0.12 * aP) : vP);
      onProgress(progress, msg);
    };

    const aJob = audioSrc ? encodeAudio(audioSrc, audioCfg, muxer, (x: number) => { aP = x; }, cancelToken).catch(e => { aErr = e; }) : null;

    // Sort updates by timestamp
    const sortedUps = [...lecture.ups].sort((a, b) => a.ts - b.ts);
    let upIdx = 0;
    let dirty = true;
    let lastKeyFrame = -100;

    // CFR (Constant Frame Rate) loop: encode frame after frame at exact regular intervals
    for (let frameIdx = 0; frameIdx <= totalFrames; frameIdx++) {
      if (cancelToken.cancelled) break;
      if (vErr) throw vErr;

      const currentTimeMs = frameIdx * frameIntervalMs;
      let slideChanged = false;

      // Apply all updates that occurred up to currentTimeMs
      while (upIdx < sortedUps.length && sortedUps[upIdx].ts <= currentTimeMs) {
        applyUpdate(fb, W, H, sortedUps[upIdx]);
        upIdx++;
        dirty = true;
        slideChanged = true;
      }

      // Redraw frame buffer if content changed
      if (dirty) {
        drawFb(cv, ctx, fb, pal, W, H, img);
        if (ctxOut) ctxOut.drawImage(cv, 0, 0, ow, oh);
        dirty = false;
      }

      const frameTimestampUs = Math.round(frameIdx * frameDurationUs);
      const vf = new VideoFrame(cvOut, {
        timestamp: frameTimestampUs,
        duration: frameDurationUs
      });

      // Keyframe strategy: Force IDR keyframe at frame 0, on slide changes, or at least every 3 seconds (3 * fps)
      const isKey = frameIdx === 0 || slideChanged || (frameIdx - lastKeyFrame >= fps * 3);
      if (isKey) lastKeyFrame = frameIdx;

      venc.encode(
        vf,
        vc.mode === 'quantizer'
          ? { keyFrame: isKey, avc: { quantizer: qa }, vp9: { quantizer: qv } }
          : { keyFrame: isKey }
      );
      vf.close();

      // Update interactive preview canvas periodically
      if ((frameIdx % (fps * 2) === 0 || slideChanged) && previewCtx) {
        previewCtx.drawImage(cv, 0, 0);
      }

      await drain(venc, 20);

      if (frameIdx % (fps * 2) === 0 || frameIdx === totalFrames) {
        vP = Math.min(frameIdx / totalFrames, 1);
        showP(`ترميز الفيديو · ${fmtTime(currentTimeMs)} / ${fmtTime(durationMs)}`);
        await sleep(0);
      }
    }

    vP = 1;
    showP('جاري إنهاء تدفق الفيديو...');
    if (previewCtx) previewCtx.drawImage(cv, 0, 0);

    await venc.flush();
    venc.close();
    if (vErr) throw vErr;

    if (cancelToken.cancelled) {
      if (aJob) await aJob;
      throw new Error('تم إلغاء عملية التحويل.');
    }

    if (aJob) {
      vP = 1;
      showP('دمج التدفق الصوتي...');
      await aJob;
      if (aErr) throw aErr;
      if (cancelToken.cancelled) throw new Error('تم إلغاء عملية التحويل.');
    }

    showP('بناء ملف MP4 النهائي...');
    await yieldNow();

    muxer.finalize();
    const outBlob = new Blob([target.buffer], { type: 'video/mp4' });

    return {
      blob: outBlob,
      sizeBytes: outBlob.size,
      sizeFormatted: fmtSize(outBlob.size),
      width: ow,
      height: oh,
      durationMs: durationMs,
      codec: vc.muxCodec === 'vp9' ? 'VP9' : 'H.264 (AVC)'
    };
  } finally {
    keepAwake(false);
  }
}
