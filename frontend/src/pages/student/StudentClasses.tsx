import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import ClassReplayViewer from '@/components/classroom/ClassReplayViewer';

interface Session {
  _id: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  teacher?: { name?: string };
  subject?: string;
  recordingUrl?: string;
  warningCounts?: { teacher: number; student: number };
}

interface Response {
  past: Session[];
  upcoming: Session[];
}

const STATUS_LABEL: Record<string, { label: string; color: string; dot: string }> = {
  scheduled: { label: 'Coming Up', color: 'bg-blue-100 text-blue-700', dot: '🔵' },
  in_progress: { label: 'Live Now!', color: 'bg-emerald-100 text-emerald-700', dot: '🟢' },
  completed: { label: 'Done', color: 'bg-gray-100 text-gray-600', dot: '✅' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600', dot: '❌' },
};

const SUBJECT_COLORS = [
  'from-fuchsia-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-indigo-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
];

const SUBJECT_ICONS: Record<string, string> = {
  math: '➗', mathematics: '➗', science: '🔬', physics: '⚛️', chemistry: '🧪',
  biology: '🧬', english: '📝', history: '🏛️', geography: '🌍', hindi: '🇮🇳',
  default: '📚',
};
function subjectIcon(subject?: string) {
  if (!subject) return '📚';
  const key = subject.toLowerCase().trim();
  for (const k of Object.keys(SUBJECT_ICONS)) {
    if (key.includes(k)) return SUBJECT_ICONS[k];
  }
  return SUBJECT_ICONS.default;
}

function UpcomingCard({ session, idx, now }: { session: Session; idx: number; now: number }) {
  const navigate = useNavigate();
  const scheduledAt = session.scheduledAt ? new Date(session.scheduledAt).getTime() : 0;
  const windowStart = scheduledAt - 5 * 60 * 1000;
  const canJoin = now >= windowStart && session.status !== 'completed';
  const isLive = session.status === 'in_progress';
  const diffMs = windowStart - now;
  const diffMin = Math.ceil(diffMs / 60000);

  const gradient = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
  const statusInfo = STATUS_LABEL[session.status || ''] || { label: session.status || '', color: 'bg-gray-100 text-gray-600', dot: '📋' };

  const timeStr = session.scheduledAt
    ? new Date(session.scheduledAt).toLocaleString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '-';

  return (
    <div
      className="animate-slide-up card-funky overflow-hidden rounded-3xl border-2 border-fuchsia-100 bg-white shadow-xl"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      {/* Color bar header */}
      <div className={`relative bg-gradient-to-r ${gradient} px-5 py-4`}>
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
        <div className="flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl shadow-inner backdrop-blur-sm">
              {subjectIcon(session.subject)}
            </div>
            <div>
              <p className="text-lg font-black text-white drop-shadow">{session.subject || 'Class'}</p>
              <p className="text-xs font-semibold text-white/85">with {session.teacher?.name || 'Your Teacher'}</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${statusInfo.color}`}>
            {statusInfo.dot} {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-lg">📅</span>
          <span>{timeStr}</span>
        </div>
        <div>
          {isLive || canJoin ? (
            <button
              type="button"
              onClick={() => navigate(`/classroom/pre-join/${session._id}`)}
              className="animate-bounce-subtle rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              {isLive ? '🔴 Rejoin Live' : '🚀 Join Class!'}
            </button>
          ) : (
            <div className="rounded-xl bg-fuchsia-50 px-4 py-2 text-sm font-bold text-fuchsia-600 border-2 border-fuchsia-100">
              ⏳ Opens in{' '}
              {diffMin > 60
                ? `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`
                : `${diffMin}m`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PastCard({ session, idx, onView }: { session: Session; idx: number; onView: (id: string) => void }) {
  const statusInfo = STATUS_LABEL[session.status || ''] || { label: session.status || '', color: 'bg-gray-100 text-gray-600', dot: '📋' };
  const violationCount = (session.warningCounts?.teacher ?? 0) + (session.warningCounts?.student ?? 0);
  const timeStr = session.scheduledAt
    ? new Date(session.scheduledAt).toLocaleString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '-';
  return (
    <div
      className="animate-slide-up flex items-center justify-between gap-4 rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 shadow-sm transition hover:border-fuchsia-200 hover:shadow-md"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
          {subjectIcon(session.subject)}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-800 truncate">{session.subject || 'Class'}</p>
          <p className="text-xs text-gray-500">{session.teacher?.name} • {timeStr}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {violationCount > 0 && (
          <span className="hidden sm:flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
            ⚠️ {violationCount}
          </span>
        )}
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusInfo.color}`}>
          {statusInfo.dot} {statusInfo.label}
        </span>
        {session.status === 'completed' && (
          <button
            onClick={() => onView(session._id)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-black text-white shadow transition hover:scale-105 hover:shadow-lg"
          >
            ▶ View
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentClasses() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [replaySessionId, setReplaySessionId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    apiJson<Response>('/api/student/classes')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 animate-bounce rounded-full border-4 border-fuchsia-200 border-t-fuchsia-500 bg-gradient-to-br from-fuchsia-100 to-pink-100" />
        <p className="text-lg font-semibold text-fuchsia-700">Loading your classes... 🚀</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-red-600">⚠ Error: {error}</div>
      </div>
    );
  }

  const upcoming = data?.upcoming || [];
  const past = data?.past || [];

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-in px-4 py-6 sm:px-6 space-y-8">
      {replaySessionId && (
        <ClassReplayViewer sessionId={replaySessionId} onClose={() => setReplaySessionId(null)} />
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-6 py-10 shadow-2xl text-center">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />
        {[
          { e: '📅', s: { left: '6%', top: '15%', fontSize: '2rem', opacity: 0.25 } },
          { e: '🚀', s: { right: '8%', top: '12%', fontSize: '1.8rem', opacity: 0.2 } },
          { e: '🎓', s: { left: '38%', bottom: '10%', fontSize: '1.8rem', opacity: 0.2 } },
        ].map((item, i) => (
          <div key={i} className="absolute animate-float" style={item.s}>{item.e}</div>
        ))}
        <div className="relative">
          <h1 className="text-3xl font-black text-white drop-shadow-lg sm:text-4xl">My Classes 📅</h1>
          <p className="mt-2 text-white/90 text-lg font-semibold">Ready to learn something awesome today?</p>
          <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-white/20 px-5 py-2 backdrop-blur-sm">
            <span className="text-white font-bold">{upcoming.length} upcoming</span>
            <span className="h-4 w-px bg-white/40" />
            <span className="text-white/80">{past.length} past classes</span>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-fuchsia-800">
          <span>🔥</span> Upcoming Classes
        </h2>
        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map((s, i) => (
              <UpcomingCard key={s._id} session={s} idx={i} now={now} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border-4 border-dashed border-fuchsia-200 bg-white p-10 text-center">
            <div className="text-5xl mb-3 animate-float">😴</div>
            <p className="text-xl font-bold text-fuchsia-700">No upcoming classes!</p>
            <p className="text-fuchsia-500 mt-1">Enjoy your break — classes will show up here 🎉</p>
          </div>
        )}
      </section>

      {/* Past */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-fuchsia-800">
          <span>🕑</span> Past Classes
        </h2>
        {past.length > 0 ? (
          <div className="space-y-2">
            {past.map((s, i) => (
              <PastCard key={s._id} session={s} idx={i} onView={setReplaySessionId} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border-4 border-dashed border-gray-200 bg-white p-8 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-lg font-bold text-gray-600">No past classes yet.</p>
          </div>
        )}
      </section>

      {/* Reminder */}
      <div className="rounded-3xl border-4 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-lg">
        <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-amber-800">
          <span>🤖</span> Remember for class
        </h3>
        <p className="text-amber-700">
          Camera and mic must be on. AI checks that you&apos;re present and focused. Let&apos;s have a great class! 🎓
        </p>
      </div>
    </div>
  );
}
