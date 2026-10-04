/**
 * useCapture — manages the full capture session.
 * Configurable timer (3/5/10s), multi-photo, cancel, busyRef.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { captureFrame } from '../utils/canvas.js';
import { playBeep, playShutter, playSuccess } from '../utils/sounds.js';

export const CS = { IDLE:'idle', COUNTDOWN:'countdown', FLASH:'flash', PROCESSING:'processing', DONE:'done' };
export const PHOTO_COUNTS = [1, 3, 4, 6];
export const TIMER_OPTIONS = [3, 5, 10];
export const DEFAULT_TIMER = 5;
export const DEFAULT_COUNT = 3;

const sleep = ms => new Promise(r=>setTimeout(r,ms));

export function useCapture(videoRef) {
  // (cleanup of object URLs happens in reset() and on unmount below)
  const [captureState,   setCS]       = useState(CS.IDLE);
  const [countdown,      setCountdown] = useState(null);
  const [currentShot,    setShot]      = useState(0);
  const [photos,         setPhotos]    = useState([]); // PNG Blobs
  const [photoUrls,      setUrls]      = useState([]); // data URLs for preview
  const [isFlashing,     setFlashing]  = useState(false);
  const [error,          setError]     = useState(null);

  const busy   = useRef(false);
  const photosRef = useRef([]);     // always-current copy of blobs (state can lag behind async loops)
  const urlsRef   = useRef([]);
  const runId  = useRef(0);        // bumped on start / cancel / reset so stale loops stop

  /** Run countdown from `from` down to 1. Returns false if aborted. */
  const runCountdown = useCallback(async (from, soundEnabled, id) => {
    setCS(CS.COUNTDOWN);
    for (let i=from; i>=1; i--) {
      if (runId.current !== id) return false;
      setCountdown(i);
      playBeep(i, soundEnabled);
      await sleep(1000);
    }
    setCountdown(null);
    return true;
  }, []);

  /** Capture one frame and return [Blob, dataUrl]. */
  const captureOne = useCallback(async (filterId, mirror, soundEnabled) => {
    if (!videoRef.current) return [null, null];
    setCS(CS.FLASH); setFlashing(true);
    playShutter(soundEnabled);
    await sleep(100);
    try {
      let blob;
      try { blob = await captureFrame(videoRef.current, filterId, mirror); }
      catch (e) { await sleep(250); blob = await captureFrame(videoRef.current, filterId, mirror); } // one silent retry
      return [blob, blob ? URL.createObjectURL(blob) : null];
    } finally {
      setFlashing(false);
    }
  }, [videoRef]);

  /**
   * Start a full capture session or retake a single slot.
   * @param {{ filterId, timerSecs, photoCount, mirror, soundEnabled, retakeIndex }} opts
   */
  const start = useCallback(async ({ filterId='normal', timerSecs=5, photoCount=3, mirror=false, soundEnabled=true, retakeIndex=null, resume=false }) => {
    if (busy.current) return;
    busy.current = true;
    const id = ++runId.current;
    const live = () => runId.current === id;

    setError(null);
    try {
      const isRetake = retakeIndex !== null;
      const slots    = isRetake ? 1 : photoCount;

      // resume = keep the photos already taken and continue from the first missing slot
      const startAt = (!isRetake && resume) ? Math.min(photosRef.current.length, photoCount) : 0;
      if (!isRetake && startAt === 0) {
        urlsRef.current.forEach(u => u && URL.revokeObjectURL(u));
        photosRef.current = []; urlsRef.current = [];
        setPhotos([]); setUrls([]); setShot(0);
      }

      const collectedBlobs = [];
      const collectedUrls  = [];

      for (let i=startAt; i<slots; i++) {
        if (!live()) break;
        const shotNum = isRetake ? retakeIndex+1 : i+1;
        setShot(shotNum);

        const ok = await runCountdown(timerSecs, soundEnabled, id);
        if (!ok || !live()) break;

        const [blob, url] = await captureOne(filterId, mirror, soundEnabled);
        if (!live()) break;
        if (!blob) throw new Error('empty capture');

        collectedBlobs.push(blob);
        collectedUrls.push(url);
        setCS(CS.IDLE);

        if (!isRetake) {
          photosRef.current = [...photosRef.current, blob];
          urlsRef.current   = [...urlsRef.current, url];
          setPhotos(photosRef.current);
          setUrls(urlsRef.current);
        }

        // Brief inter-shot pause
        if (i < slots-1) await sleep(1100);
      }

      if (!live()) return; // cancelled or reset: cancel()/reset() already restored state

      if (isRetake && collectedBlobs.length > 0) {
        // Replace the specified slot
        const old = urlsRef.current[retakeIndex];
        const nb = [...photosRef.current]; nb[retakeIndex] = collectedBlobs[0];
        const nu = [...urlsRef.current];   nu[retakeIndex] = collectedUrls[0];
        photosRef.current = nb; urlsRef.current = nu;
        setPhotos(nb); setUrls(nu);
        if (old) setTimeout(() => URL.revokeObjectURL(old), 2000); // after the UI swapped to the new image
      }

      playSuccess(soundEnabled);
      setCS(CS.DONE);
    } catch (err) {
      console.error('Capture failed', err);
      if (live()) { setError('We could not take the photo. Please try again.'); setCS(CS.IDLE); setCountdown(null); }
    } finally {
      setFlashing(false);
      if (live()) busy.current = false;
    }
  }, [runCountdown, captureOne]);

  const cancel = useCallback(() => {
    runId.current++; busy.current = false;
    setCountdown(null); setFlashing(false); setCS(CS.IDLE);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => () => { runId.current++; urlsRef.current.forEach(u => u && URL.revokeObjectURL(u)); }, []);

  /** Back to idle but KEEP the photos (used before retaking a single slot). */
  const rearm = useCallback(() => {
    runId.current++; busy.current = false;
    setCountdown(null); setFlashing(false); setShot(0); setCS(CS.IDLE);
  }, []);

  const reset = useCallback(() => {
    runId.current++; busy.current = false;
    urlsRef.current.forEach(u => u && URL.revokeObjectURL(u));
    photosRef.current = []; urlsRef.current = [];
    setCS(CS.IDLE); setCountdown(null); setFlashing(false);
    setShot(0); setPhotos([]); setUrls([]); setError(null);
  }, []);

  /** Keep blobs/urls in the order the user arranged them (so retake indexes stay correct). */
  const reorder = useCallback((newUrls) => {
    const order = newUrls.map(u => urlsRef.current.indexOf(u));
    if (order.some(i => i < 0) || order.length !== urlsRef.current.length) return;
    photosRef.current = order.map(i => photosRef.current[i]);
    urlsRef.current   = [...newUrls];
    setPhotos(photosRef.current); setUrls(urlsRef.current);
  }, []);

  return {
    reorder,
    captureState, countdown, currentShot,
    photos, photoUrls, isFlashing, error, clearError,
    isCapturing: captureState!==CS.IDLE && captureState!==CS.DONE,
    isBusy: busy.current,
    start, cancel, rearm, reset,
  };
}
