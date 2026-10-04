/**
 * PhotoEditor — Step 4 "Final Output".
 * Left: live strip preview. Right: Style (filter · style · frame) and Customize (text · date · layout · background · decorations) + actions.
 * Every control feeds the same options object that is used for the preview AND for the downloaded PNG.
 */
import { useState, useRef, useEffect, useCallback, useId, useMemo } from 'react';
import {
  Calendar, Camera, ChevronDown, Crown, Download, Frame, Heart, Moon, Palette, Printer, Share2, Sparkles, Star, Trash2, Type,
} from 'lucide-react';
import { FILTERS } from '../utils/filters.js';
import { compositeExport, loadImg, STRIP_THEMES, DATE_FORMATS } from '../utils/export.js';
import { downloadBlob, pngFilename } from '../utils/canvas.js';
import { playClick, playDownload } from '../utils/sounds.js';
import Dropdown from './Dropdown.jsx';
import ShareSheet from './ShareSheet.jsx';
import { buildShareLink, editorToDesign } from '../utils/share.js';
import './camera.css';
import './finalOutput.css';

/* ── Options ── */
export const FRAMES = [
  { id: 'classic', label: 'Classic' }, { id: 'minimal', label: 'Minimal' }, { id: 'film', label: 'Film' },
  { id: 'vintage', label: 'Vintage' }, { id: 'polaroid', label: 'Polaroid' }, { id: 'rounded', label: 'Rounded' },
  { id: 'none', label: 'No Frame' },
];
const BGS = [
  { id: 'cream', label: 'Cream' }, { id: 'white', label: 'White' }, { id: 'ink', label: 'Dark' }, { id: 'pink', label: 'Pink' },
];
const BG_STYLES = [
  { id: 'solid', label: 'Plain' }, { id: 'dots', label: 'Dots' }, { id: 'stripes', label: 'Stripes' }, { id: 'grid', label: 'Grid' },
];
const BASE_LAYOUT = { spacing: 24, padding: 24, border: 0, radius: 0, stickers: [] };
export const STYLE_PRESETS = [
  { id: 'classic',  label: 'Classic',  patch: { bgColor: 'cream', frameStyle: 'classic',  bgStyle: 'solid' } },
  { id: 'minimal',  label: 'Minimal',  patch: { bgColor: 'white', frameStyle: 'minimal',  bgStyle: 'solid', spacing: 16 } },
  { id: 'romantic', label: 'Romantic', patch: { bgColor: 'pink',  frameStyle: 'rounded',  bgStyle: 'dots', radius: 12, stickers: ['heart', 'sparkle'] } },
  { id: 'film',     label: 'Film',     patch: { bgColor: 'ink',   frameStyle: 'film',     bgStyle: 'solid' } },
  { id: 'vintage',  label: 'Vintage',  patch: { bgColor: 'cream', frameStyle: 'vintage',  bgStyle: 'stripes' } },
  { id: 'clean',    label: 'Clean',    patch: { bgColor: 'white', frameStyle: 'none',     bgStyle: 'solid', spacing: 12, padding: 16 } },
  { id: 'dark',     label: 'Dark',     patch: { bgColor: 'ink',   frameStyle: 'minimal',  bgStyle: 'grid' } },
  { id: 'pink',     label: 'Pink',     patch: { bgColor: 'pink',  frameStyle: 'classic',  bgStyle: 'solid' } },
];
const STICKERS = [
  { id: 'star', label: 'Star', Icon: Star }, { id: 'heart', label: 'Heart', Icon: Heart }, { id: 'sparkle', label: 'Sparkle', Icon: Sparkles },
  { id: 'crown', label: 'Crown', Icon: Crown }, { id: 'moon', label: 'Moon', Icon: Moon }, { id: 'camera', label: 'Camera', Icon: Camera },
];
const STICKER_SPOTS = [[.10, .025], [.90, .275], [.10, .525], [.90, .775], [.88, .025], [.12, .975]];
const STICKER_COLORS = [{ id: 'pink', label: 'Pink', c: '#EB6380' }, { id: 'cream', label: 'Cream', c: '#F2EBE7' }, { id: 'dark', label: 'Dark', c: '#191516' }];
const ADJUSTS = [
  { key: 'brightness', label: 'Brightness', min: 50, max: 150 },
  { key: 'contrast',   label: 'Contrast',   min: 50, max: 150 },
  { key: 'saturation', label: 'Saturation', min: 0,  max: 200 },
  { key: 'grain',      label: 'Grain',      min: 0,  max: 60 },
];
const POS = [{ id: 'top', label: 'Top' }, { id: 'bottom', label: 'Bottom' }];
const SIZES = [{ id: 'sm', label: 'Small' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Large' }];
const dateLabel = id => DATE_FORMATS.find(f => f.id === id)?.label ?? '';

/* ── Small building blocks ── */
function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`pb-sw ${on ? 'is-on' : ''}`} onClick={onChange} />;
}

