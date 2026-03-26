import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { apiJson } from '@/lib/api';

interface LiveTranscriptionProps {
  socket: Socket | null;
  sessionId: string;
  role: string;
  userName: string;
  otherName: string;
}

interface TranscriptEntry {
  text: string;
  role: string;
  timestamp: string;
}

/**
 * Live speech-to-text transcription using Web Speech API.
 * Sends transcript chunks to backend and receives from other participant via socket.
 */
export default function LiveTranscription({
  socket,
  sessionId,
  role,
  userName,
  otherName,
}: LiveTranscriptionProps) {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [listening, setListening] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const recognitionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingTextRef = useRef('');

  // Start speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      if (finalText.trim()) {
        const entry: TranscriptEntry = {
          text: finalText.trim(),
          role,
          timestamp: new Date().toISOString(),
        };
        setEntries((prev) => [...prev, entry]);

        // Send to other side
        socket?.emit('transcript:chunk', {
          sessionId,
          text: finalText.trim(),
          role,
        });

        // Accumulate and save every few seconds
        pendingTextRef.current += ' ' + finalText.trim();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart
      if (listening) {
        try { recognition.start(); } catch {}
      }
    };

    try {
      recognition.start();
      setListening(true);
    } catch {}

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, []);

  // Periodic save to backend
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingTextRef.current.trim()) {
        apiJson('/api/classroom/session/transcript', {
          method: 'POST',
          body: JSON.stringify({ sessionId, text: pendingTextRef.current.trim() }),
        }).catch(() => {});
        pendingTextRef.current = '';
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Receive from other side
  useEffect(() => {
    if (!socket) return;
    const handleChunk = (data: TranscriptEntry) => {
      setEntries((prev) => [...prev, data]);
    };
    socket.on('transcript:chunk', handleChunk);
    return () => { socket.off('transcript:chunk', handleChunk); };
  }, [socket]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  const getNameForRole = (r: string) => (r === role ? userName : otherName);

  return (
    <div className="flex flex-col border-t border-white/10 bg-slate-900/90 backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
      >
        <span>
          📝 Live Transcription {listening && <span className="ml-1 text-emerald-400">● Live</span>}
        </span>
        <span>{expanded ? '▼' : '▲'}</span>
      </button>

      {expanded && (
        <div
          ref={containerRef}
          className="max-h-32 overflow-y-auto px-4 pb-3 scrollbar-thin"
        >
          {entries.length === 0 && (
            <p className="py-2 text-center text-xs text-gray-500">
              Transcription will appear here as you speak...
            </p>
          )}
          {entries.map((e, i) => (
            <div key={i} className="mb-1 text-xs">
              <span className={`font-semibold ${e.role === role ? 'text-brand-400' : 'text-emerald-400'}`}>
                {getNameForRole(e.role)}:
              </span>{' '}
              <span className="text-gray-300">{e.text}</span>
              <span className="ml-2 text-gray-600">
                {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
