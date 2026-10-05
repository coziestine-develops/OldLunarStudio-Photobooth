import { useState } from 'react';
import { downloadBlob, pngFilename } from '../utils/canvas.js';
import { playDownload, playClick } from '../utils/sounds.js';

const LP = {
  bg:     '#F2EBE7',
  card:   '#FFFFFF',
  ink:    '#191516',
  red:    '#EB6380',
  yellow: '#F2B03C',
  border: 'rgba(25,21,22,0.12)',
  muted:  'rgba(25,21,22,0.50)',
  font:   "'Poppins', system-ui, sans-serif",
};

function Ic({ path, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d={path}/>
    </svg>
  );
}

export default function EndScreen({
  exportBlob,
  previewUrl,
  filterId,
  onRetake,
  onStartAgain,
  soundEnabled,
}) {
  const [sharing,      setSharing]      = useState(false);
  const [shareMsg,     setShareMsg]     = useState('');
  const [copied,       setCopied]       = useState(false);
  const [discardModal, setDiscardModal] = useState(false);

  /* ── Download ── */
  const handleDownload = () => {
    if (!exportBlob) return;
    playDownload(soundEnabled);
    downloadBlob(exportBlob, pngFilename());
  };

  /* ── Share (native or Facebook fallback) ── */
  const handleShare = async () => {
    setSharing(true); setShareMsg('');
    if (exportBlob && navigator.canShare?.({ files: [new File([exportBlob], 'oldluna.png', { type: 'image/png' })] })) {
      try {
        await navigator.share({
          files: [new File([exportBlob], 'oldlunar studio-photostrip.png', { type: 'image/png' })],
          title: 'My OldLunar Studio photo strip',
        });
      } catch (e) {
        if (e.name !== 'AbortError') setShareMsg('Sharing cancelled.');
      }
    } else {
      handleDownload();
      setShareMsg('Download started — share from your device.');
    }
    setSharing(false);
  };

  /* ── Copy ── */
  const handleCopy = async () => {
    if (!exportBlob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': exportBlob })]);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareMsg('Copy not supported on this browser.');
    }
  };

  /* ── Start again ── */
  const handleStartAgain = () => { playClick(soundEnabled); setDiscardModal(true); };
  const confirmDiscard   = () => { setDiscardModal(false); onStartAgain(); };

  return (
    <div className="es2-root">
      <div className="es2-inner">
        {/* Header row */}
        <div className="es2-header">
          <div className="es2-header-left">
            <span className="es2-step-tag">STEP 3</span>
            <h1 className="es2-title">Final Output</h1>
          </div>
          <div className="es2-header-right">
            <span className="es2-ready-tag">READY</span>
            <button
              className="es2-download-top"
              onClick={handleDownload}
              disabled={!exportBlob}
              aria-label="Download"
            >
              Download
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="es2-action-bar">
          {/* Retake */}
          <button className="es2-icon-btn" onClick={() => { playClick(soundEnabled); onRetake(); }} title="Retake" aria-label="Retake">
            <Ic path="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>
          </button>
          {/* Download */}
          <button className="es2-icon-btn es2-icon-btn--red" onClick={handleDownload} disabled={!exportBlob} title="Download" aria-label="Download">
            <Ic path="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/>
          </button>
          {/* Share */}
          <button className="es2-icon-btn es2-icon-btn--outline" onClick={handleShare} disabled={sharing || !exportBlob} title="Share" aria-label="Share">
            <Ic path="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
          </button>
          {/* Print */}
          <button className="es2-icon-btn" onClick={() => window.print()} disabled={!exportBlob} title="Print" aria-label="Print">
            <Ic path="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>
          </button>
          {/* Customize label */}
          <button
            className="es2-customize-btn"
            onClick={() => { playClick(soundEnabled); onRetake(); }}
            aria-label="Customize"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            Customize
          </button>
        </div>

        {/* Photo preview */}
        <div className="es2-preview-wrap">
          {previewUrl
            ? <img src={previewUrl} alt="Your OldLuna photo strip" className="es2-preview" />
            : <div className="es2-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.25 }}>
                  <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/>
                </svg>
              </div>
          }
          {filterId && filterId !== 'natural' && (
            <span className="es2-filter-badge">{filterId.toUpperCase()}</span>
          )}
        </div>

        {/* Copy button */}
        <button className="es2-copy-btn" onClick={handleCopy} disabled={!exportBlob}>
          {copied
            ? <><Ic path="M20 6 9 17l-5-5"/>  Copied!</>
            : <><Ic path="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-4-4H8Z"/>Copy Image</>
          }
        </button>

        {/* Privacy note */}
        <p className="es2-privacy">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 9.5 4.1-1.9 7-5.3 7-9.5V6l-7-3Z"/>
            <path d="m9 12 2.2 2.2L15.5 10"/>
          </svg>
          Photos stay on your device until you choose to share.
        </p>

        {shareMsg && <p className="es2-share-msg" role="status">{shareMsg}</p>}

        {/* Secondary actions */}
        <div className="es2-secondary">
          <button className="es2-ghost-btn" onClick={() => { playClick(soundEnabled); onRetake(); }}>
            <Ic path="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>
            Retake
          </button>
          <button className="es2-ghost-btn" onClick={handleStartAgain}>
            <Ic path="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            Start Again
          </button>
        </div>
      </div>

      {/* Discard modal */}
      {discardModal && (
        <div className="es2-modal-bg" role="dialog" aria-modal="true" aria-labelledby="es2-discard-title">
          <div className="es2-modal">
            <h3 id="es2-discard-title" className="es2-modal-title">Discard your photos?</h3>
            <p className="es2-modal-body">Your current session photos will be lost. This cannot be undone.</p>
            <div className="es2-modal-actions">
              <button className="es2-ghost-btn" onClick={() => setDiscardModal(false)} autoFocus>
                <Ic path="m15 5-7 7 7 7"/> Cancel
              </button>
              <button className="es2-discard-btn" onClick={confirmDiscard}>
                <Ic path="M18 6 6 18M6 6l12 12"/> Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .es2-root {
          width: 100%; min-height: calc(100vh - 56px);
          background: ${LP.bg};
          padding: 24px 24px 48px;
          font-family: ${LP.font};
        }
        .es2-inner {
          width: 100%; max-width: 520px;
          margin: 0 auto;
          display: flex; flex-direction: column; gap: 16px;
          animation: es2FadeIn 0.4s ease;
        }
        @keyframes es2FadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }

        /* Header */
        .es2-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 12px;
        }
        .es2-header-left { display: flex; flex-direction: column; gap: 2px; }
        .es2-step-tag {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: ${LP.muted};
        }
        .es2-title {
          font-size: 22px; font-weight: 700;
          color: ${LP.ink}; letter-spacing: -0.02em;
        }
        .es2-header-right {
          display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
        }
        .es2-ready-tag {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: ${LP.muted};
        }
        .es2-download-top {
          font-family: ${LP.font}; font-size: 14px; font-weight: 700;
          color: ${LP.ink}; background: none; border: none; cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }
        .es2-download-top:hover:not(:disabled) { color: ${LP.red}; }
        .es2-download-top:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Action bar */
        .es2-action-bar {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          background: ${LP.card};
          border: 1.5px solid ${LP.border};
          border-radius: 16px;
        }
        .es2-icon-btn {
          width: 42px; height: 42px; border-radius: 12px;
          border: 1.5px solid ${LP.border};
          background: rgba(25,21,22,0.04);
          color: ${LP.muted};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .es2-icon-btn:hover:not(:disabled) {
          color: ${LP.ink}; border-color: rgba(25,21,22,0.25);
          background: rgba(25,21,22,0.07);
        }
        .es2-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .es2-icon-btn--red {
          background: ${LP.red}; color: #fff; border-color: ${LP.red};
        }
        .es2-icon-btn--red:hover:not(:disabled) { opacity: 0.88; }
        .es2-icon-btn--outline {
          background: rgba(235,99,128,0.08); color: ${LP.red};
          border-color: rgba(235,99,128,0.4);
        }
        .es2-icon-btn--outline:hover:not(:disabled) {
          background: rgba(235,99,128,0.15);
        }

        .es2-customize-btn {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 16px; border-radius: 12px;
          border: 1.5px solid ${LP.yellow};
          background: rgba(242,176,60,0.12); color: #b07d10;
          font-family: ${LP.font}; font-size: 13px; font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
        }
        .es2-customize-btn:hover { background: rgba(242,176,60,0.22); }

        /* Preview */
        .es2-preview-wrap {
          position: relative; width: 100%;
          background: ${LP.card};
          border: 1.5px solid ${LP.border};
          border-radius: 20px; overflow: hidden;
        }
        .es2-preview {
          width: 100%; height: auto; display: block;
          animation: es2Develop 0.65s ease;
        }
        @keyframes es2Develop {
          from { opacity:0; filter:brightness(2) saturate(0); }
          to   { opacity:1; filter:brightness(1) saturate(1); }
        }
        .es2-placeholder {
          width: 100%; aspect-ratio: 4/3;
          display: flex; align-items: center; justify-content: center;
          background: rgba(25,21,22,0.04);
        }
        .es2-filter-badge {
          position: absolute; top: 10px; right: 10px;
          padding: 3px 9px; border-radius: 999px;
          font-family: ${LP.font}; font-size: 10px; font-weight: 700;
          letter-spacing: 0.10em; text-transform: uppercase;
          background: rgba(235,99,128,0.15); color: ${LP.red};
          border: 1px solid rgba(235,99,128,0.35);
          backdrop-filter: blur(8px);
        }

        /* Copy btn */
        .es2-copy-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; width: 100%; padding: 13px;
          border: 1.5px solid ${LP.border}; border-radius: 999px;
          background: ${LP.card}; color: ${LP.ink};
          font-family: ${LP.font}; font-size: 14px; font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .es2-copy-btn:hover:not(:disabled) { border-color: rgba(25,21,22,0.3); background: #f5f0ec; }
        .es2-copy-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Privacy */
        .es2-privacy {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: ${LP.muted};
          padding: 0 4px;
        }

        /* Share msg */
        .es2-share-msg {
          font-size: 12px; color: ${LP.muted};
          text-align: center;
        }

        /* Secondary */
        .es2-secondary {
          display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
        }
        .es2-ghost-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 18px; border-radius: 999px;
          border: 1.5px solid ${LP.border};
          background: transparent; color: ${LP.muted};
          font-family: ${LP.font}; font-size: 13px; font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .es2-ghost-btn:hover { color: ${LP.ink}; border-color: rgba(25,21,22,0.3); background: rgba(25,21,22,0.04); }

        /* Discard modal */
        .es2-modal-bg {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(25,21,22,0.5); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; animation: es2FadeIn 0.2s ease;
        }
        .es2-modal {
          background: ${LP.card}; border: 1.5px solid ${LP.border};
          border-radius: 24px; padding: 28px 24px;
          max-width: 360px; width: 100%;
          display: flex; flex-direction: column; gap: 14px;
          box-shadow: 0 20px 60px rgba(25,21,22,0.20);
        }
        .es2-modal-title {
          font-size: 18px; font-weight: 700; color: ${LP.ink};
        }
        .es2-modal-body {
          font-size: 13px; color: ${LP.muted}; line-height: 1.6;
        }
        .es2-modal-actions { display: flex; gap: 10px; }
        .es2-modal-actions .es2-ghost-btn { flex: 1; justify-content: center; }
        .es2-discard-btn {
          flex: 1; display: inline-flex; align-items: center;
          justify-content: center; gap: 7px;
          padding: 11px 18px; border-radius: 999px;
          border: none; background: ${LP.red}; color: #fff;
          font-family: ${LP.font}; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
        }
        .es2-discard-btn:hover { opacity: 0.88; }
      `}</style>
    </div>
  );
}
