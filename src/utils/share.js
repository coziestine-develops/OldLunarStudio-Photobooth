/**
 * OldLuna — share links
 *
 * OldLuna never uploads photos, so a share link carries the *design* of a strip
 * (frame, colour, caption, stickers, filter) — not the pictures. Opening the link
 * loads the app with that design applied, ready to shoot.
 *
 *   https://host/path#share=<sessionId>.<base64url(JSON design)>
 *
 * The data lives in the URL hash, so it is never sent to a server.
 * The session id is generated once per browser session, so every session gets its own unique link.
 */
import { FILTERS } from './filters.js';

const FRAME_IDS    = ['classic', 'minimal', 'film', 'vintage', 'polaroid', 'rounded', 'none'];
const BG_IDS       = ['cream', 'white', 'ink', 'pink'];
const BG_STYLE_IDS = ['solid', 'dots', 'stripes', 'grid'];
const STICKER_IDS  = ['star', 'heart', 'sparkle', 'crown', 'moon', 'camera'];
const FILTER_IDS   = FILTERS.map(f => f.id);

const SID_KEY  = 'oldluna:sid';
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
let memorySid = null;

/* ── Unique id ── */
function randomId(len = 10) {
  const bytes = new Uint8Array(len);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
}

/** One id per browser session (stable while the tab is open). */
export function getSessionId() {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) { sid = randomId(); sessionStorage.setItem(SID_KEY, sid); }
    return sid;
  } catch {
    return (memorySid ??= randomId());
  }
}

/* ── base64url (unicode-safe) ── */
function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/* ── Validate everything that comes from a URL: only known values get through ── */
const pick = (v, list, fallback) => (list.includes(v) ? v : fallback);

export function sanitizeDesign(raw = {}) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const intensity = Number.isFinite(r.intensity) ? Math.min(100, Math.max(0, Math.round(r.intensity))) : 100;
  return {
    frameStyle:  pick(r.frameStyle, FRAME_IDS, 'classic'),
    bgColor:     pick(r.bgColor, BG_IDS, 'cream'),
    bgStyle:     pick(r.bgStyle, BG_STYLE_IDS, 'solid'),
    caption:     typeof r.caption === 'string' ? r.caption.slice(0, 24) : 'OLDLUNA',
    showCaption: r.showCaption !== false,
    showDate:    r.showDate !== false,
    stickers:    Array.isArray(r.stickers) ? r.stickers.filter(s => STICKER_IDS.includes(s)).slice(0, 6) : [],
    filter:      pick(r.filter, FILTER_IDS, 'normal'),
    intensity,
  };
}

/* ── Link build / parse ── */
export function buildShareLink(design) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#share=${getSessionId()}.${encode(sanitizeDesign(design))}`;
}

/** Returns { id, design } for a valid share hash, otherwise null. */
export function parseShareHash(hash = window.location.hash) {
  try {
    const m = /^#share=([a-z0-9]{6,32})\.([A-Za-z0-9_-]+)$/.exec(hash);
    if (!m) return null;
    return { id: m[1], design: sanitizeDesign(decode(m[2])) };
  } catch {
    return null;
  }
}

/* ── Landing builder ⇄ editor vocabulary ── */
const B_TO_E_FRAME = { none: 'none', thin: 'minimal', thick: 'classic', rounded: 'rounded', film: 'film' };
const E_TO_B_FRAME = { classic: 'thick', minimal: 'thin', film: 'film', vintage: 'thick', polaroid: 'thick', rounded: 'rounded', none: 'none' };
const B_TO_E_COLOR = { cream: 'cream', clean: 'white', black: 'ink', film: 'cream', pink: 'pink' };
const E_TO_B_COLOR = { cream: 'cream', white: 'clean', ink: 'black', pink: 'pink' };

export function builderToDesign({ frame, color, caption, showDate }) {
  return sanitizeDesign({
    frameStyle: B_TO_E_FRAME[frame],
    bgColor: B_TO_E_COLOR[color],
    caption,
    showCaption: !!caption,
    showDate,
  });
}

export function designToBuilder(d) {
  return {
    frame: E_TO_B_FRAME[d.frameStyle] ?? 'thin',
    color: E_TO_B_COLOR[d.bgColor] ?? 'pink',
    caption: d.caption,
    showDate: d.showDate,
  };
}

/** Patch for the photo editor state (App.jsx editorState). */
export function designToEditor(d) {
  return {
    frameStyle: d.frameStyle, bgColor: d.bgColor, bgStyle: d.bgStyle,
    caption: d.caption, showCaption: d.showCaption && !!d.caption,
    showDate: d.showDate, stickers: d.stickers, stylePreset: 'custom',
  };
}

export function editorToDesign(es, filter, intensity) {
  return sanitizeDesign({
    frameStyle: es.frameStyle, bgColor: es.bgColor, bgStyle: es.bgStyle,
    caption: es.caption, showCaption: es.showCaption, showDate: es.showDate,
    stickers: es.stickers, filter, intensity,
  });
}

/* ── Clipboard (with fallback for insecure contexts / older browsers) ── */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export const SHARE_TITLE = 'OldLuna — Photo strips that feel like a memory';
export const SHARE_TEXT  = 'Try this photo strip design on OldLuna. Take four photos right in your browser.';
