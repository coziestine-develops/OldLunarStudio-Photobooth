/** PairSnap step 3 — camera, current-pose card, countdown and the four-shot progress panel. */
import { useRef, useEffect } from 'react';
import { Camera, RotateCcw, ArrowRight, Lock, X } from '../../icons.jsx';
import { CAM } from '../../hooks/useCamera.js';
import { CS } from '../../hooks/useCapture.js';
import { WATERMARK_TEXT } from '../../utils/watermark.js';
import Countdown from '../Countdown.jsx';

export default function PairCamera({
  cam, cap, poses, total = 4, running, retakeIdx,
  onStart, onCancel, onRetake, onContinue,
}) {
  const boxRef = useRef(null);

  const live = cam.state === CAM.GRANTED;
  const urls = cap.photoUrls;
  const allDone = urls.length >= total && retakeIdx === null && !running;

  /* which pose is the user working on right now */
  const curIdx = retakeIdx !== null ? retakeIdx : Math.min(urls.length, total - 1);
  const curPose = poses[curIdx];

  useEffect(() => { cam.reattach(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    const v = cam.videoRef.current;
    if (!v) return;
    const h = () => v.play().catch(() => {});
    v.addEventListener('canplay', h);
    v.addEventListener('loadedmetadata', h);
    return () => { v.removeEventListener('canplay', h); v.removeEventListener('loadedmetadata', h); };
  }, [cam.videoRef]);

  const startLabel = retakeIdx !== null ? 'Retake' : urls.length > 0 ? 'Resume' : 'Start';

  return (
    <div className="ps-cam">
      <div className="ps-cam-main">
        <div className="ps-vf" ref={boxRef} data-live={live}>
          <video ref={cam.videoRef} className="ps-video" autoPlay playsInline muted disablePictureInPicture disableRemotePlayback
                 aria-label="Live camera preview" />

          {/* what ends up in the strip: the centre 4:3 of the picture */}
          {live && <div className="ps-crop" aria-hidden="true" />}

          {live && curPose && !allDone && (
            <div className="ps-ref" aria-label={`${curPose.title}, ${curIdx + 1}/${total}`}>
              <div className="ps-ref-hd"><small>MATCH THIS</small><strong>{curIdx + 1}/{total}</strong></div>
              <div className="ps-ref-frame"><img src={curPose.image} alt="" /></div>
            </div>
          )}

          {live && running && cap.countdown !== null && (
            <div className="cam-cd">
              <Countdown value={cap.countdown} currentShot={cap.currentShot} totalShots={total} onCancel={onCancel} />
            </div>
          )}

          {live && running && cap.countdown === null && (
            <button type="button" className="ps-cancel" onClick={onCancel}><X size={14} aria-hidden="true" />Cancel</button>
          )}

          {live && !running && !cap.error && (
            <div className="ps-start">
              {allDone ? (
                <button type="button" className="pb-btn pb-btn--primary pb-btn--lg" onClick={onContinue}>
                  Edit &amp; download <ArrowRight size={20} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="pb-btn pb-btn--primary pb-btn--lg" onClick={onStart} aria-label={`${startLabel} capture`}>
                  <Camera size={20} aria-hidden="true" />{startLabel}
                </button>
              )}
            </div>
          )}

          {cam.state === CAM.REQUESTING && (
            <div className="cam-ov" role="status" aria-live="polite"><div className="cam-spin" aria-hidden="true" /><h3>Starting camera…</h3></div>
          )}
          {(cam.state === CAM.IDLE || cam.state === CAM.DENIED || cam.state === CAM.ERROR) && (
            <div className="cam-ov" role="alert">
              <span className="cam-ov-ic"><Lock size={28} /></span>
              <h3>{cam.state === CAM.DENIED ? 'Camera access is blocked' : cam.state === CAM.ERROR ? 'Camera unavailable' : 'Camera is off'}</h3>
              <p>{cam.error ?? 'Turn the camera on to take your four photos.'}</p>
              <button type="button" className="pb-btn pb-btn--primary pb-btn--lg" onClick={() => cam.request({ force: true })}><RotateCcw size={18} />{cam.state === CAM.IDLE ? 'Turn on camera' : 'Try again'}</button>
            </div>
          )}
          {cap.error && (
            <div className="cam-ov" role="alert">
              <span className="cam-ov-ic"><Camera size={28} /></span>
              <h3>Photo not saved</h3><p>{cap.error}</p>
              <button type="button" className="pb-btn pb-btn--primary" onClick={() => { cap.clearError(); onStart(); }}><RotateCcw size={18} />Try again</button>
            </div>
          )}
        </div>
      </div>

      <aside className="ps-panel" aria-label={`Photo strip, ${Math.min(urls.length, total)} of ${total} taken`}>
        <div className="ps-shots">
          {Array.from({ length: total }).map((_, i) => {
            const url = urls[i], p = poses[i];
            const isCur = !allDone && i === curIdx;
            const retaking = isCur && retakeIdx === i && running && cap.captureState !== CS.IDLE && cap.captureState !== CS.DONE && cap.captureState !== CS.FLASH;
            const state = url && !retaking ? 'done' : isCur ? 'current' : 'next';
            return (
              <div key={i} className={`ps-shot is-${state}`}>
                {/* empty slot: the chosen pose, faded, as a guide · taken slot: your photo */}
                <img src={state === 'done' ? url : p?.image} alt={state === 'done' ? `Photo ${i + 1}` : `Pose ${i + 1}: ${p?.title ?? ''}`} draggable="false" />
                {state !== 'done' && <span className="ps-shot-n">{i + 1}</span>}
                {state === 'done' && (
                  <button type="button" className="ps-shot-re" disabled={running || !live} onClick={() => onRetake(i)} aria-label={`Retake photo ${i + 1}`}>
                    <RotateCcw size={14} aria-hidden="true" /><span>Retake</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}