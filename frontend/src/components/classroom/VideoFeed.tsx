import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface VideoFeedProps {
  socket: Socket | null;
  sessionId: string;
  localStream: MediaStream | null;
  remoteLabel: string;
}

/**
 * Small draggable PiP video showing the remote participant via WebRTC.
 * Uses Socket.io for signalling.
 */
export default function VideoFeed({ socket, sessionId, localStream, remoteLabel }: VideoFeedProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);

  // Dragging state
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Show local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // WebRTC setup
  useEffect(() => {
    if (!socket || !localStream) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    pcRef.current = pc;

    // Add local tracks
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // On remote track
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnected(true);
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('peer:signal', {
          sessionId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Handle incoming signals
    const handleSignal = async (data: { signal: any; from: string }) => {
      try {
        if (data.signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('peer:signal', {
            sessionId,
            signal: answer,
          });
        } else if (data.signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
        } else if (data.signal.type === 'candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        }
      } catch (err) {
        console.error('WebRTC signal error:', err);
      }
    };

    // When a participant joins, the joiner sends an offer
    const handleParticipantJoined = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('peer:signal', { sessionId, signal: offer });
      } catch (err) {
        console.error('WebRTC offer error:', err);
      }
    };

    socket.on('peer:signal', handleSignal);
    socket.on('session:participant-joined', handleParticipantJoined);

    // If we're joining an existing session, send offer
    setTimeout(async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('peer:signal', { sessionId, signal: offer });
      } catch (err) {
        console.error('WebRTC initial offer error:', err);
      }
    }, 1000);

    return () => {
      socket.off('peer:signal', handleSignal);
      socket.off('session:participant-joined', handleParticipantJoined);
      pc.close();
    };
  }, [socket, localStream, sessionId]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setMuted(!muted);
    }
  };

  // Drag
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div
      className="absolute z-40 overflow-hidden rounded-2xl border-2 border-white/20 bg-black shadow-2xl"
      style={{ width: 220, height: 170, left: pos.x, top: pos.y }}
      onMouseDown={onMouseDown}
    >
      {/* Remote video (main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />

      {/* Local video (small corner) */}
      <div className="absolute bottom-1 right-1 h-12 w-16 overflow-hidden rounded-lg border border-white/30">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </div>

      {/* Label */}
      <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
        {connected ? remoteLabel : '⏳ Connecting...'}
      </div>

      {/* Mute */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleMute(); }}
        className="absolute bottom-2 left-2 rounded-full bg-black/60 p-1.5 text-xs hover:bg-black/80"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
