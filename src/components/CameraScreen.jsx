import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, ChevronDown, Lock, Maximize2, Minimize2, RotateCcw, Volume2, VolumeX } from '../icons.jsx';
import { CS } from '../hooks/useCapture.js';
import { CAM } from '../hooks/useCamera.js';
import { playClick } from '../utils/sounds.js';
import Countdown from './Countdown.jsx';
import './camera.css';

/* ── Viewfinder: the live camera. The video always fills the container (object-fit: cover). ── */
function Viewfinder({ videoRef, camState, error, onAllow, showCrop, resolution, soundEnabled, onSoundToggle, children }) {
  const boxRef = useRef(null);
  const [full, setFull] = useState(false);

  const isLive    = camState === CAM.GRANTED;
  const isLoading = camState === CAM.REQUESTING;
  const isDenied  = camState === CAM.DENIED;
  const isError   = camState === CAM.ERROR;
  const isIdle    = camState === CAM.IDLE;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const h = () => v.play().catch(() => {});
    v.addEventListener('canplay', h);
    return () => v.removeEventListener('canplay', h);
  }, [videoRef]);

  useEffect(() => {
    const h = () => {
      const el = document.fullscreenElement ?? document.webkitFullscreenElement;
      setFull(!!el && el === boxRef.current);
    };
    document.addEventListener('fullscreenchange', h);
    document.addEventListener('webkitfullscreenchange', h);
    return () => {
      document.removeEventListener('fullscreenchange', h);
      document.removeEventListener('webkitfullscreenchange', h);
    };
  }, []);

  const toggleFull = () => {
    const el = boxRef.current;
    if (!el) return;
    if (document.fullscreenElement ?? document.webkitFullscreenElement) (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document);
    else (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
  };

  const quality = resolution
    ? (Math.max(resolution.width, resolution.height) >= 1900 ? 'Full HD' : `${Math.min(resolution.width, resolution.height)}p`)
    : null;

  return (
    <div className="cam-vf" ref={boxRef} data-live={isLive}>
      <video ref={videoRef} className="cam-video" data-live={isLive} autoPlay playsInline muted
             aria-label="Live camera preview" />
      {isLive && showCrop && <div className="cam-crop" aria-hidden="true" />}


      {isLoading && (
        <div className="cam-ov" role="status" aria-live="polite">
          <div className="cam-spin" aria-hidden="true" />
          <h3>Waiting for permission…</h3>
          <p>Tap <b>Allow</b> when your browser asks to use the camera.</p>
        </div>
      )}
      {isIdle && (
        <div className="cam-ov">
          <span className="cam-ov-ic"><Camera size={28} /></span>
          <p>OldLuna needs your camera to take your four photos.</p>
          <button type="button" className="pb-btn pb-btn--primary pb-btn--lg" onClick={onAllow}><Camera size={18} />Allow camera</button>
          <p className="cam-ov-note"><Lock size={13} aria-hidden="true" />Photos stay on your device. Nothing is uploaded.</p>
        </div>
      )}
      {(isDenied || isError) && (
        <div className="cam-ov" role="alert">
          <span className="cam-ov-ic">{isDenied ? <Lock size={28} /> : <Camera size={28} />}</span>
          <h3>{isDenied ? 'Camera access is blocked' : 'Camera unavailable'}</h3>
          <p>{error ?? 'OldLuna needs your camera to take photos.'}</p>
          {isDenied && (
            <ol className="cam-steps">
              <li>Tap the lock or camera icon next to the address bar.</li>
              <li>Set Camera to <b>Allow</b>.</li>
              <li>Come back here and tap <b>Try again</b>.</li>
            </ol>
          )}
          <button type="button" className="pb-btn pb-btn--primary pb-btn--lg" onClick={onAllow}><RotateCcw size={18} />Try again</button>
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Main screen: Step 1 (Camera Settings) and Step 2 (Photobooth) ── */
export default function CameraScreen({
  step = 1, onStepChange,
  videoRef, camState, camError, onAllowCamera,
  devices = [], deviceId = '', onDeviceChange, resolution,
  soundEnabled, onSoundToggle,
  onCapture, onCancelCapture,
  captureState, countdown, currentShot,
  isCapturing, isReady, photoUrls = [], total = 4, retakeIndex = null,
  captureError = null, onRetryCapture,
}) {
  const locked   = isCapturing;
  const canGo    = isReady && !isCapturing;
  const done     = captureState === CS.DONE && photoUrls.length > 0 && retakeIndex === null;
  const isRetake = retakeIndex !== null;
  const isShootSequence = isCapturing || currentShot > 0 || countdown !== null || captureState === CS.FLASH || captureState === CS.PROCESSING;
  const [announce, setAnnounce] = useState('');
  useEffect(() => { setAnnounce(isReady ? 'Camera is ready' : ''); }, [isReady]);

  const go = n => { playClick(soundEnabled); onStepChange?.(n); };

  const overlays = (
    <>
      {isCapturing && countdown !== null && (
        <div className="cam-cd">
          <Countdown value={countdown} currentShot={currentShot} totalShots={total} onCancel={onCancelCapture} />
        </div>
      )}
      {captureError && (
        <div className="cam-ov" role="alert">
          <span className="cam-ov-ic"><Camera size={28} /></span>
          <h3>Photo not saved</h3>
          <p>{captureError}</p>
          <button type="button" className="pb-btn pb-btn--primary" onClick={onRetryCapture}><RotateCcw size={18} />Try again</button>
        </div>
      )}
      {captureState === CS.PROCESSING && (
        <div className="cam-proc" role="status"><div className="cam-spin" aria-hidden="true" /><p>Developing…</p></div>
      )}
    </>
  );

  const viewfinderProps = {
    videoRef, camState, error: camError, onAllow: onAllowCamera,
    resolution, soundEnabled, onSoundToggle,
  };

  return (
    <div className="pb-screen">
      <p className="sr-only" aria-live="polite">{announce}</p>

      {/* ───────── STEP 1 — Camera Settings ───────── */}
      {step === 1 && (
        <div className="cam-s1" data-live={isReady}>
          <Viewfinder {...viewfinderProps} showCrop={false}>{overlays}</Viewfinder>

          <section className="pb-card cam-card" aria-label="Camera setup">
            <div>
              <span className="pb-eyebrow">Setup</span>
              <h2>Your Camera</h2>
            </div>

            <div className="cam-field">
              <label className="pb-label" htmlFor="cam-select">Select camera</label>
              <div className="pb-select">
                <select id="cam-select" value={deviceId} disabled={!devices.length || locked}
                        onChange={e => onDeviceChange?.(e.target.value)}>
                  {!devices.length && <option value="">Default camera</option>}
                  {devices.map((d, i) => <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
                </select>
                <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" />
              </div>
            </div>


            <button type="button" className="pb-btn pb-btn--primary pb-btn--block pb-btn--lg" disabled={!canGo} onClick={() => go(2)}>
              Continue <ArrowRight size={18} />
            </button>
            {!isReady && camState !== CAM.REQUESTING && <p className="cam-hint">Camera needs to be on to continue.</p>}
          </section>
        </div>
      )}

      {/* ───────── STEP 2 — Photobooth ───────── */}
      {step === 2 && (
        <div className="cam-s2">
          <Viewfinder {...viewfinderProps} showCrop>
            {overlays}
            {isReady && !isShootSequence && captureState !== CS.PROCESSING && !captureError && !done && (
              <div className="cam-start">
                <span className="cam-start-hint">
                  {isRetake ? `Replacing photo ${retakeIndex + 1}` : `${total} photos · 5 seconds apart`}
                </span>
                <button type="button" className="pb-btn pb-btn--primary pb-btn--lg" onClick={onCapture}
                        aria-label={isRetake ? 'Start retake' : 'Start capture'}>
                  <Camera size={20} />
                  {isRetake ? 'Retake photo' : 'START'}
                </button>
              </div>
            )}
          </Viewfinder>

          <div className="cam-side">
            <div className="cam-strip" aria-label="Photo strip">
              {Array.from({ length: total }).map((_, i) => {
                const url = photoUrls[i];
                const active = isCapturing && currentShot === i + 1 && (!url || isRetake);
                return (
                  <div key={i} className={`cam-slot ${url ? 'is-filled' : ''} ${active ? 'is-active' : ''}`}>
                    {url ? <img src={url} alt={`Photo ${i + 1}`} /> : i + 1}
                    {url && <span className="cam-slot-n">{i + 1}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}