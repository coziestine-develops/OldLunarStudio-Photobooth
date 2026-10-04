import { FILTERS } from '../utils/filters.js';
import { playFilterBlip } from '../utils/sounds.js';

const LP = {
  bg:     '#F2EBE7',
  card:   '#FFFFFF',
  ink:    '#191516',
  red:    '#EB6380',
  border: 'rgba(25,21,22,0.12)',
  muted:  'rgba(25,21,22,0.50)',
  font:   "'Poppins', system-ui, sans-serif",
};

/** Small illustrative portrait swatch graded with the filter's CSS approximation. */
function Swatch({ filter }) {
  return (
    <svg viewBox="0 0 58 58" aria-hidden="true" style={{ filter: filter.css }}>
      <defs>
        <linearGradient id={`fp2-sw-${filter.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8FA3B8" />
          <stop offset="1" stopColor="#D9A98F" />
        </linearGradient>
      </defs>
      <rect width="58" height="58" fill={`url(#fp2-sw-${filter.id})`} />
      <ellipse cx="29" cy="22" rx="12" ry="13" fill="#4A3426" />
      <ellipse cx="29" cy="27" rx="9" ry="11" fill="#E0B49C" />
      <path d="M15 58 Q29 42 43 58Z" fill="#F2EEE9" />
      <circle cx="25.5" cy="25" r="1.2" fill="#2A1810" />
      <circle cx="32.5" cy="25" r="1.2" fill="#2A1810" />
      <path d="M25.5 30.5 Q29 33 32.5 30.5" stroke="#8A4A3A" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * FilterPanel — filter picker + intensity slider.
 * Styled to match the landing page (cream bg, red accent, Poppins).
 * Used on the PhotoEditor screen.
 */
export default function FilterPanel({
  filterId, onFilterChange, intensity, onIntensityChange,
  disabled = false, soundEnabled = true,
}) {
  const active = FILTERS.find(f => f.id === filterId) ?? FILTERS[0];

  return (
    <div className="fp2-root">
      {/* Header */}
      <div className="fp2-head">
        <span className="fp2-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="9" r="5"/><circle cx="15" cy="9" r="5"/><circle cx="12" cy="15" r="5"/>
          </svg>
          Choose Filter
        </span>
        <span className="fp2-active-badge">{active.label}</span>
      </div>

      {/* Filter grid */}
      <div className="fp2-grid" role="radiogroup" aria-label="Photo filters">
        {FILTERS.map(f => {
          const on = f.id === filterId;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`fp2-item ${on ? 'fp2-item--on' : ''}`}
              disabled={disabled}
              onClick={() => { if (!on) playFilterBlip(soundEnabled); onFilterChange(f.id); }}
              aria-label={`${f.label} filter`}
              title={f.label}
            >
              <span className="fp2-thumb">
                <Swatch filter={f} />
              </span>
              <span className="fp2-label">{f.label}</span>
            </button>
          );
        })}
      </div>

      <p className="fp2-tagline">{active.tagline}</p>

      {/* Intensity slider */}
      <div className="fp2-intensity">
        <div className="fp2-int-head">
          <span className="fp2-int-label">INTENSITY</span>
          <span className="fp2-int-val">{intensity}%</span>
        </div>
        <input
          type="range"
          min={0} max={100} step={1}
          value={intensity}
          disabled={disabled}
          onChange={e => onIntensityChange(Number(e.target.value))}
          className="fp2-range"
          style={{ '--fill': `${intensity}%`, '--acc': LP.red }}
          aria-valuetext={`${intensity} percent`}
          aria-label="Filter intensity"
        />
      </div>

      <style>{`
        .fp2-root {
          width: 100%;
          display: flex; flex-direction: column; gap: 12px;
          font-family: ${LP.font};
        }

        /* Head */
        .fp2-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
        }
        .fp2-title {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: ${LP.muted};
        }
        .fp2-title svg { color: ${LP.red}; }
        .fp2-active-badge {
          font-size: 11px; font-weight: 700;
          color: ${LP.red};
          letter-spacing: 0.04em;
        }

        /* Filter grid */
        .fp2-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        @media (min-width: 600px) {
          .fp2-grid { grid-template-columns: repeat(6, 1fr); }
        }

        .fp2-item {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          padding: 6px 4px 8px;
          border-radius: 14px;
          border: 1.5px solid transparent;
          background: rgba(25,21,22,0.04);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .fp2-item:hover:not(:disabled) {
          background: rgba(25,21,22,0.07);
          transform: translateY(-2px);
        }
        .fp2-item:disabled { opacity: 0.35; cursor: not-allowed; }
        .fp2-item--on {
          border-color: ${LP.red};
          background: rgba(235,99,128,0.08);
          box-shadow: 0 0 0 3px rgba(235,99,128,0.15);
        }

        .fp2-thumb {
          width: 100%; aspect-ratio: 1; max-width: 72px;
          border-radius: 10px; overflow: hidden; display: block;
        }
        .fp2-thumb svg { width: 100%; height: 100%; display: block; }

        .fp2-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: ${LP.muted}; text-align: center; line-height: 1.2;
        }
        .fp2-item--on .fp2-label { color: ${LP.red}; }

        /* Tagline */
        .fp2-tagline {
          font-size: 12px; color: ${LP.muted};
          text-align: center; font-style: italic;
          min-height: 18px;
        }

        /* Intensity */
        .fp2-intensity {
          display: flex; flex-direction: column; gap: 8px;
          padding: 14px 16px;
          background: rgba(25,21,22,0.04);
          border: 1.5px solid ${LP.border};
          border-radius: 14px;
        }
        .fp2-int-head {
          display: flex; align-items: center; justify-content: space-between;
        }
        .fp2-int-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: ${LP.muted};
        }
        .fp2-int-val {
          font-size: 13px; font-weight: 700;
          color: ${LP.red};
        }
        .fp2-range {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 5px; border-radius: 999px;
          outline: none; cursor: pointer;
          background: linear-gradient(to right, var(--acc) var(--fill), rgba(25,21,22,0.12) var(--fill));
        }
        .fp2-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 2.5px solid var(--acc);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          cursor: pointer;
        }
        .fp2-range::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; border: 2.5px solid var(--acc);
        }
        .fp2-range:disabled { opacity: 0.35; cursor: not-allowed; }
        .fp2-range:focus-visible { outline: 2px solid ${LP.red}; outline-offset: 4px; }
      `}</style>
    </div>
  );
}
