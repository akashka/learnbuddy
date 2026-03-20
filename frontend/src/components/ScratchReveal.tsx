import { useRef, useEffect, useCallback, useState } from 'react';

interface ScratchRevealProps {
  hiddenContent: React.ReactNode;
  scratchHint?: string;
  className?: string;
}

export function ScratchReveal({ hiddenContent, scratchHint = 'Scratch to reveal answer', className = '' }: ScratchRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const scratchCountRef = useRef(0);

  const drawScratch = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (revealed) return;
    isDrawingRef.current = true;
    const pos = getPos(e);
    if (pos) {
      lastPosRef.current = pos;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawScratch(ctx, pos.x, pos.y, 24);
    }
  }, [revealed, getPos, drawScratch]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current || revealed) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!pos || !ctx) return;

    if (lastPosRef.current) {
      const dx = pos.x - lastPosRef.current.x;
      const dy = pos.y - lastPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(dist / 8));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = lastPosRef.current.x + dx * t;
        const y = lastPosRef.current.y + dy * t;
        drawScratch(ctx, x, y, 20);
        scratchCountRef.current += 1;
      }
    } else {
      drawScratch(ctx, pos.x, pos.y, 20);
      scratchCountRef.current += 1;
    }
    lastPosRef.current = pos;

    if (scratchCountRef.current > 15) {
      setRevealed(true);
    }
  }, [revealed, getPos, drawScratch]);

  const handleEnd = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
        gradient.addColorStop(0, '#a5b4fc');
        gradient.addColorStop(0.4, '#c7d2fe');
        gradient.addColorStop(0.7, '#818cf8');
        gradient.addColorStop(1, '#6366f1');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < 60; i++) {
          ctx.fillRect(Math.random() * rect.width, Math.random() * rect.height, 4, 4);
        }
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [revealed]);

  if (revealed) {
    return (
      <div className={`min-h-[120px] rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6 animate-fade-in ${className}`}>
        {hiddenContent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[120px] rounded-xl overflow-hidden cursor-crosshair select-none touch-none bg-gradient-to-r from-indigo-200 via-indigo-100 to-violet-200 ${className}`}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <div className="absolute inset-0 p-6 flex flex-col justify-center">
        {hiddenContent}
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ pointerEvents: 'auto' }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-brand-700 shadow-md">
          {scratchHint}
        </span>
      </div>
    </div>
  );
}
