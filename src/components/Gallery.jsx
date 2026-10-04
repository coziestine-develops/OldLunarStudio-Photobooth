import { useState } from 'react';
import { downloadDataURL, generateFilename } from '../utils/canvas.js';
import { playDownload, playClick } from '../utils/sounds.js';

export default function Gallery({ photos, onDelete, onClearAll, onStartPhotobooth, soundEnabled }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [lightbox,     setLightbox]     = useState(null);

  const handleDownload = (entry) => {
    playDownload(soundEnabled);
    downloadDataURL(entry.dataUrl, generateFilename(entry.count > 1 ? 'oldluna-strip' : 'oldluna-photo', 'jpg'));
  };

  const fmt = (iso) => { try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };

  return (
    <main className="ga-page" aria-labelledby="ga-heading">
      <div className="ga-inner">
        {/* Header */}
        <div className="ga-header">
          <div>
            <span className="tag tag-purple">
              <i className="fa-solid fa-images" aria-hidden="true" />
              {photos.length} {photos.length === 1 ? 'Memory' : 'Memories'}
            </span>
            <h1 id="ga-heading" className="ga-title">MY MEMORIES</h1>
            <p className="ga-sub">Stored locally on your device.</p>
          </div>
          {photos.length > 0 && (
            <button className="ga-clear-btn btn btn-ghost" onClick={() => { playClick(soundEnabled); setConfirmClear(true); }}>
              <i className="fa-solid fa-trash" aria-hidden="true" />
              Clear All
            </button>
          )}
        </div>

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="ga-empty">
            <i className="fa-solid fa-camera-slash ga-empty-icon" aria-hidden="true" />
            <p className="ga-empty-title">No memories yet</p>
            <p className="ga-empty-sub">Head to the photobooth and capture your first one.</p>
            <button className="ga-start-btn" onClick={onStartPhotobooth}>
              <i className="fa-solid fa-gamepad" aria-hidden="true" />
              Start Photobooth
            </button>
          </div>
        )}

        {/* Grid */}
        {photos.length > 0 && (
          <div className="ga-grid" role="list">
            {photos.map((entry, i) => (
              <article
                key={entry.id}
                className="ga-card"
                role="listitem"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
              >
                <button className="ga-thumb-btn" onClick={() => setLightbox(entry)} aria-label={`View photo from ${fmt(entry.date)}`}>
                  <img src={entry.thumbnail || entry.dataUrl} alt={`Memory from ${fmt(entry.date)}`} className="ga-thumb" loading="lazy" />
                  <div className="ga-thumb-hover" aria-hidden="true">
                    <i className="fa-solid fa-expand" />
                  </div>
                </button>
                <div className="ga-meta">
                  <div className="ga-meta-row">
                    <span className="ga-date">{fmt(entry.date)}</span>
                    {entry.filterId !== 'normal' && <span className="tag">{entry.filterId}</span>}
                    {entry.count > 1 && <span className="tag tag-purple">{entry.count}x</span>}
                  </div>
                  <div className="ga-card-actions">
                    <button className="ga-act-btn" onClick={() => handleDownload(entry)} aria-label="Download">
                      <i className="fa-solid fa-download" aria-hidden="true" />
                    </button>
                    <button className="ga-act-btn ga-act-btn--del" onClick={() => { playClick(soundEnabled); onDelete(entry.id); }} aria-label="Delete">
                      <i className="fa-solid fa-trash" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Confirm */}
      {confirmClear && (
        <div className="ga-modal-bg" role="dialog" aria-modal="true" aria-labelledby="ga-confirm-title">
          <div className="ga-modal">
            <h3 id="ga-confirm-title" className="ga-modal-title">Clear All Memories?</h3>
            <p className="ga-modal-body">This permanently deletes all {photos.length} memories. Cannot be undone.</p>
            <div className="ga-modal-actions">
              <button className="ga-modal-del" onClick={() => { onClearAll(); setConfirmClear(false); }}>
                <i className="fa-solid fa-trash" aria-hidden="true" /> Yes, Clear All
              </button>
              <button className="ga-modal-cancel btn btn-ghost" onClick={() => setConfirmClear(false)} autoFocus>
                <i className="fa-solid fa-xmark" aria-hidden="true" /> Keep Memories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="ga-lightbox" role="dialog" aria-modal="true" aria-label="Photo preview" onClick={() => setLightbox(null)}>
          <button className="ga-lb-close" onClick={() => setLightbox(null)} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
          <img src={lightbox.dataUrl} alt="Memory" className="ga-lb-img" onClick={e => e.stopPropagation()} />
          <div className="ga-lb-actions" onClick={e => e.stopPropagation()}>
            <button className="ga-lb-dl" onClick={() => handleDownload(lightbox)}>
              <i className="fa-solid fa-download" aria-hidden="true" /> Download
            </button>
            <button className="ga-lb-del" onClick={() => { onDelete(lightbox.id); setLightbox(null); }}>
              <i className="fa-solid fa-trash" aria-hidden="true" /> Delete
            </button>
          </div>
        </div>
      )}

      <style>{`
        .ga-page { min-height: calc(100vh - 56px); padding-top: 56px; }
        .ga-inner {
          max-width: 1100px; margin: 0 auto;
          padding: var(--sp-10) var(--sp-6) var(--sp-16);
          animation: fadeIn 0.4s var(--ease);
        }
        .ga-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: var(--sp-4); margin-bottom: var(--sp-8); flex-wrap: wrap;
        }
        .ga-title {
          font-family: var(--font-mono); font-size: clamp(2rem, 6vw, 3.2rem);
          font-weight: 700; letter-spacing: 4px; color: var(--white);
          margin: var(--sp-2) 0 var(--sp-1);
        }
        .ga-sub { font-size: 0.82rem; color: var(--text-tertiary); }
        .ga-clear-btn { align-self: flex-start; }

        /* Empty */
        .ga-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: var(--sp-4); padding: var(--sp-16) var(--sp-4); text-align: center;
        }
        .ga-empty-icon { font-size: 2.5rem; color: var(--surface-5); }
        .ga-empty-title { font-family: var(--font-mono); font-size: 1.1rem; color: var(--white); }
        .ga-empty-sub { font-size: 0.85rem; color: var(--text-secondary); }
        .ga-start-btn {
          display: inline-flex; align-items: center; gap: var(--sp-2);
          margin-top: var(--sp-2); padding: 12px 24px;
          background: var(--purple); color: var(--white);
          border: none; border-radius: var(--r-sm);
          font-family: var(--font-mono); font-size: 0.84rem; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
          transition: background var(--t-fast), transform var(--t-fast) var(--ease-spring);
          box-shadow: var(--shadow-purple);
        }
        .ga-start-btn:hover { background: var(--purple-light); transform: translateY(-2px); }

        /* Grid */
        .ga-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--sp-4);
        }
        .ga-card {
          display: flex; flex-direction: column;
          background: var(--surface-1); border: 1px solid var(--border);
          border-radius: var(--r-lg); overflow: hidden;
          animation: fadeIn 0.5s var(--ease) both;
          transition: border-color var(--t-normal), transform var(--t-normal) var(--ease-spring);
        }
        .ga-card:hover { border-color: rgba(172,88,233,0.35); transform: translateY(-3px); }

        .ga-thumb-btn {
          position: relative; width: 100%; aspect-ratio: 4/3;
          border: none; background: none; cursor: pointer; padding: 0; overflow: hidden;
        }
        .ga-thumb {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform var(--t-slow) var(--ease);
        }
        .ga-card:hover .ga-thumb { transform: scale(1.04); }
        .ga-thumb-hover {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.4); opacity: 0; color: var(--white); font-size: 1.2rem;
          transition: opacity var(--t-normal);
        }
        .ga-card:hover .ga-thumb-hover { opacity: 1; }

        .ga-meta { padding: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-2); }
        .ga-meta-row { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
        .ga-date { font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-secondary); flex: 1; }

        .ga-card-actions { display: flex; gap: var(--sp-2); }
        .ga-act-btn {
          width: 30px; height: 30px; border-radius: var(--r-sm);
          background: var(--surface-3); border: 1px solid var(--border);
          color: var(--text-secondary); cursor: pointer; font-size: 0.7rem;
          display: flex; align-items: center; justify-content: center;
          transition: background var(--t-fast), color var(--t-fast);
        }
        .ga-act-btn:hover { background: var(--surface-4); color: var(--white); }
        .ga-act-btn--del:hover { background: rgba(200,50,50,0.15); color: #ef4444; border-color: rgba(200,50,50,0.3); }

        /* Modal */
        .ga-modal-bg {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: var(--sp-6); animation: fadeInFast 0.2s;
        }
        .ga-modal {
          background: var(--surface-2); border: 1px solid var(--border-strong);
          border-radius: var(--r-xl); padding: var(--sp-8);
          max-width: 400px; width: 100%;
          display: flex; flex-direction: column; gap: var(--sp-4);
          animation: scaleIn 0.22s var(--ease-spring);
          box-shadow: var(--shadow-lg);
        }
        .ga-modal-title { font-family: var(--font-mono); font-size: 1.1rem; color: var(--white); }
        .ga-modal-body  { font-size: 0.86rem; color: var(--text-secondary); line-height: 1.6; }
        .ga-modal-actions { display: flex; flex-direction: column; gap: var(--sp-3); }
        .ga-modal-del {
          display: flex; align-items: center; justify-content: center; gap: var(--sp-2);
          padding: 12px; border-radius: var(--r-sm); border: none;
          background: #ef4444; color: white; font-family: var(--font-mono);
          font-size: 0.84rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; cursor: pointer;
          transition: opacity var(--t-fast), transform var(--t-fast);
        }
        .ga-modal-del:hover { opacity: 0.88; transform: translateY(-1px); }
        .ga-modal-cancel { justify-content: center; }

        /* Lightbox */
        .ga-lightbox {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(0,0,0,0.95); backdrop-filter: blur(16px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: var(--sp-4); padding: var(--sp-6);
          animation: fadeInFast 0.22s; cursor: pointer;
        }
        .ga-lb-close {
          position: fixed; top: var(--sp-6); right: var(--sp-6);
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(255,255,255,0.08); border: 1px solid var(--border-strong);
          color: var(--white); cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 0.95rem; transition: background var(--t-fast);
        }
        .ga-lb-close:hover { background: rgba(255,255,255,0.15); }
        .ga-lb-img {
          max-width: 100%; max-height: 80vh; object-fit: contain;
          border-radius: var(--r-lg); border: 1px solid var(--border);
          animation: develop 0.5s var(--ease); cursor: default;
        }
        .ga-lb-actions {
          display: flex; gap: var(--sp-3);
        }
        .ga-lb-dl, .ga-lb-del {
          display: inline-flex; align-items: center; gap: var(--sp-2);
          padding: 10px 20px; border-radius: var(--r-sm);
          font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
          border: none; transition: opacity var(--t-fast), transform var(--t-fast);
        }
        .ga-lb-dl:hover, .ga-lb-del:hover { opacity: 0.85; transform: translateY(-1px); }
        .ga-lb-dl  { background: var(--white); color: var(--black); }
        .ga-lb-del { background: #ef4444; color: white; }

        @media (max-width: 480px) {
          .ga-grid { grid-template-columns: repeat(2, 1fr); gap: var(--sp-3); }
        }
      `}</style>
    </main>
  );
}
