import { useState, useEffect, useRef, useCallback } from 'react';

export const CAM = { IDLE:'idle', REQUESTING:'requesting', GRANTED:'granted', DENIED:'denied', ERROR:'error' };

/* Full HD target. Tried in order: strict 1080p → ideal 1080p → ideal 720p → anything. */
const FHD = { width: 1920, height: 1080 };

function buildAttempts(deviceId, facingMode) {
  const base = deviceId ? { deviceId: { exact: deviceId } } : { facingMode };
  return [
    { ...base, width: { min: FHD.width, ideal: FHD.width }, height: { min: FHD.height, ideal: FHD.height }, frameRate: { ideal: 30 } },
    { ...base, width: { ideal: FHD.width }, height: { ideal: FHD.height }, aspectRatio: { ideal: 16 / 9 }, frameRate: { ideal: 30 } },
    { ...base, width: { ideal: 1280 }, height: { ideal: 720 } },
    deviceId ? { deviceId: { exact: deviceId } } : true,
  ];
}

export function useCamera() {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [state, setState]           = useState(CAM.IDLE);
  const [error, setError]           = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [mirror, setMirror]         = useState(false);
  const [devices, setDevices]       = useState([]);
  const [deviceId, setDeviceId]     = useState('');
  const [resolution, setResolution] = useState(null); // { width, height }

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
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter(d => d.kind === 'videoinput'));
    } catch (_) { /* ignore */ }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setResolution(null);
    setState(CAM.IDLE);
  }, []);

  const request = useCallback(async (opts = {}) => {
    // request() is also used directly as an onClick handler → ignore event objects
    const mode = typeof opts.mode === 'string' ? opts.mode : facingMode;
    const wantId = typeof opts.deviceId === 'string' ? opts.deviceId : deviceId;

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setState(CAM.REQUESTING); setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setState(CAM.ERROR);
      setError(window.isSecureContext === false
        ? 'Camera needs a secure (https) connection. Open this page over https or localhost.'
        : 'This browser does not support camera access. Try Chrome, Safari, Edge or Firefox.');
      return;
    }

    let lastErr = null;
    for (const video of buildAttempts(wantId, mode)) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        attach(s);
        setState(CAM.GRANTED);
        refreshDevices();
        return;
      } catch (err) {
        lastErr = err;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setState(CAM.DENIED);
          setError('Camera permission denied. Please allow access in your browser settings.');
          return;
        }
        // OverconstrainedError / NotFoundError / etc → try next, lower tier
      }
    }
    console.error('Camera start failed', lastErr);
    setState(CAM.ERROR);
    const n = lastErr?.name;
    setError(
      n === 'NotFoundError' || n === 'DevicesNotFoundError' ? 'No camera was found. Connect one and try again.' :
      n === 'NotReadableError' || n === 'TrackStartError'   ? 'Your camera is busy. Close other apps using it, then try again.' :
      'Could not start the camera. Check your device and try again.'
    );
  }, [facingMode, deviceId, attach, refreshDevices]);

  const selectDevice = useCallback((id) => {
    setDeviceId(id);
    request({ deviceId: id });
  }, [request]);

  const flip = useCallback(() => {
    const m = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(m); setDeviceId('');
    request({ mode: m, deviceId: '' });
  }, [facingMode, request]);

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
  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  return {
    videoRef, state, error, mirror,
    devices, deviceId, resolution,
    request, stop, flip, toggleMirror, selectDevice,
    isReady: state === CAM.GRANTED,
  };
}