function Slider({ label, value, min, max, onChange, suffix = '' }) {
  return (
    <div className="fo-slider">
      <label>{label}<b>{value}{suffix}</b></label>
      <input type="range" min={min} max={max} value={value} aria-label={label}
             style={{ '--fill': `${((value - min) / (max - min)) * 100}%` }}
             onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="fo-seg" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className="fo-seg-b" onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return <div className="fo-field"><span className="pb-label">{label}</span>{children}</div>;
}

/** One collapsible row. Collapsed content is `visibility:hidden` so it can't be tabbed into. */
function Section({ id, icon, title, value, open, onToggle, children }) {
  return (
    <div className={`fo-acc ${open ? 'is-open' : ''}`}>
      <button type="button" className="fo-acc-h" id={`fo-h-${id}`} aria-expanded={open} aria-controls={`fo-p-${id}`} onClick={onToggle}>
        <span className="fo-ic">{icon}</span>
        <span className="fo-acc-t">{title}</span>
        {value && <span className="fo-acc-v">{value}</span>}
        <ChevronDown className="fo-chev" size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="fo-acc-b" id={`fo-p-${id}`} role="region" aria-labelledby={`fo-h-${id}`}>
        <div className="fo-acc-in"><div className="fo-acc-pad">{children}</div></div>
      </div>
    </div>
  );
}

/** Filter thumbnails are rendered with the real filter code on a tiny canvas, so they match the result. */
function useFilterThumbs(url) {
  const [thumbs, setThumbs] = useState({});
  useEffect(() => {
    if (!url) return;
    let dead = false;
    (async () => {
      try {
        const img = await loadImg(url);
        const W = 168, H = 126;
        const base = document.createElement('canvas'); base.width = W; base.height = H;
        const bc = base.getContext('2d');
        const ar = img.width / img.height, car = W / H;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (ar > car) { sw = img.height * car; sx = (img.width - sw) / 2; } else { sh = img.width / car; sy = (img.height - sh) / 2; }
        bc.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
        const out = {};
        for (const f of FILTERS) {
          if (dead) return;
          const c = document.createElement('canvas'); c.width = W; c.height = H;
          const cx = c.getContext('2d', { willReadFrequently: true });
          cx.drawImage(base, 0, 0);
          f.apply(cx, W, H, 1);
          out[f.id] = c.toDataURL('image/jpeg', 0.82);
          await new Promise(r => setTimeout(r, 0));
        }
        if (!dead) setThumbs(out);
      } catch { /* thumbnails are optional */ }
    })();
    return () => { dead = true; };
  }, [url]);
  return thumbs;
}

export default function PhotoEditor({
  photoUrls, filterId, onFilterChange, intensity, onIntensityChange,
  editorState: es, onStateChange, onResetEditor, onRetake, onSave, soundEnabled,
}) {
  const uid = useId();
  const { adjustments } = es;

  const [open, setOpen] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rendering, setRendering] = useState(true);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  /* Auto-generated share link: always matches the current design, no click needed */
  const shareLink = useMemo(
    () => buildShareLink(editorToDesign(es, filterId, intensity)),
    [es, filterId, intensity]
  );
  const [msg, setMsg] = useState({ text: '', err: false });
  const lastUrl = useRef(null);
  const savedRef = useRef(false);
  const msgTimer = useRef(0);
  const thumbs = useFilterThumbs(photoUrls[0]);

  /* single source of truth: used by the live preview AND the downloaded file */
  const buildOpts = useCallback(() => ({
    filterId, intensity: intensity / 100,
    adjustments, frameStyle: es.frameStyle, layout: 'strip', bgColor: es.bgColor, bgStyle: es.bgStyle,
    spacing: es.spacing, padding: es.padding, border: es.border, radius: es.radius,
    caption: es.showCaption ? es.caption : '', text: es.showText ? es.text : '',
    textPos: es.textPos, fontSize: es.fontSize,
    showDate: es.showDate, dateFormat: es.dateFormat, datePos: es.datePos,
    stickers: STICKERS.filter(s => es.stickers.includes(s.id)).map((s, i) => ({
      id: s.id, x: STICKER_SPOTS[i % STICKER_SPOTS.length][0], y: STICKER_SPOTS[i % STICKER_SPOTS.length][1],
      scale: es.stickerSize, color: es.stickerColor,
    })),
    showNumbers: es.showNumbers, mirror: false,
  }), [filterId, intensity, adjustments, es]);

  /* Live preview: small render, debounced, stale renders are dropped */
  useEffect(() => {
    if (!photoUrls.length) return;
    let cancelled = false;
    setRendering(true);
    const t = setTimeout(async () => {
      try {
        const blob = await compositeExport(photoUrls, { ...buildOpts(), previewWidth: 720 });
        if (cancelled || !blob) return;
        const url = URL.createObjectURL(blob);
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
        lastUrl.current = url;
        setPreviewUrl(url);
      } catch (e) {
        console.error('Preview failed', e);
        if (!cancelled) flash('Preview could not be updated. Try another setting.', true);
      } finally { if (!cancelled) setRendering(false); }
    }, 120);
    return () => { cancelled = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrls, buildOpts]);
  useEffect(() => () => { if (lastUrl.current) URL.revokeObjectURL(lastUrl.current); clearTimeout(msgTimer.current); }, []);

  function flash(t, err = false) {
    clearTimeout(msgTimer.current);
    setMsg({ text: t, err });
    msgTimer.current = setTimeout(() => setMsg({ text: '', err: false }), 3200);
  }
  const makeFinal = () => compositeExport(photoUrls, buildOpts());   // full resolution, every edit included
  const afterExport = blob => { if (!savedRef.current) { savedRef.current = true; onSave?.(blob); } };
  const run = async (fn, failText) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch (e) { console.error(e); flash(failText, true); } finally { setBusy(false); }
  };

  const handleDownload = () => run(async () => {
    const blob = await makeFinal();
    if (!blob) throw new Error('empty');
    playDownload(soundEnabled);
    downloadBlob(blob, pngFilename());
    afterExport(blob);
    flash('Saved! Check your downloads.');
  }, 'Download failed. Please try again.');

  /* Share button → sheet with the generated unique link (copy / native share) + the finished image */
  const handleShare = () => {
    playClick(soundEnabled);
    setShareOpen(true);
  };

  const shareImage = async () => {
    const blob = await makeFinal();
    if (!blob) throw new Error('empty');
    const file = new File([blob], 'oldluna-photostrip.png', { type: 'image/png' });
    afterExport(blob);
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'My OldLuna photo strip' }); return 'Shared!'; }
      catch (e) { if (e.name === 'AbortError') return ''; throw e; }
    }
    downloadBlob(blob, pngFilename());
    return 'Image sharing isn’t supported here, so your strip was downloaded.';
  };

  const handlePrint = () => {
    const w = window.open('', '_blank'); // open now so pop-up blockers allow it
    if (!w) { flash('Allow pop-ups to print your strip.', true); return; }
    run(async () => {
      const blob = await makeFinal();
      afterExport(blob);
      const url = URL.createObjectURL(blob);
      w.document.write(`<!doctype html><title>OldLuna</title><style>@page{margin:8mm}body{margin:0;display:grid;place-items:center}img{max-width:100%;max-height:100vh}</style><img src="${url}" onload="setTimeout(()=>print(),200)">`);
      w.document.close();
    }, 'Printing failed. Try downloading instead.');
  };

  const handleDelete = () => { if (window.confirm('Discard these photos and retake?')) { playClick(soundEnabled); onRetake(); } };
  const click = fn => (...a) => { playClick(soundEnabled); fn(...a); };
  const toggle = id => click(() => setOpen(o => (o === id ? null : id)));

  /* edits that change the look flip the Style dropdown to "Custom" */
  const edit = patch => onStateChange({ ...patch, stylePreset: 'custom' });
  const applyPreset = id => {
    const p = STYLE_PRESETS.find(x => x.id === id);
    if (p) { playClick(soundEnabled); onStateChange({ ...BASE_LAYOUT, ...p.patch, stylePreset: id }); }
  };
  const toggleSticker = id => click(() => edit({ stickers: es.stickers.includes(id) ? es.stickers.filter(s => s !== id) : [...es.stickers, id] }))();

  const bgLabel = BGS.find(b => b.id === es.bgColor)?.label ?? '';
  const status = busy ? 'Saving…' : rendering ? 'Updating…' : 'Ready';

  return (
    <div className="pb-screen fo">
      <main className="fo-main">
        {/* ── Final strip ── */}
        <section className="fo-prev" aria-label="Final strip preview">
          <span className="fo-status" role="status" aria-live="polite"><i className={rendering || busy ? 'is-busy' : ''} />{status}</span>
          <div className="fo-prev-card">
            {previewUrl
              ? <img src={previewUrl} alt="Your photo strip preview" className={rendering ? 'is-busy' : ''} draggable={false} />
              : <div className="fo-prev-skel" aria-hidden="true" />}
          </div>
        </section>

        <div className="fo-side">
          {/* ── Style ── */}
          <section className="pb-card" aria-labelledby={`${uid}-style`}>
            <div><span className="pb-eyebrow" id={`${uid}-style`}>Style</span><h2>Choose filter</h2></div>

            <div className="fo-filters" role="radiogroup" aria-label="Photo filters">
              {FILTERS.map(f => (
                <button key={f.id} type="button" role="radio" aria-checked={f.id === filterId} className="fo-fi"
                        onClick={click(() => onFilterChange(f.id))}>
                  <span className="fo-fi-t">{thumbs[f.id] && <img src={thumbs[f.id]} alt="" draggable={false} />}</span>
                  <span className="fo-fi-l">{f.label}</span>
                </button>
              ))}
            </div>
            {filterId !== 'normal' && <Slider label="Filter intensity" value={intensity} min={0} max={100} suffix="%" onChange={onIntensityChange} />}

            <div className="fo-line">
              <span className="fo-line-l">Choose Style</span>
              <Dropdown label="Choose style" value={es.stylePreset} options={STYLE_PRESETS} placeholder="Custom" onChange={applyPreset} />
            </div>
            <div className="fo-line">
              <span className="fo-line-l">Choose Frame</span>
              <Dropdown label="Choose frame" value={es.frameStyle} options={FRAMES} onChange={id => { playClick(soundEnabled); edit({ frameStyle: id }); }} />
            </div>

            <Section id="adjust" icon={<Sparkles size={18} />} title="Adjust" open={open === 'adjust'} onToggle={toggle('adjust')}>
              {ADJUSTS.map(a => (
                <Slider key={a.key} label={a.label} value={adjustments[a.key] ?? 0} min={a.min} max={a.max}
                        onChange={v => onStateChange({ adjustments: { ...adjustments, [a.key]: v } })} />
              ))}
              <button type="button" className="fo-link"
                      onClick={click(() => onStateChange({ adjustments: { brightness: 100, contrast: 100, saturation: 100, grain: 0 } }))}>Reset adjustments</button>
            </Section>
          </section>

          {/* ── Customize ── */}
          <section className="pb-card" aria-labelledby={`${uid}-cust`}>
            <div><span className="pb-eyebrow" id={`${uid}-cust`}>Customize</span><h2>Make it yours</h2></div>

            <div className="fo-rows">
              <div className={`fo-row ${es.showCaption ? '' : 'is-off'}`}>
                <Type size={18} aria-hidden="true" />
                <input className="fo-in" value={es.caption} maxLength={24} disabled={!es.showCaption} placeholder="Name" aria-label="Name"
                       onChange={e => onStateChange({ caption: e.target.value })} />
                <Switch on={es.showCaption} label="Show name" onChange={click(() => onStateChange({ showCaption: !es.showCaption }))} />
              </div>
              <div className={`fo-row ${es.showText ? '' : 'is-off'}`}>
                <Type size={18} aria-hidden="true" />
                <input className="fo-in" value={es.text} maxLength={32} disabled={!es.showText} placeholder="Caption" aria-label="Caption"
                       onChange={e => onStateChange({ text: e.target.value })} />
                <Switch on={es.showText} label="Show caption" onChange={click(() => onStateChange({ showText: !es.showText }))} />
              </div>
              <div className={`fo-row ${es.showDate ? '' : 'is-off'}`}>
                <Calendar size={18} aria-hidden="true" />
                <span className="fo-in fo-in--label">Date<small>{dateLabel(es.dateFormat)}</small></span>
                <Switch on={es.showDate} label="Show date" onChange={click(() => onStateChange({ showDate: !es.showDate }))} />
              </div>
            </div>

            <Section id="text" icon={<Type size={18} />} title="Text" value={`${es.textPos === 'top' ? 'Top' : 'Bottom'} · ${SIZES.find(s => s.id === es.fontSize)?.label}`}
                     open={open === 'text'} onToggle={toggle('text')}>
              <Field label="Position"><Segmented label="Text position" value={es.textPos} options={POS} onChange={v => onStateChange({ textPos: v })} /></Field>
              <Field label="Font size"><Segmented label="Font size" value={es.fontSize} options={SIZES} onChange={v => onStateChange({ fontSize: v })} /></Field>
            </Section>

            <Section id="date" icon={<Calendar size={18} />} title="Date" value={dateLabel(es.dateFormat)} open={open === 'date'} onToggle={toggle('date')}>
              <Field label="Date format"><Dropdown label="Date format" value={es.dateFormat} options={DATE_FORMATS} onChange={v => onStateChange({ dateFormat: v })} /></Field>
              <Field label="Position"><Segmented label="Date position" value={es.datePos} options={POS} onChange={v => onStateChange({ datePos: v })} /></Field>
            </Section>

            <Section id="layout" icon={<Frame size={18} />} title="Layout" open={open === 'layout'} onToggle={toggle('layout')}>
              <Slider label="Photo spacing" value={es.spacing} min={0} max={60} suffix="px" onChange={v => edit({ spacing: v })} />
              <Slider label="Padding" value={es.padding} min={8} max={60} suffix="px" onChange={v => edit({ padding: v })} />
              <Slider label="Border" value={es.border} min={0} max={24} suffix="px" onChange={v => edit({ border: v })} />
              <Slider label="Border radius" value={es.radius} min={0} max={40} suffix="px" onChange={v => edit({ radius: v })} />
            </Section>

            <Section id="bg" icon={<Palette size={18} />} title="Background" value={bgLabel} open={open === 'bg'} onToggle={toggle('bg')}>
              <Field label="Background">
                <div className="fo-swatches" role="radiogroup" aria-label="Background colour">
                  {BGS.map(b => (
                    <button key={b.id} type="button" role="radio" aria-checked={es.bgColor === b.id} aria-label={b.label} title={b.label}
                            className="fo-swatch" style={{ '--c': STRIP_THEMES[b.id].bg }} onClick={click(() => edit({ bgColor: b.id }))} />
                  ))}
                </div>
              </Field>
              <Field label="Background style">
                <Dropdown label="Background style" value={es.bgStyle} options={BG_STYLES} onChange={v => { playClick(soundEnabled); edit({ bgStyle: v }); }} />
              </Field>
            </Section>

            <div className="fo-actions">
              <button type="button" className="pb-btn pb-btn--primary fo-act-dl" onClick={handleDownload} disabled={busy} aria-label="Download PNG"><Download size={18} /><span>Download</span></button>
              <button type="button" className="pb-btn pb-btn--ghost" onClick={handleShare} aria-label="Share"><Share2 size={18} /><span>Share</span></button>
              <button type="button" className="pb-btn pb-btn--ghost" onClick={handlePrint} disabled={busy} aria-label="Print"><Printer size={18} /><span>Print</span></button>
              <button type="button" className="pb-btn pb-btn--ghost" onClick={handleDelete} disabled={busy} aria-label="Delete photos"><Trash2 size={18} /><span>Delete</span></button>
            </div>
            <p className={`fo-msg ${msg.err ? 'is-err' : ''}`} role="status" aria-live="polite">
              {busy ? 'Preparing your full-resolution strip…' : msg.text}
            </p>
                      </section>
        </div>
      </main>
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} link={shareLink} onShareImage={shareImage} />
    </div>
  );
}
