import { useEffect, useRef, useState, useCallback } from 'react';
import { Modal } from '@/components/Modal';

const MAX_IMAGE_MB = 5;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

function approxBytesFromDataUrl(dataUrl: string): number {
  const i = dataUrl.indexOf(',');
  const base64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  return (base64.length * 3) / 4;
}

/** Capture JPEG from video; shrink / lower quality until under max size */
function captureJpegFromVideo(video: HTMLVideoElement): string {
  let w = video.videoWidth;
  let h = video.videoHeight;
  if (!w || !h) return '';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  for (let scaleAttempt = 0; scaleAttempt < 8; scaleAttempt++) {
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);

    for (let q = 0.92; q >= 0.45; q -= 0.06) {
      const dataUrl = canvas.toDataURL('image/jpeg', q);
      if (approxBytesFromDataUrl(dataUrl) <= MAX_IMAGE_BYTES) {
        return dataUrl;
      }
    }

    w = Math.floor(w * 0.85);
    h = Math.floor(h * 0.85);
    if (w < 320 || h < 240) break;
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.45);
}

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with JPEG data URL. Return `false` to keep the camera open (e.g. validation failed). */
  onCapture: (dataUrl: string) => void | boolean;
  /** Front camera for selfies, back for documents */
  facingMode: 'user' | 'environment';
  title: string;
}

export function CameraCaptureModal({ isOpen, onClose, onCapture, facingMode, title }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    let cancelled = false;
    setStarting(true);

    const videoConstraints: MediaTrackConstraints = {
      facingMode: { ideal: facingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          el.play().catch(() => {});
        }
      })
      .catch(() => {
        setError(
          'Could not open the camera. Allow camera permission in your browser, or use “Upload” instead.'
        );
      })
      .finally(() => {
        if (!cancelled) setStarting(false);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const el = videoRef.current;
      if (el) el.srcObject = null;
    };
  }, [isOpen, facingMode]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera is not ready yet. Wait a moment and try again.');
      return;
    }
    const dataUrl = captureJpegFromVideo(video);
    if (!dataUrl) {
      setError('Could not capture image. Try again.');
      return;
    }
    if (approxBytesFromDataUrl(dataUrl) > MAX_IMAGE_BYTES) {
      setError(`Photo is still too large (max ${MAX_IMAGE_MB}MB). Try better lighting or use Upload.`);
      return;
    }
    const shouldClose = onCapture(dataUrl);
    if (shouldClose !== false) onClose();
  }, [onCapture, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex max-h-[min(90vh,640px)] w-full flex-col overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-4 py-3 sm:px-5">
          <h2 className="pr-2 text-lg font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-white/90 transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative min-h-[200px] flex-1 bg-black">
          {starting && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="text-sm">Starting camera…</span>
            </div>
          )}
          <video
            ref={videoRef}
            className="h-full min-h-[240px] w-full object-cover sm:min-h-[280px]"
            playsInline
            muted
            autoPlay
          />
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <div className="flex shrink-0 flex-col gap-2 border-t border-brand-100 bg-gradient-to-b from-white to-brand-50/30 px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="order-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={starting || !!error}
            className="order-1 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 sm:order-2"
          >
            Capture photo
          </button>
        </div>
      </div>
    </Modal>
  );
}
