import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { id: 'home',       label: 'Home',       icon: 'fa-solid fa-house' },
  { id: 'photobooth', label: 'Photobooth', icon: 'fa-solid fa-gamepad' },
  { id: 'gallery',    label: 'Memories',   icon: 'fa-solid fa-images' },
  { id: 'about',      label: 'About',      icon: 'fa-solid fa-gear' },
];

export default function Navbar({ currentPage, onNavigate, galleryCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [currentPage]);

  const go = (id) => { onNavigate(id); setMenuOpen(false); };

  return (
    <>
      <header className={`nb ${scrolled ? 'nb--scrolled' : ''}`} role="banner">
        <div className="nb-inner">
          {/* Logo */}
          <button className="nb-logo" onClick={() => go('home')} aria-label="OldLuna home">
            <i className="fa-solid fa-camera-retro nb-logo-icon" aria-hidden="true" />
            <span className="nb-logo-text">OLDLUNA</span>
          </button>

          {/* Desktop links */}
          <nav className="nb-links" aria-label="Main navigation">
            {NAV_LINKS.map(({ id, label, icon }) => (
              <button
                key={id}
                className={`nb-link ${currentPage === id ? 'nb-link--active' : ''}`}
                onClick={() => go(id)}
                aria-current={currentPage === id ? 'page' : undefined}
              >
                <i className={`${icon} nb-link-icon`} aria-hidden="true" />
                <span>{label}</span>
                {id === 'gallery' && galleryCount > 0 && (
                  <span className="nb-badge" aria-label={`${galleryCount} saved`}>
                    {galleryCount > 99 ? '99+' : galleryCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Mobile toggle */}
          <button
            className="nb-burger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="nb-drawer" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="nb-drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <nav className="nb-drawer-panel" aria-label="Mobile navigation">
            <div className="nb-drawer-head">
              <span className="nb-logo-text" style={{ fontSize: '1rem', letterSpacing: '3px' }}>OLDLUNA</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close" className="nb-drawer-close">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            {NAV_LINKS.map(({ id, label, icon }) => (
              <button
                key={id}
                className={`nb-drawer-link ${currentPage === id ? 'nb-drawer-link--active' : ''}`}
                onClick={() => go(id)}
              >
                <i className={`${icon}`} aria-hidden="true" />
                <span>{label}</span>
                {id === 'gallery' && galleryCount > 0 && (
                  <span className="nb-badge">{galleryCount}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      <style>{`
        .nb {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: background var(--t-normal) var(--ease), border-color var(--t-normal);
          border-bottom: 1px solid transparent;
        }
        .nb--scrolled {
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-color: var(--border);
        }
        .nb-inner {
          max-width: 1140px; margin: 0 auto;
          padding: 0 var(--sp-6);
          height: 56px;
          display: flex; align-items: center; gap: var(--sp-4);
        }
        .nb-logo {
          display: flex; align-items: center; gap: var(--sp-2);
          background: none; border: none; cursor: pointer;
          transition: opacity var(--t-fast);
        }
        .nb-logo:hover { opacity: 0.7; }
        .nb-logo-icon { color: var(--purple); font-size: 1rem; }
        .nb-logo-text {
          font-family: var(--font-mono); font-size: 0.95rem;
          font-weight: 700; letter-spacing: 3px; color: var(--white);
        }
        .nb-links {
          display: flex; align-items: center; gap: 2px; margin-left: auto;
        }
        .nb-link {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: var(--r-sm);
          font-family: var(--font-ui); font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text-secondary);
          background: none; border: none; cursor: pointer;
          transition: color var(--t-fast), background var(--t-fast);
          position: relative;
        }
        .nb-link-icon { font-size: 0.72rem; }
        .nb-link:hover { color: var(--white); background: rgba(255,255,255,0.06); }
        .nb-link--active { color: var(--white); }
        .nb-link--active::after {
          content: ''; position: absolute; bottom: 3px; left: 50%;
          transform: translateX(-50%); width: 16px; height: 2px;
          background: var(--purple); border-radius: var(--r-full);
        }
        .nb-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 17px; height: 17px; padding: 0 4px;
          border-radius: var(--r-full); background: var(--purple);
          color: var(--white); font-size: 0.6rem; font-weight: 700;
        }
        .nb-burger {
          display: none; align-items: center; justify-content: center;
          margin-left: auto; padding: var(--sp-2); color: var(--white);
          background: none; border: none; cursor: pointer; font-size: 1rem;
          border-radius: var(--r-sm); transition: background var(--t-fast);
        }
        .nb-burger:hover { background: rgba(255,255,255,0.08); }

        /* Drawer */
        .nb-drawer { position: fixed; inset: 0; z-index: 200; }
        .nb-drawer-backdrop {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
          animation: fadeInFast 0.18s;
        }
        .nb-drawer-panel {
          position: absolute; top: 0; right: 0; bottom: 0;
          width: min(300px, 88vw);
          background: var(--surface-2); border-left: 1px solid var(--border);
          padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-2);
          animation: slideInRight 0.22s var(--ease);
          box-shadow: -8px 0 32px rgba(0,0,0,0.8);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .nb-drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: var(--sp-4); padding-bottom: var(--sp-4);
          border-bottom: 1px solid var(--border);
        }
        .nb-drawer-close {
          background: none; border: none; cursor: pointer;
          color: var(--text-secondary); font-size: 1rem; padding: var(--sp-1);
        }
        .nb-drawer-link {
          display: flex; align-items: center; gap: var(--sp-3);
          width: 100%; padding: var(--sp-3) var(--sp-4);
          border-radius: var(--r-md); background: none; border: none;
          cursor: pointer; font-family: var(--font-ui); font-size: 0.9rem;
          font-weight: 500; color: var(--text-secondary);
          transition: background var(--t-fast), color var(--t-fast);
          text-align: left;
        }
        .nb-drawer-link:hover { background: var(--surface-4); color: var(--white); }
        .nb-drawer-link--active { background: var(--surface-3); color: var(--white); }

        @media (max-width: 640px) {
          .nb-links { display: none; }
          .nb-burger { display: flex; }
        }
      `}</style>
    </>
  );
}
