import { ArrowLeft, ArrowRight } from 'lucide-react';
import './camera.css';

export const STEP_TITLES = ['Camera Settings', 'Photobooth', 'Review', 'Final Output'];

/**
 * Shared header for every photobooth screen.
 * Back (left) · STEP n + title (centre) · Next / counter (right).
 *
 * @param step     1–4
 * @param next     { label, onClick, disabled } — shows "NEXT <label> →" top-right
 * @param counter  e.g. "2/4" while capturing (replaces `next`)
 */
export default function PhotoboothHeader({ step = 1, onBack, backDisabled = false, next = null, counter = null }) {
  return (
    <header className="pb-hd">
      <div className="pb-hd-in">
        <button type="button" className="pb-hd-back" onClick={onBack} disabled={backDisabled} aria-label="Go back">
          <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
          <span>Back</span>
        </button>

        <div className="pb-hd-mid">
          <span className="pb-hd-step">Step {step}</span>
          <h1>{STEP_TITLES[step - 1]}</h1>
        </div>

        <div className="pb-hd-right">
          {counter ? (
            <div className="pb-hd-count" aria-label={`${counter} photos taken`}>{counter}</div>
          ) : next ? (
            <button type="button" className="pb-hd-next" onClick={next.onClick} disabled={next.disabled} aria-label={`Next: ${next.label}`}>
              <span className="pb-hd-next-k">Next</span>
              <span className="pb-hd-next-v">{next.label}<ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" /></span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="pb-prog" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label={`Step ${step} of 4`}>
        {STEP_TITLES.map((t, i) => <i key={t} className={i < step ? 'is-on' : ''} />)}
      </div>
    </header>
  );
}
