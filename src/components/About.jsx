export default function About({ onStart }) {
  return (
    <main className="ab-page" aria-labelledby="ab-heading">
      <div className="ab-inner">
        <div className="ab-decoration" aria-hidden="true">
          <span className="ab-deco-line" />
          <i className="fa-solid fa-camera-retro ab-deco-icon" />
          <span className="ab-deco-line" />
        </div>

        <div className="ab-header">
          <span className="tag tag-purple">
            <i className="fa-solid fa-circle-info" aria-hidden="true" />
            About
          </span>
          <h1 id="ab-heading" className="ab-title">ABOUT OLDLUNA</h1>
        </div>

        <div className="ab-body">
          <p className="ab-lead">
            OldLuna is a minimal, aesthetic digital photobooth made for capturing
            simple moments, silly poses, and memories worth keeping.
          </p>
          <p className="ab-text">
            Inspired by arcade photobooths, vintage film cameras, and the quiet
            nostalgia of old photographs — OldLuna brings that experience to your
            browser, no account or installation required.
          </p>
          <blockquote className="ab-quote">
            "Made for memories. Inspired by yesterday."
          </blockquote>
        </div>

        <div className="ab-features">
          {[
            { icon: 'fa-solid fa-filter',             text: '6 signature filters with adjustable intensity, applied live and on export.' },
            { icon: 'fa-solid fa-images',             text: 'Single photo or multi-shot strips of 1, 3, 4, or 6.' },
            { icon: 'fa-solid fa-wand-magic-sparkles',text: 'Built-in photo editor: filter, adjust, frame, layout.' },
            { icon: 'fa-solid fa-camera-rotate',      text: 'Mirror toggle — what you see is what you get.' },
            { icon: 'fa-solid fa-volume-high',        text: 'Synthesised sounds: beeps, shutter, and a success chime.' },
            { icon: 'fa-solid fa-lock',               text: 'Fully local — nothing leaves your device.' },
          ].map(f => (
            <div key={f.text} className="ab-feature">
              <i className={`${f.icon} ab-feature-icon`} aria-hidden="true" />
              <span className="ab-feature-text">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="ab-divider" />

        <div className="ab-cta">
          <button className="ab-cta-btn" onClick={onStart}>
            <i className="fa-solid fa-gamepad" aria-hidden="true" />
            Start Photobooth
          </button>
        </div>
      </div>

      <style>{`
        .ab-page {
          min-height: calc(100vh - 56px); padding-top: 56px;
          display: flex; align-items: flex-start; justify-content: center;
        }
        .ab-inner {
          width: 100%; max-width: 640px;
          padding: var(--sp-12) var(--sp-6) var(--sp-16);
          display: flex; flex-direction: column; gap: var(--sp-8);
          animation: fadeIn 0.5s var(--ease);
        }
        .ab-decoration {
          display: flex; align-items: center; gap: var(--sp-3);
        }
        .ab-deco-line { flex: 1; height: 1px; background: var(--border); }
        .ab-deco-icon { color: var(--purple); font-size: 0.9rem; }

        .ab-header { display: flex; flex-direction: column; gap: var(--sp-3); }
        .ab-title {
          font-family: var(--font-mono); font-size: clamp(2rem, 6vw, 3.5rem);
          font-weight: 700; letter-spacing: 4px; color: var(--white); line-height: 1.1;
        }

        .ab-body { display: flex; flex-direction: column; gap: var(--sp-4); }
        .ab-lead {
          font-size: 1.05rem; color: var(--white); line-height: 1.7; font-style: italic;
        }
        .ab-text { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.8; }
        .ab-quote {
          border-left: 2px solid var(--purple); padding: var(--sp-3) var(--sp-5);
          font-style: italic; color: var(--purple); font-size: 0.95rem;
          background: var(--purple-faint); border-radius: 0 var(--r-sm) var(--r-sm) 0;
        }

        .ab-features {
          display: flex; flex-direction: column; gap: var(--sp-4);
          padding: var(--sp-6);
          background: var(--surface-1); border: 1px solid var(--border);
          border-radius: var(--r-lg);
        }
        .ab-feature { display: flex; align-items: flex-start; gap: var(--sp-3); }
        .ab-feature-icon { color: var(--purple); font-size: 0.85rem; margin-top: 2px; flex-shrink: 0; }
        .ab-feature-text { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; }

        .ab-divider { height: 1px; background: var(--border); }

        .ab-cta { display: flex; }
        .ab-cta-btn {
          display: inline-flex; align-items: center; gap: var(--sp-2);
          padding: 13px 28px;
          background: var(--purple); color: var(--white);
          border: none; border-radius: var(--r-sm);
          font-family: var(--font-mono); font-size: 0.88rem; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
          transition: background var(--t-fast), transform var(--t-fast) var(--ease-spring), box-shadow var(--t-fast);
          box-shadow: var(--shadow-purple);
        }
        .ab-cta-btn:hover { background: var(--purple-light); transform: translateY(-2px); }
        .ab-cta-btn:active { transform: translateY(0); }
      `}</style>
    </main>
  );
}
