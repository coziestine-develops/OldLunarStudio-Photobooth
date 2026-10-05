/**
 * OldLuna Arcade — Photo Strip / Grid Generator
 *
 * Combines multiple captured photos into a single composited image.
 * Layout options: vertical strip or 2-column grid.
 */

import { FILTER_MAP } from './filters.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Generate a composed photo layout.
 * @param {string[]} photos    data URLs
 * @param {string}   filterId  active filter
 * @param {'strip'|'grid'} layout
 * @returns {Promise<string>}  data URL
 */
export async function generatePhotoCompose(photos, filterId = 'normal', layout = 'strip') {
  const images = await Promise.all(photos.map(loadImage));
  const filter  = FILTER_MAP[filterId] ?? FILTER_MAP['normal'];

  const CELL_W  = 480;
  const CELL_H  = Math.round(CELL_W * (3 / 4));
  const PAD     = 16;
  const BORDER  = 2;
  const HDR     = 56;
  const FTR     = 44;

  const cols = layout === 'grid' && photos.length >= 4 ? 2 : 1;
  const rows = Math.ceil(photos.length / cols);

  const totalW = cols * CELL_W + (cols + 1) * PAD;
  const totalH = HDR + rows * CELL_H + (rows + 1) * PAD + FTR;

  const canvas = document.createElement('canvas');
  canvas.width  = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, totalW, totalH);

  // Border
  ctx.strokeStyle = '#AC58E9';
  ctx.lineWidth = BORDER;
  ctx.strokeRect(BORDER / 2, BORDER / 2, totalW - BORDER, totalH - BORDER);

  // Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 22px 'Space Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('OldLuna Studio', totalW / 2, 36);
  ctx.fillStyle = '#AC58E9';
  ctx.font = `12px 'Space Grotesk', sans-serif`;
  ctx.fillText(filterId.toUpperCase(), totalW / 2, 52);

  // Photos
  for (let i = 0; i < images.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PAD + col * (CELL_W + PAD);
    const y = HDR + PAD + row * (CELL_H + PAD);

    // Draw image (cover-fit)
    const img = images[i];
    const ar = img.width / img.height;
    const cellAr = CELL_W / CELL_H;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (ar > cellAr) { sw = img.height * cellAr; sx = (img.width - sw) / 2; }
    else              { sh = img.width / cellAr;  sy = (img.height - sh) / 2; }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, CELL_W, CELL_H);

    // Apply filter per-cell
    const offscreen = document.createElement('canvas');
    offscreen.width = CELL_W; offscreen.height = CELL_H;
    const offCtx = offscreen.getContext('2d');
    offCtx.putImageData(ctx.getImageData(x, y, CELL_W, CELL_H), 0, 0);
    filter.apply(offCtx, CELL_W, CELL_H);
    ctx.drawImage(offscreen, x, y);

    // Cell border
    ctx.strokeStyle = 'rgba(172,88,233,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, CELL_W, CELL_H);

    // Number badge
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + 6, y + CELL_H - 22, 30, 18);
    ctx.fillStyle = '#AC58E9';
    ctx.font = `bold 10px 'Space Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${String(i + 1).padStart(2, '0')}`, x + 21, y + CELL_H - 8);
  }

  // Footer
  const footerY = HDR + rows * (CELL_H + PAD) + PAD + 16;
  ctx.fillStyle = 'rgba(172,88,233,0.6)';
  ctx.font = `11px 'Space Grotesk', sans-serif`;
  ctx.textAlign = 'center';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  ctx.fillText(dateStr, totalW / 2, footerY);

  return canvas.toDataURL('image/jpeg', 0.93);
}
