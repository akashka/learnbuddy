import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { apiJson, API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenshotPrevention } from '@/hooks/useScreenshotPrevention';

import Whiteboard from '@/components/classroom/Whiteboard';
import VideoFeed from '@/components/classroom/VideoFeed';
import LiveTranscription from '@/components/classroom/LiveTranscription';
import WarningToast from '@/components/classroom/WarningToast';
import ProctoringMonitor from '@/components/classroom/ProctoringMonitor';

interface SessionData {
  _id: string;
  subject: string;
  classLevel: string;
  teacher?: { name: string };
  student?: { name: string };
  studentBoardEnabled: boolean;
}

/**
 * Main Classroom Page
 * Mounts full-screen, connects Socket.io, initializes local media, and orchestrates components.
 */
export default function ClassroomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [studentBoardEnabled, setStudentBoardEnabled] = useState(false);

  // Apply screenshot prevention
  useScreenshotPrevention(user?.email || 'Unknown User');

  // Load session & initialize socket
  useEffect(() => {
    if (!sessionId || !token || !user) return;

    // Fetch session details
    apiJson<{ session: SessionData }>(`/api/classroom/session/detail?sessionId=${sessionId}`)
      .then((data) => {
        setSession(data.session);
        setStudentBoardEnabled(data.session.studentBoardEnabled);
      })
      .catch((err) => setError(err.message));

    // Initialize Socket
    const newSocket = io(API_BASE, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-room', sessionId);
    });

    newSocket.on('session:state', (data: { state: string }) => {
      if (data.state === 'completed') {
        setSessionEnded(true);
      }
    });

    newSocket.on('board:permission', (data: { enabled: boolean }) => {
      setStudentBoardEnabled(data.enabled);
    });

    setSocket(newSocket);

    // Initialize Camera + Mic
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => setLocalStream(stream))
      .catch(() => setError('Failed to access camera/microphone. Please check permissions.'));

    return () => {
      newSocket.disconnect();
      setLocalStream((s) => {
        s?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, [sessionId, token, user]);

  const toggleStudentBoard = async (enabled: boolean) => {
    if (!sessionId || user?.role !== 'teacher') return;
    setStudentBoardEnabled(enabled);
    socket?.emit('board:permission', { sessionId, enabled });
    try {
      await apiJson('/api/classroom/session/board', {
        method: 'POST',
        body: JSON.stringify({ sessionId, studentBoardEnabled: enabled }),
      });
    } catch (e) {
      console.error('Failed to save board permission', e);
    }
  };

  const endClass = async () => {
    if (!confirm('Are you sure you want to end this class? This will disconnect the student.')) return;
    try {
      await apiJson('/api/classroom/session/end', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      navigate('/teacher/classes');
    } catch (e) {
      alert('Failed to end class: ' + (e as Error).message);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/50 p-8 text-center max-w-lg">
          <p className="text-4xl mb-4">🚫</p>
          <h1 className="text-xl font-bold text-red-400 mb-2">Classroom Error</h1>
          <p className="text-red-200/80 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="rounded-lg bg-white/10 px-6 py-2 hover:bg-white/20">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center animate-fade-in">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-2xl font-bold mb-2">Class Ended</h1>
          <p className="text-gray-400 mb-6">The teacher has ended this session.</p>
          <button onClick={() => navigate(`/${user?.role}/classes`)} className="rounded-xl bg-brand-600 px-8 py-3 font-semibold hover:bg-brand-500">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session || !socket || !localStream || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-brand-400" />
          <span>Setting up classroom...</span>
        </div>
      </div>
    );
  }

  const isTeacher = user.role === 'teacher';
  const otherName = isTeacher ? session.student?.name || 'Student' : session.teacher?.name || 'Teacher';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 text-white">
      {/* Top Header — fixed height, sits above everything */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 py-2 backdrop-blur-md">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">{session.subject}</h1>
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-gray-300">
            {session.classLevel}
          </span>
          <span className="text-sm text-gray-400">with {otherName}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-red-300">Recording</span>
          </div>

          {isTeacher ? (
            <button onClick={endClass} className="rounded-lg bg-red-600/90 px-4 py-1.5 text-sm font-medium hover:bg-red-500">
              End Class
            </button>
          ) : (
            <button onClick={() => navigate('/student/classes')} className="rounded-lg bg-white/10 px-4 py-1.5 text-sm font-medium hover:bg-white/20">
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace — takes all remaining space below header */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Whiteboard fills 100% of this container; its internal toolbar is at the top of the whiteboard */}
        <Whiteboard
          socket={socket}
          sessionId={sessionId!}
          isTeacher={isTeacher}
          studentBoardEnabled={studentBoardEnabled}
          onToggleStudentBoard={toggleStudentBoard}
        />

        <VideoFeed
          socket={socket}
          sessionId={sessionId!}
          localStream={localStream}
          remoteLabel={otherName}
        />

        <ProctoringMonitor
          sessionId={sessionId!}
          role={user.role}
          localStream={localStream}
        />
      </div>

      {/* Footer / Live Transcription */}
      <div className="shrink-0 z-40">
        <LiveTranscription
          socket={socket}
          sessionId={sessionId!}
          role={user.role}
          userName={user.email}
          otherName={otherName}
        />
      </div>

      {/* Warning toasts — shown to BOTH sides on any violation */}
      <WarningToast socket={socket} myRole={user.role} sessionId={sessionId!} />
    </div>
  );
}
