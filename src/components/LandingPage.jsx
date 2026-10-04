import { useState, useEffect } from 'react';
import { playClick } from '../utils/sounds.js';
import { FILTERS } from '../utils/filters.js';
import { Button, Section, Card, Icon } from './landing/ui.jsx';
import { builderToDesign, designToBuilder } from '../utils/share.js';
import './landing/landing.css';

/* ── Scroll fade-up (CSS handles prefers-reduced-motion) ── */
function useFadeUp() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp .fade-up');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── Content ── */
const STEPS = [
  { icon: 'camera',   title: 'Set up camera',   desc: <>Allow access, pick your camera and flip the mirror if you like.</> },
  { icon: 'sliders',  title: 'Pick a filter',   desc: <>Choose one of 8 filters and set how strong it looks.</> },
  { icon: 'timer',    title: 'Smile',           desc: <>Hit start. A 5-second countdown, then 4 shots fire one by one.</> },
  { icon: 'download', title: 'Download',        desc: <>Edit, add a frame and a caption, then save your strip as a PNG.</> },
];

const FAQ_ITEMS = [
  { q: 'Do I need to install anything?', a: 'Nope—OldLuna works directly in your browser, so you can jump in instantly.' },
  { q: 'Why does it need my camera?', a: 'To show your live preview and capture each photo. Your images stay on your device and are never uploaded.' },
  { q: 'Which devices work?', a: 'Any modern phone, tablet, or desktop with a camera and a browser that supports webcam access.' },
  { q: 'What do I get?', a: 'A 4-photo strip with a 5-second timer, finished in a crisp high-resolution PNG.' },
  { q: 'Is it free?', a: 'Yes—completely free to use, with no app download required.' },
];


