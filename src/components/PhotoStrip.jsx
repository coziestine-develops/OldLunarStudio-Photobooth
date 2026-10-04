import { Loader2 } from 'lucide-react';

/**
 * PhotoStrip
 *
 * Displays thumbnail previews of photos captured mid-sequence,
 * and a loading spinner while the final strip is being generated.
 * This component is shown inside the photobooth screen during / after capture.
 */
export default function PhotoStrip({ photos = [], isProcessing = false, totalShots = 1 }) {
  if (photos.length === 0 && !isProcessing) return null;

  // For single-photo mode don't show this component at all
  if (totalShots === 1 && !isProcessing) return null;

  return (
    <div className="photostrip-preview" aria-label="Captured photos preview">
      {photos.map((url, i) => (
        <div
          key={i}
          className="photostrip-thumb"
          style={{ animationDelay: `${i * 0.08}s` }}
          aria-label={`Photo ${i + 1}`}
        >
          <img
            src={url}
            alt={`Photo ${i + 1}`}
            className="photostrip-thumb-img"
          />
          <span className="photostrip-thumb-num" aria-hidden="true">{i + 1}</span>
        </div>
      ))}

      {/* Empty placeholder slots */}
      {!isProcessing && Array.from({ length: Math.max(0, totalShots - photos.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="photostrip-thumb photostrip-thumb--empty"
          aria-hidden="true"
        >
          <span className="photostrip-thumb-num">{photos.length + i + 1}</span>
        </div>
      ))}

      {/* Processing spinner */}
      {isProcessing && (
        <div className="photostrip-processing" aria-live="polite" aria-label="Generating photo strip">
          <Loader2 size={20} className="photostrip-spinner" aria-hidden="true" />
          <span>Developing…</span>
        </div>
      )}

      <style>{`
        .photostrip-preview {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .photostrip-preview::-webkit-scrollbar { display: none; }

        .photostrip-thumb {
          position: relative;
          flex-shrink: 0;
          width: 60px; height: 50px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 2px solid var(--border-color);
          background: var(--warm-beige);
          animation: slideInFromBottom 0.35s var(--ease-spring) both;
        }
        .photostrip-thumb--empty {
          display: flex;
          align-items: center;
          justify-content: center;
          border-style: dashed;
          border-color: var(--text-light);
          background: transparent;
        }
        .photostrip-thumb-img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }
        .photostrip-thumb-num {
          position: absolute;
          bottom: 2px; right: 4px;
          font-family: var(--font-sans);
          font-size: 0.6rem;
          font-weight: 700;
          color: rgba(255,247,232,0.85);
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }
        .photostrip-thumb--empty .photostrip-thumb-num {
          position: static;
          color: var(--text-light);
          text-shadow: none;
        }

        .photostrip-processing {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 0 var(--space-4);
          font-family: var(--font-sans);
          font-size: 0.7rem;
          color: var(--dusty-rose);
          font-style: italic;
          flex-shrink: 0;
        }
        .photostrip-spinner {
          animation: spin-slow 1s linear infinite;
          color: var(--dusty-rose);
        }
      `}</style>
    </div>
  );
}
