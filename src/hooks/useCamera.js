import { useState, useEffect, useRef, useCallback } from 'react';

export const CAM = { IDLE:'idle', REQUESTING:'requesting', GRANTED:'granted', DENIED:'denied', ERROR:'error' };

/* Full HD target. Tried in order: ideal 1080p (16:9) → ideal 720p → anything.
   Constraints are never strict (no `min`/`exact` on size), so a camera that cannot do 1080p still starts. */
const FHD = { width: 1920, height: 1080 };

/* The front camera is always used on phones/tablets; laptops/desktops use their default webcam
   (or the one picked in Camera Settings). There is no camera switching. */
function buildAttempts(deviceId) {
  const base = deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' };
  return [
    { ...base, width: { ideal: FHD.width }, height: { ideal: FHD.height }, aspectRatio: { ideal: 16 / 9 }, frameRate: { ideal: 30 } },
    { ...base, width: { ideal: 1280 }, height: { ideal: 720 } },
    deviceId ? { deviceId: { exact: deviceId } } : true,
  ];
}

export function useCamera() {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const reqId     = useRef(0);      // latest request wins; older ones discard their stream
  const pending   = useRef(null);   // { key, promise } — an identical request already in flight is shared, never duplicated
  const [state, setState]           = useState(CAM.IDLE);
  const [error, setError]           = useState(null);
  const [mirror, setMirror]         = useState(true);   // Mirror is ON by default (the user can still toggle it)
  const [devices, setDevices]       = useState([]);
  const [deviceId, setDeviceId]     = useState('');
  const [resolution, setResolution] = useState(null);   // { width, height }

  const attach = useCallback(stream => {
    streamRef.current = stream;
    const v = videoRef.current;
    if (v && v.srcObject !== stream) { v.srcObject = stream; v.play?.().catch(() => {}); }
    const track = stream.getVideoTracks()[0];
    const read = () => {
      const s = track?.getSettings?.() ?? {};
      if (s.width && s.height) setResolution({ width: s.width, height: s.height });
      return s;
    };
    const s = read();
    if (s.deviceId) setDeviceId(s.deviceId);
    // Came up below Full HD? Ask the track for it again (some cameras only switch after start).
    if (track && Math.max(s.width || 0, s.height || 0) < 1900 && track.applyConstraints) {
      track.applyConstraints({ width: { ideal: FHD.width }, height: { ideal: FHD.height }, frameRate: { ideal: 30 } })
        .then(read).catch(() => {});
    }
    // The camera was unplugged / taken by another app / the OS revoked it → say so instead of freezing on the last frame.
    if (track) track.onended = () => {
      if (streamRef.current !== stream) return;       // we stopped it ourselves
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setResolution(null);
      setState(CAM.ERROR);
      setError('The camera was disconnected or is being used by another app. Tap Try again.');
    };
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter(d => d.kind === 'videoinput'));
    } catch (_) { /* ignore */ }
  }, []);

  const releaseStream = () => {
    const s = streamRef.current;
    streamRef.current = null;
    s?.getTracks().forEach(t => { t.onended = null; t.stop(); });
  };

  const stop = useCallback(() => {
    reqId.current++;   // a request still waiting for permission must not resurrect the camera
    pending.current = null;
    releaseStream();
    if (videoRef.current) videoRef.current.srcObject = null;
    setResolution(null);
    setState(CAM.IDLE);
  }, []);

  const request = useCallback((opts = {}) => {
    // request() is also used directly as an onClick handler → ignore event objects
    const wantId = typeof opts.deviceId === 'string' ? opts.deviceId : deviceId;
    const key = `${wantId}|${opts.force ? 'f' : ''}`;

    // The same request is already waiting on getUserMedia → share it. Opening the camera twice at once
    // makes some devices (Windows webcams especially) fail with "camera busy".
    if (pending.current?.key === key) return pending.current.promise;

    const run = async () => {
      // Already live on the camera that was asked for? Reuse it — no new getUserMedia, no new permission prompt.
      const live = streamRef.current?.getVideoTracks().find(t => t.readyState === 'live');
      if (live && !opts.force) {
        const cur = live.getSettings?.() ?? {};
        if (!wantId || cur.deviceId === wantId) { attach(streamRef.current); setState(CAM.GRANTED); setError(null); return; }
      }

      const myId = ++reqId.current;            // a newer request supersedes this one
      releaseStream();                          // most devices can't open two cameras at once
      setState(CAM.REQUESTING); setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setState(CAM.ERROR);
        setError(window.isSecureContext === false
          ? 'Camera needs a secure (https) connection. Open this page over https or localhost.'
          : 'This browser does not support camera access. Try Chrome, Safari, Edge or Firefox.');
        return;
      }

      let lastErr = null;
      for (const video of buildAttempts(wantId)) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video, audio: false });
          if (reqId.current !== myId) { s.getTracks().forEach(t => t.stop()); return; } // superseded while waiting
          attach(s);
          setState(CAM.GRANTED);
          refreshDevices();
          return;
        } catch (err) {
          if (reqId.current !== myId) return;
          lastErr = err;
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
            setState(CAM.DENIED);
            setError('Camera permission denied. Please allow access in your browser settings.');
            return;
          }
          if (err.name === 'NotReadableError' || err.name === 'TrackStartError' || err.name === 'AbortError') break; // lower tiers will not help: the device is busy
          // OverconstrainedError / NotFoundError / etc → try the next, lower tier
        }
      }
      if (reqId.current !== myId) return;
      console.error('Camera start failed', lastErr);
      setState(CAM.ERROR);
      const n = lastErr?.name;
      setError(
        n === 'NotFoundError' || n === 'DevicesNotFoundError' ? 'No camera was found. Connect one and try again.' :
        n === 'NotReadableError' || n === 'TrackStartError'   ? 'Your camera is busy. Close other apps using it, then try again.' :
        'Could not start the camera. Check your device and try again.'
      );
    };

    const promise = run().finally(() => { if (pending.current?.promise === promise) pending.current = null; });
    pending.current = { key, promise };
    return promise;
  }, [deviceId, attach, refreshDevices]);

  const selectDevice = useCallback((id) => {
    setDeviceId(id);
    request({ deviceId: id });
  }, [request]);

  /** Re-bind the live stream to a <video> that mounted after the stream started (screen changes that don't re-render App). */
  const reattach = useCallback(() => {
    const v = videoRef.current, st = streamRef.current;
    if (v && st && v.srcObject !== st) { v.srcObject = st; v.play?.().catch(() => {}); }
  }, []);

  const toggleMirror = useCallback(() => setMirror(v => !v), []);

  // Re-attach only if the <video> got a different/empty source (e.g. after a screen change).
  // Must NOT touch srcObject when it is already correct: setting it again restarts playback.
  useEffect(() => {
    const v = videoRef.current, s = streamRef.current;
    if (v && s && v.srcObject !== s) { v.srcObject = s; v.play?.().catch(() => {}); }
  });
  useEffect(() => {
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
  }, [refreshDevices]);
  // Coming back to the tab (or rotating the phone) can leave the video paused → resume it.
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === 'hidden') return;
      const v = videoRef.current;
      if (v && streamRef.current && v.paused) v.play?.().catch(() => {});
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('orientationchange', resume);
    return () => { document.removeEventListener('visibilitychange', resume); window.removeEventListener('orientationchange', resume); };
  }, []);
  useEffect(() => () => releaseStream(), []);

  return {
    videoRef, state, error, mirror, mirrorActive: mirror,
    devices, deviceId, resolution,
    request, stop, toggleMirror, selectDevice, reattach,
    isReady: state === CAM.GRANTED,
  };
}
