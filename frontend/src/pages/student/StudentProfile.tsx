import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

interface StudentProfileData {
  name?: string;
  studentId?: string;
  classLevel?: string;
  board?: string;
  schoolName?: string;
  photoUrl?: string;
}

const LEVEL_EMOJI: Record<string, string> = {
  '1': '🌱', '2': '🌿', '3': '🍀', '4': '🌸', '5': '🌺',
  '6': '⭐', '7': '🌟', '8': '💫', '9': '🚀', '10': '🏆',
  '11': '👑', '12': '🎓',
};

export default function StudentProfile() {
  const [data, setData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson<StudentProfileData>('/api/student/profile')
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 animate-bounce rounded-full border-4 border-fuchsia-200 border-t-fuchsia-500 bg-gradient-to-br from-fuchsia-100 to-pink-100" />
        <p className="text-lg font-semibold text-fuchsia-700">Loading your profile... ✨</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl bg-red-50 p-6 text-red-600">Error: {error}</div>
      </div>
    );
  }

  const classEmoji = data?.classLevel ? LEVEL_EMOJI[data.classLevel] || '🎓' : '🎓';
  const initials = data?.name
    ? data.name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="mx-auto w-full max-w-2xl animate-fade-in px-4 py-6 sm:px-6">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-purple-600 p-8 shadow-2xl">
        {/* decorative blobs */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-400/20 blur-xl" />
        <div className="absolute right-10 bottom-4 text-5xl opacity-20 animate-float">🌟</div>
        <div className="absolute left-6 top-4 text-4xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>⭐</div>

        <div className="relative flex flex-col items-center gap-5 text-center">
          {/* Avatar */}
          {data?.photoUrl ? (
            <img
              src={data.photoUrl}
              alt={data.name}
              className="h-28 w-28 rounded-full border-4 border-white/70 object-cover shadow-xl"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/70 bg-white/20 text-4xl font-black text-white shadow-xl backdrop-blur-sm">
              {initials}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-black text-white drop-shadow-lg">
              {data?.name || 'Student'} {classEmoji}
            </h1>
            {data?.studentId && (
              <p className="mt-1 text-sm font-semibold text-white/80">ID: {data.studentId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { icon: '🎓', label: 'Class Level', value: data?.classLevel ? `Class ${data.classLevel}` : '-' },
          { icon: '📋', label: 'Board', value: data?.board || '-' },
          { icon: '🏫', label: 'School', value: data?.schoolName || '-' },
          { icon: '🪪', label: 'Student ID', value: data?.studentId || '-' },
        ].map((item) => (
          <div
            key={item.label}
            className="card-funky flex items-center gap-4 rounded-2xl border-2 border-fuchsia-100 bg-white p-5 shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-100 to-purple-100 text-2xl">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-400">{item.label}</p>
              <p className="text-base font-bold text-fuchsia-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Fun badge */}
      <div className="mt-6 rounded-3xl border-4 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 text-center shadow-lg">
        <div className="mb-2 text-4xl animate-bounce-subtle">🏅</div>
        <p className="text-lg font-bold text-amber-800">Keep learning and growing!</p>
        <p className="text-sm text-amber-600">Every day you learn is a step toward your dream 🚀</p>
      </div>
    </div>
  );
}
