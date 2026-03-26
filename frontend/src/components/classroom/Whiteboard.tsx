import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

interface WhiteboardProps {
  socket: Socket | null;
  sessionId: string;
  isTeacher: boolean;
  studentBoardEnabled: boolean;
  onToggleStudentBoard?: (enabled: boolean) => void;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export default function Whiteboard({
  socket,
  sessionId,
  isTeacher,
  studentBoardEnabled,
  onToggleStudentBoard,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1e40af');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const canDraw = isTeacher || studentBoardEnabled;

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      // Save current content
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      if (ctx) {
        ctx.scale(dpr, dpr);
        if (imageData) ctx.putImageData(imageData, 0, 0);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Listen for remote strokes
  useEffect(() => {
    if (!socket) return;

    const handleStroke = (stroke: Stroke) => {
      drawStroke(stroke);
    };

    const handleClear = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };

    socket.on('board:stroke', handleStroke);
    socket.on('board:clear', handleClear);

    return () => {
      socket.off('board:stroke', handleStroke);
      socket.off('board:clear', handleClear);
    };
  }, [socket]);

  const drawStroke = useCallback((stroke: Stroke) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = stroke.color === 'eraser' ? 'destination-out' : 'source-over';
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw) return;
    setIsDrawing(true);
    const pos = getPos(e);
    currentStrokeRef.current = [pos];

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canDraw) return;
    const pos = getPos(e);
    currentStrokeRef.current.push(pos);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? strokeWidth * 4 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Send stroke to other side
    if (socket && currentStrokeRef.current.length > 1) {
      const stroke: Stroke = {
        points: currentStrokeRef.current,
        color: tool === 'eraser' ? 'eraser' : color,
        width: tool === 'eraser' ? strokeWidth * 4 : strokeWidth,
      };
      socket.emit('board:stroke', { sessionId, stroke });
    }
    currentStrokeRef.current = [];
  };

  const clearBoard = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    socket?.emit('board:clear', sessionId);
  };

  const takeScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `board-${sessionId}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const colors = ['#1e40af', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#000000'];
  const widths = [2, 3, 5, 8];

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-slate-900/80 px-3 py-2 backdrop-blur-sm">
        {/* Pen / Eraser */}
        <div className="flex rounded-lg bg-white/10 p-0.5">
          <button
            onClick={() => setTool('pen')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tool === 'pen' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            ✏️ Pen
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tool === 'eraser' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            🧹 Eraser
          </button>
        </div>

        {/* Colors */}
        {tool === 'pen' && (
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Stroke Width */}
        <div className="flex items-center gap-1">
          {widths.map((w) => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              className={`flex h-7 w-7 items-center justify-center rounded-md ${strokeWidth === w ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <div className="rounded-full bg-white" style={{ width: w * 2, height: w * 2 }} />
            </button>
          ))}
        </div>

        {/* Teacher Controls */}
        {isTeacher && (
          <>
            <div className="mx-2 h-5 w-px bg-white/20" />
            <button
              onClick={clearBoard}
              className="rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
            >
              🗑️ Clear
            </button>
            <button
              onClick={takeScreenshot}
              className="rounded-md bg-emerald-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
            >
              📸 Screenshot
            </button>
            <button
              onClick={() => onToggleStudentBoard?.(!studentBoardEnabled)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                studentBoardEnabled
                  ? 'bg-amber-600 text-white hover:bg-amber-500'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {studentBoardEnabled ? '🔓 Student Can Draw' : '🔒 Student Blocked'}
            </button>
          </>
        )}

        {/* Draw status for student */}
        {!isTeacher && (
          <span className={`ml-auto text-xs ${canDraw ? 'text-emerald-400' : 'text-gray-500'}`}>
            {canDraw ? '✏️ You can draw' : '🔒 Drawing disabled by teacher'}
          </span>
        )}
      </div>

      {/* Canvas */}
      <div className="relative flex-1 bg-white">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 ${canDraw ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
    </div>
  );
}
