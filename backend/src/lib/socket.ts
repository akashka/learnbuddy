/**
 * Socket.io integration for real-time classroom features:
 * - Whiteboard stroke sync
 * - Board permission toggle
 * - WebRTC peer signalling
 * - Live transcript chunks
 * - Warning notifications
 * - Session state events
 */
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from './auth.js';

let io: Server | null = null;

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 5e6, // 5MB for board snapshots
  });

  // Auth middleware – validate JWT from handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    const decoded = verifyToken(token);
    if (!decoded) return next(new Error('Invalid token'));
    (socket as any).userId = decoded.userId;
    (socket as any).role = decoded.role;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const role = (socket as any).role as string;

    // Join a classroom room
    socket.on('join-room', (sessionId: string) => {
      socket.join(`classroom:${sessionId}`);
      socket.to(`classroom:${sessionId}`).emit('session:participant-joined', { userId, role });
    });

    // Whiteboard stroke data (path diffs)
    socket.on('board:stroke', (data: { sessionId: string; stroke: unknown }) => {
      socket.to(`classroom:${data.sessionId}`).emit('board:stroke', data.stroke);
    });

    // Board clear
    socket.on('board:clear', (sessionId: string) => {
      socket.to(`classroom:${sessionId}`).emit('board:clear');
    });

    // Board permission toggle (teacher only)
    socket.on('board:permission', (data: { sessionId: string; enabled: boolean }) => {
      if (role !== 'teacher') return;
      socket.to(`classroom:${data.sessionId}`).emit('board:permission', { enabled: data.enabled });
    });

    // WebRTC signalling
    socket.on('peer:signal', (data: { sessionId: string; signal: unknown }) => {
      socket.to(`classroom:${data.sessionId}`).emit('peer:signal', { signal: data.signal, from: userId });
    });

    // Live transcript chunk
    socket.on('transcript:chunk', (data: { sessionId: string; text: string; role: string }) => {
      socket.to(`classroom:${data.sessionId}`).emit('transcript:chunk', {
        text: data.text,
        role: data.role,
        timestamp: new Date().toISOString(),
      });
    });

    // Leave room on disconnect
    socket.on('disconnect', () => {
      // Rooms auto-cleanup on disconnect
    });
  });

  return io;
}

/** Emit a warning event to a specific classroom session */
export function emitWarning(sessionId: string, data: { level: number; reason: string; targetRole: string }) {
  if (!io) return;
  io.to(`classroom:${sessionId}`).emit('warning:issued', data);
}

/** Emit session state change */
export function emitSessionState(sessionId: string, state: string) {
  if (!io) return;
  io.to(`classroom:${sessionId}`).emit('session:state', { state });
}
