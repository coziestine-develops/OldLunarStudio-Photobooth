import { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Image as ImageIcon, Link2, Share2, X } from 'lucide-react';
import { copyText, SHARE_TEXT, SHARE_TITLE } from '../utils/share.js';
import './share.css';

/**
 * ShareSheet — copy the generated link or hand it to the device share sheet.
 *
 * @param open          boolean
 * @param onClose       () => void
 * @param link          the generated, unique share URL
 * @param onShareImage  optional async () => string — shares/downloads the finished strip image,
 *                      resolves with a status message
 */
export default function ShareSheet({ open, onClose, link, onShareImage }) {
  const titleId = useId();
  const inputRef = useRef(null);
  const closeRef = useRef(null);
  const timer = useRef(0);
  const [status, setStatus] = useState({ text: '', err: false });
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    && (navigator.canShare ? navigator.canShare({ url: link }) : true);

  const say = (text, err = false) => setStatus({ text, err });

  /* reset + focus when opened */
  useEffect(() => {
    if (!open) return;
    setStatus({ text: '', err: false }); setCopied(false); setBusy(false);
    const t = setTimeout(() => closeRef.current?.focus(), 30);
    return () => { clearTimeout(t); clearTimeout(timer.current); };
  }, [open]);

  /* Esc closes, Tab stays inside the dialog, page behind does not scroll */
  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const nodes = document.querySelectorAll('.sh-dialog button:not(:disabled), .sh-dialog input');
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    const ok = await copyText(link);
    if (ok) {
      setCopied(true);
      say('Link copied to clipboard.');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2400);
    } else {
      inputRef.current?.focus(); inputRef.current?.select();
      say('Couldn’t copy automatically. The link is selected, so press Ctrl/⌘ + C.', true);
    }
  };

  const handleNative = async () => {
    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: link });
      say('Shared! Your friends can open the link to see your design.');
    } catch (e) {
      if (e.name === 'AbortError') return;          // user closed the sheet
      await handleCopy();                            // anything else → copy fallback
    }
  };

  const handleImage = async () => {
    if (busy || !onShareImage) return;
    setBusy(true); say('Preparing your strip…');
    try { say((await onShareImage()) || ''); }
    catch (e) { console.error(e); say('Couldn’t share the image. Try downloading it instead.', true); }
    finally { setBusy(false); }
  };

  return createPortal(
    <div className="sh" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sh-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="sh-grab" aria-hidden="true" />
        <header className="sh-head">
          <span className="sh-ic" aria-hidden="true"><Share2 size={20} /></span>
          <div className="sh-head-t">
            <h2 id={titleId}>Share your strip</h2>
            <p>Anyone with this link can open OldLuna with your design. Your photos never leave your device.</p>
          </div>
          <button ref={closeRef} type="button" className="sh-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <label className="sh-label" htmlFor={`${titleId}-link`}>Your unique link</label>
        <div className="sh-copy">
          <div className="sh-field">
            <Link2 size={16} aria-hidden="true" />
            <input id={`${titleId}-link`} ref={inputRef} readOnly value={link} onFocus={e => e.target.select()} onClick={e => e.target.select()} />
          </div>
          <button type="button" className={`sh-btn sh-btn--ghost sh-copy-btn ${copied ? 'is-done' : ''}`} onClick={handleCopy}>
            {copied ? <Check size={18} /> : <Copy size={18} />}<span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="sh-actions">
          {canNativeShare && (
            <button type="button" className="sh-btn sh-btn--primary" onClick={handleNative}><Share2 size={18} /><span>Share link</span></button>
          )}
          {onShareImage && (
            <button type="button" className={`sh-btn ${canNativeShare ? 'sh-btn--ghost' : 'sh-btn--primary'}`} onClick={handleImage} disabled={busy}>
              <ImageIcon size={18} /><span>Share strip image</span>
            </button>
          )}
        </div>

        <p className={`sh-status ${status.err ? 'is-err' : ''}`} role="status" aria-live="polite">{status.text}</p>
      </div>
    </div>,
    document.body
  );
}
