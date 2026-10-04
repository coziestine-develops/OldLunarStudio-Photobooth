import { PHOTO_COUNTS } from '../hooks/useCapture.js';
import { playClick } from '../utils/sounds.js';

const LAYOUT_OPTIONS = [
  { value: 'strip', label: 'Strip', icon: 'fa-solid fa-grip-lines-vertical' },
  { value: 'grid',  label: 'Grid',  icon: 'fa-solid fa-table-cells-large' },
];

export default function CameraControls({
  photoCount, onPhotoCountChange,
  layout,     onLayoutChange,
  mirror,     onMirrorToggle,
  soundEnabled, onSoundToggle,
  onCapture,
  onCancel,
  isCapturing,
  isReady,
  currentShot,
  totalShots,
  captureState,
  soundEnabledProp,
}) {
  const disabled = isCapturing || !isReady;

  const handleCount = (c) => { playClick(soundEnabled); onPhotoCountChange(c); };
  const handleLayout= (l) => { playClick(soundEnabled); onLayoutChange(l); };
  const handleMirror= ()  => { playClick(soundEnabled); onMirrorToggle(); };
  const handleSound = ()  => { onSoundToggle(); };

  const captureLabel = isCapturing
    ? (totalShots > 1 ? `CAPTURE ${currentShot} / ${totalShots}` : 'CAPTURING…')
    : (totalShots > 1 && currentShot > 0
        ? `CAPTURE ${currentShot + 1} / ${totalShots}`
        : 'CAPTURE');

  return (
    <div className="cc-root">
      {/* Row 1: Photo count + Layout */}
      <div className="cc-row">
        {/* Photo count */}
        <div className="cc-group">
          <span className="cc-group-label">
            <i className="fa-solid fa-images" aria-hidden="true" />
            PHOTOS
          </span>
          <div className="cc-seg" role="group" aria-label="Number of photos">
            {PHOTO_COUNTS.map(c => (
              <button
                key={c}
                className={`cc-seg-btn ${photoCount === c ? 'cc-seg-btn--active' : ''}`}
                disabled={isCapturing}
                onClick={() => handleCount(c)}
                aria-pressed={photoCount === c}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Layout (only relevant for multi-photo) */}
        {photoCount > 1 && (
          <div className="cc-group">
            <span className="cc-group-label">
              <i className="fa-solid fa-table-cells-large" aria-hidden="true" />
              LAYOUT
            </span>
            <div className="cc-seg" role="group" aria-label="Layout">
              {LAYOUT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  className={`cc-seg-btn ${layout === o.value ? 'cc-seg-btn--active' : ''}`}
                  disabled={isCapturing}
                  onClick={() => handleLayout(o.value)}
                  aria-pressed={layout === o.value}
                  aria-label={o.label}
                >
                  <i className={o.icon} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mirror */}
        <div className="cc-group">
          <span className="cc-group-label">
            <i className="fa-solid fa-camera-rotate" aria-hidden="true" />
            MIRROR
          </span>
          <button
            className={`cc-toggle ${mirror ? 'cc-toggle--on' : ''}`}
            disabled={isCapturing}
            onClick={handleMirror}
            aria-pressed={mirror}
            aria-label={mirror ? 'Mirror on' : 'Mirror off'}
          >
            <span className="cc-toggle-thumb" />
          </button>
        </div>

        {/* Sound */}
        <div className="cc-group">
          <span className="cc-group-label">
            <i className={`fa-solid ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`} aria-hidden="true" />
            SOUND
          </span>
          <button
            className={`cc-toggle ${soundEnabled ? 'cc-toggle--on' : ''}`}
            onClick={handleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Sound on' : 'Sound off'}
          >
            <span className="cc-toggle-thumb" />
          </button>
        </div>
      </div>

      {/* Row 2: Big Capture button */}
      <div className="cc-capture-row">
        {isCapturing ? (
          <button className="cc-cancel-btn" onClick={onCancel} aria-label="Cancel capture">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
            CANCEL
          </button>
        ) : (
          <button
            className="cc-capture-btn"
            onClick={onCapture}
            disabled={disabled}
            aria-label={captureLabel}
          >
            <i className="fa-solid fa-camera" aria-hidden="true" />
            {captureLabel}
          </button>
        )}
      </div>

      <style>{`
        .cc-root {
          width: 100%; display: flex; flex-direction: column; gap: var(--sp-4);
        }

        /* Row */
        .cc-row {
          display: flex; flex-wrap: wrap;
          align-items: center; gap: var(--sp-4);
          padding: var(--sp-4);
          background: var(--surface-1); border: 1px solid var(--border);
          border-radius: var(--r-lg);
        }

        .cc-group {
          display: flex; flex-direction: column; gap: var(--sp-2);
        }
        .cc-group-label {
          display: flex; align-items: center; gap: 5px;
          font-family: var(--font-mono); font-size: 0.58rem; font-weight: 700;
          letter-spacing: 0.12em; color: var(--text-tertiary);
          text-transform: uppercase;
        }
        .cc-group-label i { font-size: 0.55rem; }

        /* Segmented control */
        .cc-seg {
          display: flex; gap: 2px;
          background: var(--surface-3); border-radius: var(--r-sm);
          padding: 2px;
        }
        .cc-seg-btn {
          padding: 5px 12px; border-radius: calc(var(--r-sm) - 2px);
          font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700;
          color: var(--text-secondary);
          background: transparent; border: none; cursor: pointer;
          transition: background var(--t-fast), color var(--t-fast);
          min-width: 32px;
        }
        .cc-seg-btn:hover:not(:disabled) { color: var(--white); }
        .cc-seg-btn--active { background: var(--surface-5); color: var(--white); }
        .cc-seg-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Toggle switch */
        .cc-toggle {
          position: relative; width: 38px; height: 22px;
          background: var(--surface-4); border-radius: var(--r-full);
          border: 1px solid var(--border-strong); cursor: pointer;
          transition: background var(--t-fast);
        }
        .cc-toggle--on { background: var(--purple); border-color: var(--purple); }
        .cc-toggle:disabled { opacity: 0.35; cursor: not-allowed; }
        .cc-toggle-thumb {
          position: absolute; top: 2px; left: 2px;
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--white);
          transition: transform var(--t-fast) var(--ease-spring);
        }
        .cc-toggle--on .cc-toggle-thumb { transform: translateX(16px); }

        /* Capture row */
        .cc-capture-row {
          display: flex; justify-content: center;
        }

        .cc-capture-btn {
          display: inline-flex; align-items: center; gap: var(--sp-3);
          padding: 16px 48px;
          background: var(--purple); color: var(--white);
          border: none; border-radius: var(--r-sm);
          font-family: var(--font-mono); font-size: 1rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer;
          transition: background var(--t-fast), transform var(--t-fast) var(--ease-spring), box-shadow var(--t-fast);
          box-shadow: var(--shadow-purple);
          animation: pulseRing 2.5s ease-in-out infinite;
        }
        .cc-capture-btn:hover:not(:disabled) {
          background: var(--purple-light);
          transform: translateY(-2px);
          box-shadow: 0 0 32px rgba(172,88,233,0.45);
          animation: none;
        }
        .cc-capture-btn:active:not(:disabled) { transform: translateY(1px); }
        .cc-capture-btn:disabled {
          opacity: 0.3; cursor: not-allowed; animation: none;
        }
        .cc-capture-btn i { font-size: 1.1rem; }

        .cc-cancel-btn {
          display: inline-flex; align-items: center; gap: var(--sp-2);
          padding: 14px 32px;
          background: var(--surface-3); color: var(--text-secondary);
          border: 1px solid var(--border-strong); border-radius: var(--r-sm);
          font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
          transition: background var(--t-fast), color var(--t-fast);
        }
        .cc-cancel-btn:hover { background: var(--surface-4); color: var(--white); }

        @media (max-width: 520px) {
          .cc-row { gap: var(--sp-3); }
          .cc-capture-btn { padding: 15px 32px; font-size: 0.9rem; width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
