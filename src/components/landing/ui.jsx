/**
 * Reusable landing-page primitives: icons, Button, Section, Card.
 * Icons are inline SVGs (no icon-font dependency).
 */

const ICONS = {
  camera:  <><path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-1.6A1 1 0 0 1 9.5 4h5a1 1 0 0 1 .8.4L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/><circle cx="12" cy="12.5" r="3.5"/></>,
  sliders: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></>,
  timer:   <><circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2.2 1.5M9.5 3h5"/></>,
  download:<><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/></>,
  filter:  <><circle cx="9" cy="9" r="5"/><circle cx="15" cy="9" r="5"/><circle cx="12" cy="15" r="5"/></>,
  images:  <><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v10M3 15l4-4 4 4 3-3 3 3"/></>,
  layout:  <><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></>,
  wand:    <><path d="m5 19 9-9m-2-3 1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1ZM18 15l.6 1.4L20 17l-1.4.6L18 19l-.6-1.4L16 17l1.4-.6L18 15Z"/></>,
  image:   <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/></>,
  volume:  <><path d="M4 10v4h3l4 3.5v-11L7 10H4Z"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10"/></>,
  shield:  <><path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 9.5 4.1-1.9 7-5.3 7-9.5V6l-7-3Z"/><path d="m9 12 2.2 2.2L15.5 10"/></>,
  lock:    <><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  frame:   <><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><rect x="8" y="8" width="8" height="8" rx="1.5"/></>,
  sticker: <><path d="m12 3.5 2.4 5 5.4.7-4 3.7 1 5.4L12 15.6 7.2 18.3l1-5.4-4-3.7 5.4-.7L12 3.5Z"/></>,
  retake:  <><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/></>,
  mirror:  <><path d="M12 3v18M8 7 3 12l5 5V7ZM16 7l5 5-5 5V7Z"/></>,
  keyboard:<><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9"/></>,
  mobile:  <><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></>,
  left:    <><path d="m15 5-7 7 7 7"/></>,
  right:   <><path d="m9 5 7 7-7 7"/></>,
  plus:    <><path d="M12 5v14M5 12h14"/></>,
  share:   <><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.9 7.6-4.3M8.2 13.1l7.6 4.3"/></>,
  close:   <><path d="M6 6l12 12M18 6 6 18"/></>,
};

export function Icon({ name, size = 20, label, className = '' }) {
  return (
    <svg
      className={`lp-icon ${className}`}
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

/** variant: primary (red) | secondary (charcoal) | outline (thin pill) */
export function Button({ variant = 'primary', icon, children, className = '', ...rest }) {
  return (
    <button type="button" className={`lp-btn lp-btn--${variant} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={20} />}
      <span>{children}</span>
    </button>
  );
}

/** Section with one heading (title (accent word via <em>) + optional subtitle). */
export function Section({ id, title, subtitle, children, className = '', aside }) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} className={`lp-section ${className}`} aria-labelledby={headingId}>
      <div className="lp-container">
        <header className="lp-section-head fade-up">
          <div>
            <h2 id={headingId} className="lp-section-title">{title}</h2>
            {subtitle && <p className="lp-section-sub">{subtitle}</p>}
          </div>
          {aside}
        </header>
        {children}
      </div>
    </section>
  );
}

export function Card({ icon, title, children, step, tone = 'light', className = '' }) {
  return (
    <div className={`lp-card lp-card--${tone} fade-up ${className}`}>
      {step && <span className="lp-card-step">{step}</span>}
      {icon && <span className="lp-card-icon"><Icon name={icon} size={22} /></span>}
      <h3 className="lp-card-title">{title}</h3>
      <p className="lp-card-desc">{children}</p>
    </div>
  );
}
