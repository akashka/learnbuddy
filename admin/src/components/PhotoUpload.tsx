import { useState, useRef, useEffect } from 'react';

const MAX_SIZE = 400;
const JPEG_QUALITY = 0.85;

function resizeImageToDataUrl(
  dataUrl: string,
  maxSize: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = (h * maxSize) / w;
          w = maxSize;
        } else {
          w = (w * maxSize) / h;
          h = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      try {
        const result = canvas.toDataURL('image/jpeg', quality);
        resolve(result);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

interface PhotoUploadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  className?: string;
}

export function PhotoUpload({ value, onChange, label = 'Profile photo', className = '' }: PhotoUploadProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      return;
    }
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const hasVideo = devices.some((d) => d.kind === 'videoinput');
        setHasCamera(hasVideo);
      })
      .catch(() => setHasCamera(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !hasCamera) return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setHasCamera(false));
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraOpen, hasCamera]);

  const handleCapture = async () => {
    if (!videoRef.current || !streamRef.current) return;
    setCapturing(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCapturing(false);
      return;
    }
    ctx.drawImage(video, 0, 0);
    streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const resized = await resizeImageToDataUrl(dataUrl, MAX_SIZE, JPEG_QUALITY);
    onChange(resized);
    setCapturing(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const resized = await resizeImageToDataUrl(dataUrl, MAX_SIZE, JPEG_QUALITY);
      onChange(resized);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openCamera = () => {
    setMenuOpen(false);
    setCameraOpen(true);
  };

  const openFileUpload = () => {
    setMenuOpen(false);
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-accent-700">{label}</label>
      )}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-accent-200 bg-accent-100">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-accent-400">
              👤
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg border border-accent-200 px-3 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
            >
              {value ? 'Change photo' : 'Add photo'}
            </button>
          {menuOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-accent-200 bg-white py-1 shadow-lg">
              {hasCamera && (
                <button
                  type="button"
                  onClick={openCamera}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-accent-700 hover:bg-accent-50"
                >
                  📷 Take photo
                </button>
              )}
              <button
                type="button"
                onClick={openFileUpload}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-accent-700 hover:bg-accent-50"
              >
                📁 Upload photo
              </button>
            </div>
          )}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 p-4">
          <p className="mb-4 text-white">Position your face and click Capture</p>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-h-[70vh] max-w-full rounded-lg border-2 border-white object-contain"
          />
          <div className="mt-4 flex gap-4">
            <button
              type="button"
              onClick={handleCapture}
              disabled={capturing}
              className="rounded-lg bg-accent-600 px-6 py-2 font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {capturing ? 'Capturing...' : 'Capture'}
            </button>
            <button
              type="button"
              onClick={() => {
                streamRef.current?.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
                setCameraOpen(false);
              }}
              className="rounded-lg border border-white px-6 py-2 text-white hover:bg-white/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
