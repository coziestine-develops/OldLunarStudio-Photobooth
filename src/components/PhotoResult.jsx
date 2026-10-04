import { downloadDataURL, generateFilename } from '../utils/canvas.js';
import { playDownload } from '../utils/sounds.js';

export default function PhotoResult({
  dataUrl,
  photoCount = 1,
  filterId = 'normal',
  onRetake,
  onPlayAgain,
  onHome,
  soundEnabled,
}) {
  const handleDownload = () => {
    playDownload(soundEnabled);
    downloadDataURL(dataUrl, generateFilename(photoCount > 1 ? 'oldluna-strip' : 'oldluna-photo', 'jpg'));
  };

  return (
    <div className="pr-root" aria-label="Your OldLuna photo">
      {/* Header */}
      <div className="pr-header">
        <div className="pr-header-left">
          <i className="fa-solid fa-image pr-header-icon" aria-hidden="true" />
          <span className="pr-header-title">YOUR PHOTO</span>
        </div>
        <span className="tag tag-purple">
          <i className="fa-solid fa-check" aria-hidden="true" />
          SAVED
        </span>
      </div>

      {/* Photo */}
      <div className="pr-photo-wrap">
        <img
          src={dataUrl}
          alt={photoCount > 1 ? 'Your OldLuna photo strip' : 'Your OldLuna photo'}
          className="pr-photo"
        />
        {filterId !== 'normal' && (
          <span className="pr-filter-badge">
            <i className="fa-solid fa-filter" aria-hidden="true" />
            {filterId.toUpperCase()}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="pr-actions">
        <button className="pr-btn-download" onClick={handleDownload}>
          <i className="fa-solid fa-download" aria-hidden="true" />
          DOWNLOAD PHOTO
        </button>
        <button className="pr-btn-retake btn btn-ghost" onClick={onRetake}>
          <i className="fa-solid fa-rotate-left" aria-hidden="true" />
          RETAKE
        </button>
        <button className="pr-btn-again btn btn-ghost" onClick={onPlayAgain}>
          <i className="fa-solid fa-rotate" aria-hidden="true" />
          PLAY AGAIN
        </button>
        <button className="pr-btn-home btn btn-ghost" onClick={onHome}>
          <i className="fa-solid fa-house" aria-hidden="true" />
          HOME
        </button>
      </div>

      <style>{`
        .pr-root {
          width: 100%; max-width: 640px; margin: 0 auto;
          padding: var(--sp-8) var(--sp-4) var(--sp-12);
          display: flex; flex-direction: column; gap: var(--sp-6);
          align-items: center;
          animation: fadeIn 0.5s var(--ease);
        }

        /* Header */
        .pr-header {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
        }
        .pr-header-left { display: flex; align-items: center; gap: var(--sp-3); }
        .pr-header-icon { color: var(--purple); font-size: 1rem; }
        .pr-header-title {
          font-family: var(--font-mono); font-size: 0.88rem; font-weight: 700;
          letter-spacing: 3px; color: var(--white);
        }

        /* Photo */
        .pr-photo-wrap { position: relative; width: 100%; }
        .pr-photo {
          width: 100%; height: auto; display: block;
          border-radius: var(--r-lg);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          animation: develop 0.7s var(--ease);
        }
        .pr-filter-badge {
          position: absolute; top: 12px; right: 12px;
          display: flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: var(--r-xs);
          font-family: var(--font-mono); font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.1em;
          background: rgba(172,88,233,0.25); color: var(--purple);
          border: 1px solid rgba(172,88,233,0.5);
          backdrop-filter: blur(8px);
        }

        /* Actions */
        .pr-actions {
          display: flex; flex-wrap: wrap; gap: var(--sp-3); justify-content: center;
          width: 100%;
        }
        .pr-btn-download {
          display: inline-flex; align-items: center; gap: var(--sp-2);
          padding: 14px 32px;
          background: var(--purple); color: var(--white);
          border: none; border-radius: var(--r-sm);
          font-family: var(--font-mono); font-size: 0.9rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
          transition: background var(--t-fast), transform var(--t-fast) var(--ease-spring), box-shadow var(--t-fast);
          box-shadow: var(--shadow-purple);
        }
        .pr-btn-download:hover {
          background: var(--purple-light); transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(172,88,233,0.4);
        }
        .pr-btn-download:active { transform: translateY(0); }
        .pr-btn-retake, .pr-btn-again, .pr-btn-home { font-size: 0.8rem; }

        @media (max-width: 480px) {
          .pr-actions { flex-direction: column; }
          .pr-btn-download, .pr-btn-retake, .pr-btn-again, .pr-btn-home {
            width: 100%; justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
