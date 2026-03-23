import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson, API_BASE } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import AddEditStudentForm, { type AddStudentSuccessPayload } from './AddEditStudentForm';
import { formatCurrency } from '@shared/formatters';
import { Drawer } from '@/components/Drawer';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { StudentCredentialsModal } from '@/components/StudentCredentialsModal';
import { getStudentLoginPassword } from '@/lib/studentLogin';

function avatarUrl(photoUrl?: string): string | undefined {
  if (!photoUrl) return undefined;
  if (photoUrl.startsWith('data:') || photoUrl.startsWith('http')) return photoUrl;
  return `${API_BASE}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
}

function marketplaceUrl(board?: string, classLevel?: string): string {
  const sp = new URLSearchParams();
  if (board?.trim()) sp.set('board', board.trim());
  if (classLevel?.trim()) sp.set('class', classLevel.trim());
  const q = sp.toString();
  return q ? `/parent/marketplace?${q}` : '/parent/marketplace';
}

function hubLinks(mongoId: string) {
  const q = `studentId=${encodeURIComponent(mongoId)}`;
  return [
    { label: 'Courses', to: `/parent/my-course?${q}`, icon: '📚' as const },
    { label: 'Marks & exams', to: `/parent/performances?${q}`, icon: '📊' as const },
    { label: 'Classes', to: `/parent/classes?${q}`, icon: '📅' as const },
    { label: 'Payments', to: `/parent/payments?${q}`, icon: '💰' as const },
  ];
}

interface Child {
  _id: string;
  name?: string;
  studentId?: string;
  dateOfBirth?: string;
  classLevel?: string;
  board?: string;
  schoolName?: string;
  photoUrl?: string;
  idProofUrl?: string;
  enrollments?: Array<{
    _id: string;
    subject?: string;
    teacher?: { name?: string };
    feePerMonth?: number;
    status?: string;
  }>;
}

interface Response {
  children: Child[];
}

function StudentLoginAccordion({
  loginId,
  password,
}: {
  loginId: string;
  password: string;
}) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<'id' | 'pw' | null>(null);

  const copy = async (kind: 'id' | 'pw', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const masked = '•'.repeat(Math.min(Math.max(password.length, 8), 24));

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-brand-100 bg-brand-50/50 text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-brand-100/40"
        aria-expanded={open}
      >
        <span className="min-w-0 text-sm font-semibold text-brand-900">
          Student login{' '}
          <span className="font-normal text-gray-500">(add details)</span>
        </span>
        <span
          className={`shrink-0 text-brand-600 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="border-t border-brand-100/80 px-4 py-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Login details</p>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600">Learner ID</span>
              <code className="rounded-md bg-white px-2 py-1 font-mono text-xs font-semibold text-brand-900">{loginId}</code>
              <button
                type="button"
                onClick={() => copy('id', loginId)}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                {copied === 'id' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600">Password</span>
              <code className="rounded-md bg-white px-2 py-1 font-mono text-xs font-semibold text-brand-900">
                {showPassword ? password : masked}
              </code>
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={() => copy('pw', password)}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                {copied === 'pw' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ParentStudents() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<AddStudentSuccessPayload | null>(null);
  const { t } = useLanguage();

  const fetchStudents = useCallback(() => {
    setLoading(true);
    setError(null);
    apiJson<Response>('/api/parent/students')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openAdd = () => setDrawerOpen(true);

  const closeDrawer = () => setDrawerOpen(false);

  const handleAddSuccess = (payload: AddStudentSuccessPayload) => {
    closeDrawer();
    fetchStudents();
    setCredentialsModal(payload);
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading…</p>
      </div>
    );
  }
  if (error && !data) {
    return <InlineErrorDisplay error={error} onRetry={fetchStudents} fullPage />;
  }

  const children = data?.children || [];

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="👦"
        title={t('myKids')}
        subtitle="Learner profiles are set when added and can’t be edited here. Use the links on each card to jump to courses, marks, classes, and payments."
        action={
          <button
            type="button"
            onClick={openAdd}
            className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/30 sm:px-5"
          >
            + {t('addStudent')}
          </button>
        }
      />

      <div className="mx-auto w-full space-y-6">
        {children.length > 0 && (
          <div className="space-y-4">
            {children.map((c, i) => {
              const av = avatarUrl(c.photoUrl);
              const sid = c.studentId || '';
              const pwd = sid ? getStudentLoginPassword(sid, c.dateOfBirth) : '';
              const mp = marketplaceUrl(c.board, c.classLevel);
              return (
                <div
                  key={c._id}
                  className="card-funky animate-slide-up relative overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100/90 p-5 shadow-lg ring-1 ring-brand-100/50 sm:p-6"
                  style={{ animationDelay: `${0.04 + i * 0.05}s` }}
                >
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-200/30 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-brand-200/20 blur-xl" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative shrink-0">
                      <div className="mx-auto h-28 w-28 overflow-hidden rounded-2xl border-2 border-brand-200 bg-brand-50 shadow-md ring-2 ring-white sm:mx-0 sm:h-32 sm:w-32">
                        {av ? (
                          <img src={av} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-violet-100 text-4xl sm:text-5xl">
                            👤
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 text-left sm:pt-0.5">
                      <div className="flex flex-row items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-brand-900 sm:text-xl">{c.name || sid || 'Student'}</h3>
                            {sid && (
                              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-800">{sid}</span>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-medium text-brand-700">
                            {c.board && c.classLevel && `${c.board} · Class ${c.classLevel}`}
                            {c.schoolName && (
                              <span className="mt-0.5 block text-gray-600">
                                <span className="mr-1" aria-hidden>
                                  🏫
                                </span>
                                {c.schoolName}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          <Link
                            to={mp}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-3 py-2 text-xs font-bold text-white shadow-md transition hover:opacity-95 sm:px-4 sm:py-2.5 sm:text-sm"
                          >
                            <span aria-hidden>🔍</span> Find teachers
                          </Link>
                        </div>
                      </div>

                      {sid && pwd && <StudentLoginAccordion loginId={sid} password={pwd} />}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {hubLinks(c._id).map((h) => (
                          <Link
                            key={h.to}
                            to={h.to}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
                          >
                            <span aria-hidden>{h.icon}</span>
                            {h.label}
                          </Link>
                        ))}
                      </div>

                      {c.enrollments && c.enrollments.length > 0 && (
                        <ul className="mt-4 space-y-2 border-t border-brand-100 pt-4 text-left text-sm text-gray-700">
                          <li className="text-xs font-bold uppercase tracking-wide text-gray-500">Enrollments on file</li>
                          {c.enrollments.map((e) => (
                            <li
                              key={e._id}
                              className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 sm:justify-start"
                            >
                              <span className="font-semibold text-brand-900">{e.subject}</span>
                              <span className="text-gray-400">·</span>
                              <span>{e.teacher?.name || 'Teacher'}</span>
                              <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-brand-700 shadow-sm">
                                {formatCurrency(e.feePerMonth ?? 0)}/mo
                              </span>
                              {e.status && <span className="text-xs uppercase text-gray-500">({e.status})</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                      {(!c.enrollments || c.enrollments.length === 0) && (
                        <p className="mt-4 border-t border-brand-100 pt-4 text-sm text-gray-500">
                          No enrollments yet — use <strong>Find teachers</strong> above to match this board &amp; class.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {children.length === 0 && !loading && (
          <ContentCard className="stagger-1" decorative={false}>
            <div className="flex flex-col items-center px-4 py-10 text-center sm:px-8 sm:py-12">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-violet-100 text-4xl shadow-md ring-2 ring-brand-100">
                👨‍👩‍👧
              </div>
              <h2 className="text-xl font-bold text-brand-900">No learners yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                Add each child with a photo and school or government ID — we use them for safe identity checks during live classes.
              </p>
              <button
                type="button"
                onClick={openAdd}
                className="btn-primary mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3 text-base font-bold shadow-lg"
              >
                <span aria-hidden>✨</span> {t('addStudent')}
              </button>
              <Link
                to="/parent/marketplace"
                className="mt-4 text-sm font-semibold text-brand-600 underline-offset-2 hover:underline"
              >
                Or go to marketplace first →
              </Link>
            </div>
          </ContentCard>
        )}

        {children.length > 0 && (
          <ContentCard className="border-dashed border-brand-200/80 bg-brand-50/20" decorative={false}>
            <div className="flex flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6">
              <p className="text-center text-sm text-gray-600 sm:text-left">
                Need another learner profile? Add a sibling or another child.
              </p>
              <button
                type="button"
                onClick={openAdd}
                className="btn-primary shrink-0 rounded-xl px-6 py-3 text-sm font-bold shadow-md"
              >
                + {t('addStudent')}
              </button>
            </div>
          </ContentCard>
        )}
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title="Add learner"
        subtitle="Photo & ID required for verification"
        headerIcon="👋"
        widthClassName="max-w-full sm:max-w-xl"
      >
        <AddEditStudentForm onSuccess={handleAddSuccess} onCancel={closeDrawer} />
      </Drawer>

      {credentialsModal && (
        <StudentCredentialsModal
          isOpen
          onClose={() => setCredentialsModal(null)}
          studentName={credentialsModal.name}
          loginId={credentialsModal.studentId}
          password={credentialsModal.password}
        />
      )}
    </div>
  );
}
