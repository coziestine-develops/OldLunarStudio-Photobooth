import { useState } from 'react';
import { playClick } from '../utils/sounds.js';
import './camera.css';
import './editor.css';

/** Review screen: look at all shots, reorder (drag or arrows), retake any, continue to edit. */
export default function SessionGallery({ photoUrls, onReorder, onRetake, onContinue, soundEnabled }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);

  const move = (from, to) => {
    if (to < 0 || to >= photoUrls.length || from === to) return;
    const next = [...photoUrls];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onReorder(next);
  };
  const onDrop = (i) => { if (dragging !== null) move(dragging, i); setDragging(null); setOver(null); };

  return (
    <div className="pb-screen ed-wrap">
      <div className="rv">
        <header className="rv-head">
          <div>
            <h1>Review your shots</h1>
            <p>Reorder with the arrows or drag. Retake any photo you don’t love.</p>
          </div>
          <button type="button" className="pb-btn pb-btn--primary" onClick={() => { playClick(soundEnabled); onContinue(); }}>
            Edit strip
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </header>

        <ul className="rv-grid" aria-label="Captured shots">
          {photoUrls.map((url, i) => (
            <li key={url + i}
                className={`rv-item ${over === i && dragging !== i ? 'is-over' : ''} ${dragging === i ? 'is-drag' : ''}`}
                draggable
                onDragStart={() => setDragging(i)}
                onDragOver={e => { e.preventDefault(); setOver(i); }}
                onDrop={() => onDrop(i)}
                onDragEnd={() => { setDragging(null); setOver(null); }}>
              <div className="rv-img">
                <img src={url} alt={`Shot ${i + 1}`} draggable={false} />
                <span className="rv-n">{i + 1}</span>
              </div>
              <div className="rv-bar">
                <button type="button" className="rv-ic" disabled={i === 0} aria-label={`Move shot ${i + 1} earlier`} onClick={() => move(i, i - 1)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
                </button>
                <button type="button" className="rv-retake" aria-label={`Retake shot ${i + 1}`} onClick={() => { playClick(soundEnabled); onRetake(i); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" /></svg>
                  <span>Retake</span>
                </button>
                <button type="button" className="rv-ic" disabled={i === photoUrls.length - 1} aria-label={`Move shot ${i + 1} later`} onClick={() => move(i, i + 1)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
