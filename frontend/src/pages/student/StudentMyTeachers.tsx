import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

interface CourseSlot {
  day?: string;
  startTime?: string;
  endTime?: string;
}

interface TeacherCourse {
  subject?: string;
  board?: string;
  classLevel?: string;
  slots?: CourseSlot[];
  feePerMonth?: number;
  startDate?: string;
  endDate?: string;
}

interface TeacherInfo {
  _id: string;
  name?: string;
  photoUrl?: string;
  qualification?: string;
  bio?: string;
  subjects?: string[];
  board?: string[];
  classes?: string[];
  experienceMonths?: number;
  languages?: string[];
  gender?: string;
  courses?: TeacherCourse[];
}

const DAY_COLORS = [
  'from-fuchsia-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-indigo-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
];

function expLabel(months?: number) {
  if (!months) return 'Experienced';
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} exp.`;
  const yrs = Math.floor(months / 12);
  return `${yrs} year${yrs > 1 ? 's' : ''} exp.`;
}

function TeacherCard({ teacher, idx }: { teacher: TeacherInfo; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const gradients = [
    'from-fuchsia-500 via-pink-500 to-purple-600',
    'from-indigo-500 via-violet-500 to-purple-600',
    'from-rose-500 via-pink-500 to-fuchsia-600',
    'from-blue-500 via-indigo-500 to-violet-600',
  ];
  const gradient = gradients[idx % gradients.length];

  const initials = teacher.name
    ? teacher.name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div
      className="animate-slide-up overflow-hidden rounded-3xl border-2 border-fuchsia-100 bg-white shadow-xl transition-all duration-300"
      style={{ animationDelay: `${idx * 100}ms` }}
    >
      {/* Header */}
      <div className={`relative bg-gradient-to-br ${gradient} p-6`}>
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-2 left-4 text-4xl opacity-20 animate-float">🌟</div>
        <div className="flex items-center gap-4">
          {teacher.photoUrl ? (
            <img
              src={teacher.photoUrl}
              alt={teacher.name}
              className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white/60 object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white/60 bg-white/20 text-2xl font-black text-white shadow-lg backdrop-blur-sm">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-white drop-shadow truncate">{teacher.name || 'Teacher'}</h2>
            {teacher.qualification && (
              <p className="mt-0.5 text-sm font-semibold text-white/90">{teacher.qualification}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {teacher.experienceMonths !== undefined && (
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                  ⏱ {expLabel(teacher.experienceMonths)}
                </span>
              )}
              {teacher.languages?.map((lang) => (
                <span key={lang} className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                  🗣 {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {teacher.bio && (
          <p className="mb-4 rounded-2xl bg-fuchsia-50 px-4 py-3 text-sm font-medium text-fuchsia-800 italic">
            &ldquo;{teacher.bio}&rdquo;
          </p>
        )}

        {/* Subjects / boards / classes chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {teacher.subjects?.map((s) => (
            <span key={s} className="rounded-full bg-gradient-to-r from-fuchsia-100 to-pink-100 px-3 py-1 text-xs font-bold text-fuchsia-700">
              📖 {s}
            </span>
          ))}
          {teacher.board?.map((b) => (
            <span key={b} className="rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 px-3 py-1 text-xs font-bold text-indigo-700">
              🏛 {b}
            </span>
          ))}
        </div>

        {/* My Courses with this teacher */}
        {teacher.courses && teacher.courses.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-fuchsia-50 to-pink-50 px-4 py-3 text-sm font-bold text-fuchsia-800 transition hover:from-fuchsia-100 hover:to-pink-100"
            >
              <span>📚 My Courses ({teacher.courses.length})</span>
              <span className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {expanded && (
              <div className="mt-3 space-y-3">
                {teacher.courses.map((course, ci) => (
                  <div
                    key={ci}
                    className="rounded-2xl border-2 border-fuchsia-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-fuchsia-900">{course.subject || 'Course'}</p>
                        <p className="text-xs text-gray-500">
                          {course.board} • Class {course.classLevel}
                        </p>
                      </div>
                      {course.feePerMonth && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          ₹{course.feePerMonth}/mo
                        </span>
                      )}
                    </div>
                    {course.slots && course.slots.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {course.slots.map((slot, si) => (
                          <span
                            key={si}
                            className={`rounded-full bg-gradient-to-r ${DAY_COLORS[si % DAY_COLORS.length]} px-3 py-1 text-xs font-bold text-white`}
                          >
                            {slot.day} {slot.startTime}–{slot.endTime}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentMyTeachers() {
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson<{ teachers: TeacherInfo[] }>('/api/student/my-teachers')
      .then((d) => setTeachers(d.teachers))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 animate-bounce rounded-full border-4 border-fuchsia-200 border-t-fuchsia-500 bg-gradient-to-br from-fuchsia-100 to-pink-100" />
        <p className="text-lg font-semibold text-fuchsia-700">Loading your teachers... 👩‍🏫</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-in px-4 py-6 sm:px-6">
      {/* Page Header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-10 shadow-2xl text-center">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-pink-400/20 blur-2xl" />
        <div className="absolute left-8 top-4 text-5xl opacity-20 animate-float">👩‍🏫</div>
        <div className="absolute right-8 bottom-4 text-4xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}>🎓</div>
        <div className="relative">
          <h1 className="text-3xl font-black text-white drop-shadow-lg sm:text-4xl">My Teachers 👩‍🏫</h1>
          <p className="mt-2 text-white/90 text-lg font-semibold">The amazing guides on your learning journey!</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-600 border-2 border-red-200">⚠ {error}</div>
      )}

      {teachers.length === 0 && !error ? (
        <div className="rounded-3xl border-4 border-dashed border-fuchsia-200 bg-white p-12 text-center">
          <div className="mb-4 text-6xl animate-float">🔍</div>
          <p className="text-xl font-bold text-fuchsia-800">No teachers yet!</p>
          <p className="mt-2 text-fuchsia-600">Enroll in a course to meet your amazing teachers.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {teachers.map((teacher, idx) => (
            <TeacherCard key={teacher._id} teacher={teacher} idx={idx} />
          ))}
        </div>
      )}

      {/* Motivational bottom */}
      <div className="mt-8 rounded-3xl border-4 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 text-center shadow-lg">
        <div className="mb-2 text-4xl animate-bounce-subtle">💡</div>
        <p className="text-lg font-bold text-amber-800">Learning is a superpower!</p>
        <p className="text-sm text-amber-600">Your teachers are your superheroes – ask them anything! 🦸</p>
      </div>
    </div>
  );
}