/* ── FAQ: one open at a time, height animation via grid rows ── */
function Faq() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="lp-faq fade-up">
      {FAQ_ITEMS.map((item, i) => {
        const open = openIdx === i;
        return (
          <div key={item.q} className={`lp-faq-item ${open ? 'is-open' : ''}`}>
            <h3>
              <button
                type="button"
                className="lp-faq-q"
                id={`faq-btn-${i}`}
                aria-expanded={open}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpenIdx(open ? null : i)}
              >
                <span>{item.q}</span>
                <span className="lp-faq-icon" aria-hidden="true"><Icon name="plus" size={20} /></span>
              </button>
            </h3>
            <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} className="lp-faq-panel">
              <div className="lp-faq-panel-inner"><p>{item.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Fanned photo strips (pure CSS) ── */
function StripFan() {
  const strips = ['left', 'center', 'right'];
  return (
    <div className="lp-fan-wrap" aria-hidden="true">
      <div className="lp-fan">
        {strips.map(pos => (
          <div key={pos} className={`lp-fan-strip lp-fan-strip--${pos}`}>
            {[0, 1, 2, 3].map(n => (
              <div key={n} className="lp-fan-frame"><span className="lp-fan-person" /></div>
            ))}
            <span className="lp-fan-brand">OldLuna</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Feature card ── */
function Feature({ icon, title, size = 'sm', children, extra }) {
  const iconNode = typeof icon === 'string' ? <Icon name={icon} size={22} /> : icon;

  return (
    <div className={`lp-feat lp-feat--${size} fade-up`}>
      <span className="lp-feat-icon">{iconNode}</span>
      <h3 className="lp-feat-title">{title}</h3>
      <p className="lp-feat-desc">{children}</p>
      {extra}
    </div>
  );
}

/* ── Strip builder (interactive) ── */
const B_LAYOUTS = [
  { id: 'strip',   label: 'Strip',  cols: 1, count: 4, w: 150 },
];
const B_FRAMES = [
  { id: 'none', label: 'Classic' }, { id: 'thin', label: 'Thin' }, { id: 'thick', label: 'Thick' },
  { id: 'rounded', label: 'Rounded' }, { id: 'film', label: 'Film' },
];
const B_COLORS = [
  { id: 'cream', label: 'Soft Cream',     bg: '#F2EBE7', tx: '#191516' },
  { id: 'clean', label: 'Pure White',     bg: '#FFFFFF', tx: '#000000' },
  { id: 'black', label: 'Midnight Black', bg: '#191516', tx: '#F2EBE7' },
  { id: 'film',  label: 'Vintage Film',   bg: '#C8BBA5', tx: '#29231F' },
  { id: 'pink',  label: 'OldLuna Pink',   bg: '#EB6380', tx: '#191516' },
];

const Chips = ({ items, value, onChange, label }) => (
  <div role="radiogroup" aria-label={label} className="lp-chips">
    {items.map(i => (
      <button key={i.id} type="button" role="radio" aria-checked={value === i.id}
        className={`lp-chip ${value === i.id ? 'is-active' : ''}`} onClick={() => onChange(i.id)}>
        {i.glyph ? <span aria-hidden="true">{i.glyph}</span> : null}{i.label}
      </button>
    ))}
  </div>
);

const B_DEFAULT = { frame: 'thin', color: 'pink', caption: 'OldLuna', showDate: true };

/** Controlled: LandingPage owns the design so the Share button and the camera flow can use it. */
function StripBuilder({ design, onChange, onStart }) {
  const layout = 'strip';
  const { frame, color, caption, showDate } = design;
  const setFrame    = v => onChange({ frame: v });
  const setColor    = v => onChange({ color: v });
  const setCaption  = v => onChange({ caption: v });
  const setShowDate = fn => onChange({ showDate: typeof fn === 'function' ? fn(showDate) : fn });

  const L = B_LAYOUTS.find(l => l.id === layout);
  const C = B_COLORS.find(c => c.id === color);
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const reset = () => onChange(B_DEFAULT);
  const shuffle = () => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)].id;
    onChange({ frame: pick(B_FRAMES), color: pick(B_COLORS) });
  };

  return (
    <div className="lp-build fade-up">
      <div className="lp-build-panel">
        <div><p className="lp-group-label">Frame</p><Chips items={B_FRAMES} value={frame} onChange={setFrame} label="Frame style" /></div>
        <div>
          <p className="lp-group-label">Strip color</p>
          <div className="lp-colors" role="radiogroup" aria-label="Strip color">
            {B_COLORS.map(c => (
              <button key={c.id} type="button" role="radio" aria-checked={color === c.id} aria-label={c.label} title={c.label}
                className={`lp-color ${color === c.id ? 'is-active' : ''}`} style={{ '--c': c.bg }} onClick={() => setColor(c.id)} />
            ))}
          </div>
        </div>
        <div>
          <p className="lp-group-label">Caption</p>
          <input className="lp-input" value={caption} maxLength={24} onChange={e => setCaption(e.target.value)} placeholder="Add a caption…" aria-label="Caption" />
        </div>
        <div>
          <button type="button" role="switch" aria-checked={showDate} className={`lp-chip ${showDate ? 'is-active' : ''}`} onClick={() => setShowDate(v => !v)}>
            <Icon name="timer" size={16} />Date stamp
          </button>
        </div>
        <div className="lp-build-actions">
          <Button variant="primary" icon="camera" onClick={onStart}>Shoot this strip</Button>
          <Button variant="outline" icon="wand" onClick={shuffle}>Surprise me</Button>
          <Button variant="outline" icon="retake" onClick={reset}>Reset</Button>
        </div>
      </div>

      <div className="lp-stage" aria-live="polite">
        <div className={`lp-sheet lp-sheet--${frame} lp-sheet--${layout}`} style={{ '--bd': C.bg, '--tx': C.tx, '--sw': `${L.w}px` }}>
          <div className="lp-sheet-grid" style={{ '--cols': L.cols }}>
            {Array.from({ length: L.count }).map((_, i) => (
              <div className="lp-cell" key={i}>
              </div>
            ))}
          </div>
          <p className="lp-sheet-cap">{caption || '\u00A0'}</p>
          {showDate && <p className="lp-sheet-date">{date}</p>}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onStart, soundEnabled, shared = null }) {
  useFadeUp();

  /* Builder design — seeded from a shared link when there is one */
  const [design, setDesign] = useState(() => (shared ? designToBuilder(shared.design) : B_DEFAULT));
  const [touched, setTouched] = useState(!!shared);   // only carry the design into the booth if the visitor chose one
  const [banner, setBanner]   = useState(!!shared);

  const patchDesign = patch => { setDesign(d => ({ ...d, ...patch })); setTouched(true); };
  const currentDesign = () => builderToDesign(design);

  const handleStart = () => { playClick(soundEnabled); onStart(touched ? currentDesign() : null); };
  const handleShootDesign = () => { playClick(soundEnabled); onStart(currentDesign()); };

  const swatches = (
    <ul className="lp-filter-list" aria-label="Available filters">
      {FILTERS.map(f => (
        <li key={f.id} className="lp-filter-item">
          <strong className="lp-hl-title">{f.label}</strong>
          <small>{f.tagline}</small>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="lp">
      <header className="lp-top">
        <div className="lp-container lp-top-in">
          <span className="lp-wordmark"><i className="fa-solid fa-moon" aria-hidden="true"></i><span>Old<span className="lp-luna">Luna</span></span></span>
        </div>
      </header>
      {banner && (
        <div className="lp-banner" role="status">
          <div className="lp-container lp-banner-in">
            <p><strong>A friend shared a strip design with you.</strong> It’s loaded in the builder below.</p>
            <div className="lp-banner-actions">
              <Button variant="primary" icon="camera" className="lp-btn--sm" onClick={handleShootDesign}>Shoot this strip</Button>
              <button type="button" className="lp-banner-x" onClick={() => setBanner(false)} aria-label="Dismiss"><Icon name="close" size={18} /></button>
            </div>
          </div>
        </div>
      )}
      <main>
        {/* ── Hero ── */}
        <div className="lp-hero">
          <div className="lp-container lp-hero-inner">
            <div className="lp-hero-text">
              <h1 className="lp-h1">Memories made into <span className="lp-hl-title">photo strips.</span></h1>
              <p className="lp-lead">Take four photos, choose your filter and frame, then download your high-resolution strip.</p>
              <div className="lp-cta-group">
                <Button variant="primary" icon="camera" className="lp-btn--lg" onClick={handleStart}>Start photobooth</Button>
                <p className="lp-helper"><Icon name="lock" size={14} />Camera access required</p>
              </div>
            </div>
            <StripFan />
          </div>
        </div>

        <Section id="how" title={<><span>How it</span> <span className="lp-hl-title">works.</span></>}
          subtitle="Create, customize, and enjoy your photo strip in four steps.">
          <div className="lp-grid lp-grid--4 lp-steps">
            {STEPS.map((s, i) => (
              <Card key={s.title} step={String(i + 1).padStart(2, '0')} icon={s.icon} title={s.title}>{s.desc}</Card>
            ))}
          </div>
        </Section>
        <Section id="features" title={<><span>All Features</span> <span className="lp-hl-title">included</span></>}
          subtitle="Everything you need for the perfect photo strip.">
          <div className="lp-bento">
            <Feature size="xl" icon="filter" title="8 filters" extra={swatches}>Switch looks anytime, with 0–100% intensity. Skin tones and details stay true.</Feature>
            <Feature icon="layout" title="Classic photo strip">Four frames, stacked in one tall strip.</Feature>
            <Feature icon="timer" title="5-second timer">Plenty of time to strike a pose.</Feature>
            <Feature icon="wand" title="Photo editor">Tune filter intensity, brightness, contrast, saturation and grain.</Feature>
            <Feature icon="frame" title="6 frame styles">Thin, thick, rounded, film and more.</Feature>
            <Feature icon="sticker" title="Captions & date">Add your name, a message and a date stamp.</Feature>
            <Feature icon="retake" title="Retake & reorder">Redo any shot, drag photos into order.</Feature>
            <Feature icon="camera" title="Full HD camera">Pick your camera and shoot in 1920×1080, with a mirror toggle.</Feature>
            <Feature icon="image" title="High-res PNG">Save your finished strip in one click.</Feature>
          </div>
        </Section>
        <Section id="builder" title={<><span>Personalize your</span> <span className="lp-hl-title">strip</span></>}
          subtitle="Customize your frames, colors, and captions. Preview it live and capture your moments.">
          <StripBuilder design={design} onChange={patchDesign} onStart={handleShootDesign} />
        </Section>

        <section className="lp-section lp-section--tight" aria-labelledby="privacy-heading">
          <div className="lp-container">
            <div className="lp-privacy fade-up">
              <span className="lp-privacy-icon"><Icon name="shield" size={30} label="Privacy shield" /></span>
              <div>
                <h2 id="privacy-heading" className="lp-privacy-title">Your photos stay with you</h2>
                <p className="lp-privacy-desc">
                  Photos are processed in your browser and never uploaded by the app.
                  Nothing leaves your device unless you choose to download it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="lp-section" aria-labelledby="faq-heading">
          <div className="lp-container lp-faq-layout">
            <div className="lp-faq-head">
              <header className="lp-section-head fade-up">
                <div>
                 <h2 id="faq-heading" className="lp-section-title">Frequently Asked <span className="lp-hl-title">Questions</span></h2>
                 <p className="lp-section-sub">Quick answers to help you create, customize, and capture your perfect photo strip.</p>
                </div>
              </header>
            </div>
            <Faq />
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <span className="lp-footer-logo">
              <i className="fa-solid fa-moon" aria-hidden="true"></i>
              <span>Old<span className="lp-luna">Luna</span></span>
            </span>
            <span className="lp-footer-tag">✦ Where every moment becomes timeless.</span>
          </div>
          <div className="lp-footer-meta">
          <span>Designed &amp; built by <strong style={{ color: '#FA8FBA' }}>coziestine develops</strong></span>  
          <span>© 2026 OldLuna</span>
          </div>
        </div>
      </footer>

    </div>
  );
}