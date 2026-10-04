/**
 * OldLuna — Canvas / Capture Utilities
 *
 * ORIENTATION POLICY:
 *   mirror=false → draw as-is (no transform)
 *   mirror=true  → scaleX(-1) on canvas so export matches the mirrored preview
 */
import { FILTER_MAP } from './filters.js';

/**
 * Capture one frame from a <video> element.
 * Returns a PNG Blob at the video's native resolution (Full HD when the camera supports it).
 */
export async function waitForFrame(videoEl, timeoutMs = 3000) {
  const start = performance.now();
  const ready = () => videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0;
  while (!ready()) {
    if (videoEl.paused) videoEl.play?.().catch(() => {});
    if (performance.now() - start > timeoutMs) throw new Error('Camera is not ready yet');
    await new Promise(r => setTimeout(r, 50));
  }
}

/** Resolve on the next presented video frame (or after a short timeout) so we never grab a stale one. */
function nextVideoFrame(videoEl, timeoutMs = 400) {
  return new Promise(resolve => {
    if (!videoEl.requestVideoFrameCallback) return resolve();
    let done = false;
    const fin = () => { if (!done) { done = true; resolve(); } };
    videoEl.requestVideoFrameCallback(fin);
    setTimeout(fin, timeoutMs);
  });
}

export async function captureFrame(videoEl, filterId = 'normal', mirror = false) {
  await waitForFrame(videoEl);
  await nextVideoFrame(videoEl);
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (!vw || !vh) throw new Error('Camera is not ready yet');
  const SCALE = 1;
  const w = vw * SCALE, h = vh * SCALE;

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.drawImage(videoEl, 0, 0, w, h);
  if (mirror) ctx.setTransform(1,0,0,1,0,0);

  // Originals are saved untouched ('normal' = no filter); filters are applied in the editor.
  const filter = FILTER_MAP[filterId];
  if (filter) filter.apply(ctx, w, h);

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode photo'))), 'image/png'));
}

/** Convert a Blob to a data URL. */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Resize an image data URL to a small thumbnail data URL. */
export function resizeDataURL(dataUrl, maxDim = 360) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxDim/img.width, maxDim/img.height, 1);
      const w = Math.round(img.width*ratio), h = Math.round(img.height*ratio);
      const c = document.createElement('canvas');
      c.width=w; c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      resolve(c.toDataURL('image/jpeg',0.72));
    };
    img.src = dataUrl;
  });
}

/**
 * Apply brightness/contrast/saturation adjustments to a canvas
 * that already has an image drawn on it. Returns the same canvas.
 */
export function applyAdjustments(ctx, w, h, { brightness=100, contrast=100, saturation=100 }) {
  // Use an offscreen canvas with CSS filter then draw back
  const src = ctx.canvas;
  const off = document.createElement('canvas');
  off.width=w; off.height=h;
  const oc = off.getContext('2d');
  oc.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  oc.drawImage(src, 0, 0);
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(off,0,0);
}

/** Generate a timestamped PNG filename. */
export function pngFilename(prefix='oldluna-photostrip') {
  const n=new Date();
  const pad=v=>String(v).padStart(2,'0');
  return `${prefix}-${n.getFullYear()}${pad(n.getMonth()+1)}${pad(n.getDate())}-${pad(n.getHours())}${pad(n.getMinutes())}${pad(n.getSeconds())}.png`;
}

/** Download a Blob as a PNG file, then revoke the object URL. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}