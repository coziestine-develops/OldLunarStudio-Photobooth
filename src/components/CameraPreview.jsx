import { useEffect } from 'react';
import { CAMERA_STATE } from '../hooks/useCamera.js';
import { FILTER_MAP } from '../utils/filters.js';

/**
 * CameraPreview
 *
 * Renders the live webcam feed with the active CSS filter applied.
 * Mirror is applied via CSS transform on the <video> element only —
 * the captureFrame utility handles flipping the canvas to match.
 */
export default function CameraPreview({
  videoRef,
  cameraState,
  errorMessage,
  onRequestCamera,
  selectedFilter = 'normal',
  mirror = false,
  children,  // countdown, flash overlays
}) {
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const h = () => v.play().catch(() => {});
    v.addEventListener('canplay', h);
    return () => v.removeEventListener('canplay', h);
  }, [videoRef]);

  const filter   = FILTER_MAP[selectedFilter] ?? FILTER_MAP['normal'];
  const cssFilter = filter.css === 'none' ? undefined : filter.css;

  const isGranted    = cameraState === CAMERA_STATE.GRANTED;
  const isRequesting = cameraState === CAMERA_STATE.REQUESTING;
  const isError      = cameraState === CAMERA_STATE.DENIED || cameraState === CAMERA_STATE.ERROR;
  const isIdle       = cameraState === CAMERA_STATE.IDLE;

  return (
    <div className="cp-outer">
      {/* Video element — always mounted for stable ref */}
      <video
        ref={videoRef}
        className="cp-video"
        data-visible={isGranted}
        autoPlay playsInline muted
        style={{
          filter: cssFilter,
          transform: mirror ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Corner brackets (live only) */}
      {isGranted && (
        <div className="cp-corners" aria-hidden="true">
          <span className="cp-corner cp-corner--tl" />
          <span className="cp-corner cp-corner--tr" />
          <span className="cp-corner cp-corner--bl" />
          <span className="cp-corner cp-corner--br" />
        </div>
      )}

      {/* Filter badge */}
      {isGranted && selectedFilter !== 'normal' && (
        <div className="cp-filter-badge">
          <i className="fa-solid fa-filter" aria-hidden="true" />
          {filter.label.toUpperCase()}
        </div>
      )}

      {/* Mirror badge */}
      {isGranted && mirror && (
        <div className="cp-mirror-badge">
          <i className="fa-solid fa-camera-rotate" aria-hidden="true" />
          MIRROR
        </div>
      )}

      {/* Loading */}
      {isRequesting && (
        <div className="cp-overlay" aria-live="polite">
          <div className="cp-spinner" aria-hidden="true" />
          <p className="cp-overlay-title">Starting camera…</p>
          <p className="cp-overlay-sub">Allow access when prompted.</p>
        </div>
      )}

      {/* Idle */}
      {isIdle && (
        <div className="cp-overlay">
          <i className="fa-solid fa-camera cp-idle-icon" aria-hidden="true" />
          <p className="cp-overlay-title">Camera not started</p>
          <button className="cp-allow-btn" onClick={onRequestCamera}>
            <i className="fa-solid fa-camera" aria-hidden="true" />
            Allow Camera
          </button>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="cp-overlay" role="alert">
          <i className="fa-solid fa-camera-slash cp-error-icon" aria-hidden="true" />
          <p className="cp-overlay-title">Camera access needed</p>
          <p className="cp-overlay-sub">{errorMessage ?? 'OldLuna needs your camera to capture photos.'}</p>
          <div className="cp-overlay-actions">
            <button className="cp-allow-btn" onClick={onRequestCamera}>
              <i className="fa-solid fa-camera" aria-hidden="true" />
              Allow Camera
            </button>
            <button className="cp-retry-btn" onClick={onRequestCamera}>
              <i className="fa-solid fa-rotate-right" aria-hidden="true" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Slot for countdown / flash overlays */}
      {children}

      <style>{`
        .cp-outer {
          position: relative; width: 100%;
          aspect-ratio: 4/3; max-height: 70vh;
          background: var(--surface-2);
          border-radius: var(--r-lg);
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .cp-video {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          opacity: 0;
          transition: opacity 0.4s var(--ease);
        }
        .cp-video[data-visible="true"] { opacity: 1; }

        /* Overlays */
        .cp-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: var(--sp-4); padding: var(--sp-8);
          text-align: center;
          background: rgba(0,0,0,0.82);
          animation: fadeInFast 0.3s;
        }
        .cp-overlay-title {
          font-family: var(--font-mono); font-size: 1rem; color: var(--white);
        }
        .cp-overlay-sub {
          font-size: 0.82rem; color: var(--text-secondary);
          max-width: 280px; line-height: 1.6;
        }
        .cp-idle-icon  { font-size: 2.5rem; color: rgba(255,255,255,0.18); }
        .cp-error-icon { font-size: 2.5rem; color: var(--purple); }

        .cp-spinner {
          width: 42px; height: 42px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: var(--purple);
          animation: spinSmooth 0.85s linear infinite;
        }

        .cp-allow-btn {
          display: inline-flex; align-items: center; gap: var(--sp-2);
          padding: 11px 22px; background: var(--white); color: var(--black);
          border: none; border-radius: var(--r-sm);
          font-family: var(--font-ui); font-size: 0.84rem; font-weight: 700;
          cursor: pointer; text-transform: uppercase; letter-spacing: 0.06em;
          transition: opacity var(--t-fast), transform var(--t-fast) var(--ease-spring);
        }
        .cp-allow-btn:hover { opacity: 0.88; transform: translateY(-1px); }

        .cp-retry-btn {
          display: inline-flex; align-items: center; gap: var(--sp-2);
          padding: 9px 18px;
          background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border-strong); border-radius: var(--r-sm);
          font-family: var(--font-ui); font-size: 0.8rem;
          cursor: pointer; transition: color var(--t-fast), border-color var(--t-fast);
        }
        .cp-retry-btn:hover { color: var(--white); border-color: var(--white); }

        .cp-overlay-actions { display: flex; flex-direction: column; gap: var(--sp-3); align-items: center; }

        /* Corner brackets */
        .cp-corners { position: absolute; inset: 0; pointer-events: none; }
        .cp-corner {
          position: absolute; width: 18px; height: 18px;
          border-color: var(--purple); border-style: solid; opacity: 0.7;
        }
        .cp-corner--tl { top: 10px; left: 10px;   border-width: 2px 0 0 2px; border-radius: 2px 0 0 0; }
        .cp-corner--tr { top: 10px; right: 10px;  border-width: 2px 2px 0 0; border-radius: 0 2px 0 0; }
        .cp-corner--bl { bottom: 10px; left: 10px;  border-width: 0 0 2px 2px; border-radius: 0 0 0 2px; }
        .cp-corner--br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; border-radius: 0 0 2px 0; }

        /* Badges */
        .cp-filter-badge, .cp-mirror-badge {
          position: absolute; display: flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: var(--r-xs);
          font-family: var(--font-mono); font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.1em; backdrop-filter: blur(8px);
        }
        .cp-filter-badge {
          top: 10px; right: 10px;
          background: rgba(172,88,233,0.25); color: var(--purple);
          border: 1px solid rgba(172,88,233,0.5);
        }
        .cp-mirror-badge {
          top: 10px; left: 10px;
          background: rgba(0,0,0,0.5); color: var(--text-secondary);
          border: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
