import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { formatCurrency } from '@shared/formatters';

interface Course {
  _id: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  teacher?: string;
  feePerMonth?: number;
  slots?: Array<{ day?: string; startTime?: string; endTime?: string }>;
}

interface Response {
  courses: Course[];
}

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

const COURSE_GRADIENTS = [
  { header: 'from-fuchsia-500 via-pink-500 to-rose-500', badge: 'from-fuchsia-100 to-pink-100', text: 'text-fuchsia-700' },
  { header: 'from-violet-500 via-purple-500 to-indigo-600', badge: 'from-violet-100 to-purple-100', text: 'text-violet-700' },
  { header: 'from-indigo-500 via-blue-500 to-cyan-600', badge: 'from-indigo-100 to-blue-100', text: 'text-indigo-700' },
  { header: 'from-emerald-500 via-teal-500 to-green-600', badge: 'from-emerald-100 to-teal-100', text: 'text-emerald-700' },
  { header: 'from-amber-500 via-orange-500 to-rose-500', badge: 'from-amber-100 to-orange-100', text: 'text-amber-700' },
];

const DAY_ABBREV: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

export default function StudentCourses() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson<Response>('/api/student/courses')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 animate-bounce rounded-full border-4 border-fuchsia-200 border-t-fuchsia-500 bg-gradient-to-br from-fuchsia-100 to-pink-100" />
        <p className="text-lg font-semibold text-fuchsia-700">Loading your courses... 📚</p>
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

  const courses = data?.courses || [];

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-in px-4 py-6 sm:px-6 space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 px-6 py-10 shadow-2xl text-center">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-purple-400/20 blur-2xl" />
        {[
          { e: '📚', s: { left: '5%', top: '20%', fontSize: '2.5rem', opacity: 0.25 } },
          { e: '🌟', s: { right: '7%', top: '15%', fontSize: '2rem', opacity: 0.2 } },
          { e: '✏️', s: { left: '45%', bottom: '12%', fontSize: '1.8rem', opacity: 0.2 } },
        ].map((item, i) => (
          <div key={i} className="absolute animate-float" style={{ ...item.s, animationDelay: `${i * 0.7}s` }}>{item.e}</div>
        ))}
        <div className="relative">
          <h1 className="text-3xl font-black text-white drop-shadow-lg sm:text-4xl">My Courses 📚</h1>
          <p className="mt-2 text-white/90 text-lg font-semibold">Your learning adventures await!</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 backdrop-blur-sm">
            <span className="text-white font-bold">{courses.length} course{courses.length !== 1 ? 's' : ''} enrolled</span>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid">
          {courses.map((c, idx) => {
            const style = COURSE_GRADIENTS[idx % COURSE_GRADIENTS.length];
            return (
              <div
                key={c._id}
                className="animate-slide-up card-funky overflow-hidden rounded-3xl border-2 border-fuchsia-100 bg-white shadow-xl"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Header */}
                <div className={`relative bg-gradient-to-br ${style.header} px-5 py-5`}>
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-inner backdrop-blur-sm">
                      {subjectIcon(c.subject)}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white drop-shadow">{c.subject || 'Course'}</h2>
                      <p className="text-xs font-semibold text-white/85 mt-0.5">
                        {c.board && <span>{c.board} • </span>}Class {c.classLevel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  {c.teacher && (
                    <div className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${style.badge} text-lg`}>
                        👩‍🏫
                      </span>
                      <span className="text-sm font-semibold text-gray-700">{c.teacher}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${style.badge} text-lg`}>
                      💰
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      ******<span className="text-gray-400">/month</span>
                    </span>
                  </div>

                  {c.slots && c.slots.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Class Schedule</p>
                      <div className="flex flex-wrap gap-2">
                        {c.slots.map((slot, si) => (
                          <span
                            key={si}
                            className={`rounded-full bg-gradient-to-r ${style.badge} ${style.text} px-3 py-1 text-xs font-bold border border-current/10`}
                          >
                            {DAY_ABBREV[slot.day || ''] || slot.day} {slot.startTime}–{slot.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/student/exam/take?subject=${encodeURIComponent(c.subject || '')}&board=${encodeURIComponent(c.board || '')}&classLevel=${encodeURIComponent(c.classLevel || '')}`}
                    className="mt-1 block w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-3 text-center text-sm font-black text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
                  >
                    ✍️ Take Exam
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border-4 border-dashed border-fuchsia-200 bg-white p-12 text-center">
          <div className="text-6xl mb-4 animate-float">📭</div>
          <p className="text-xl font-bold text-fuchsia-700">No courses yet!</p>
          <p className="text-fuchsia-500 mt-2">Ask your parent to enroll you in a course to get started 🚀</p>
        </div>
      )}

      {/* Fun footer */}
      <div className="rounded-3xl border-4 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 text-center shadow-lg">
        <div className="text-4xl mb-2 animate-bounce-subtle">🌟</div>
        <p className="text-lg font-bold text-amber-800">Learning is your superpower!</p>
        <p className="text-sm text-amber-600 mt-1">Every subject you master opens a new door 🚪✨</p>
      </div>
    </div>
  );
}
