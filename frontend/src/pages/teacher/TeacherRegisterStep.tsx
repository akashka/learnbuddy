import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPageLayout } from '@/components/AuthPageLayout';
import { Modal } from '@/components/Modal';
import TeacherStep1 from '@/components/teacher-registration/Step1';
import TeacherStep2 from '@/components/teacher-registration/Step2';
import TeacherStep3 from '@/components/teacher-registration/Step3';
import TeacherStep4 from '@/components/teacher-registration/Step4';
import TeacherStep5 from '@/components/teacher-registration/Step5';

const STEPS = [
  { num: 1, title: 'Basic Details', icon: '👤' },
  { num: 2, title: 'Teaching Details', icon: '📚' },
  { num: 3, title: 'Qualification Exam', icon: '📝' },
  { num: 4, title: 'Documents & Banking', icon: '📄' },
  { num: 5, title: 'Create Batches', icon: '📅' },
];

export default function TeacherRegisterStep() {
  const { step } = useParams<{ step: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const stepNum = parseInt(step || '1') || 1;
  const phone = searchParams.get('phone') || '';

  const [registrationData, setRegistrationData] = useState<{
    step1?: Record<string, unknown>;
    step2?: Record<string, unknown>;
    step4?: Record<string, unknown>;
    step5?: Record<string, unknown>;
  } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [accessVerified, setAccessVerified] = useState<boolean | null>(null);
  const [examActive, setExamActive] = useState(false);
  const leaveExamRef = useRef<{ confirmLeave: (navigateAfter?: boolean) => Promise<void> } | null>(null);
  const [showLeaveExamConfirm, setShowLeaveExamConfirm] = useState(false);
  const pendingNavigateTo = useRef<number | null>(null);

  const fetchRegistration = useCallback(async () => {
    if (!phone) return;
    setDataError(null);
    setDataLoading(true);
    try {
      const data = await apiJson<{ data?: Record<string, unknown>; fullyRegistered?: boolean; error?: string }>(
        `/api/teacher-registration/data?phone=${encodeURIComponent(phone)}`
      );
      if (data.fullyRegistered) {
        navigate('/?from=teacher-register');
        return;
      }
      if (data.data) {
        setRegistrationData({
          step1: (data.data.step1 ?? undefined) as Record<string, unknown> | undefined,
          step2: (data.data.step2 ?? undefined) as Record<string, unknown> | undefined,
          step4: (data.data.step4 ?? undefined) as Record<string, unknown> | undefined,
          step5: (data.data.step5 ?? undefined) as Record<string, unknown> | undefined,
        });
      } else {
        setRegistrationData({} as Record<string, unknown>);
      }
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load data');
      setRegistrationData({});
    } finally {
      setDataLoading(false);
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (!phone || phone.length < 10) {
      navigate('/teacher/register');
      return;
    }
    let cancelled = false;
    const checkAccess = async () => {
      try {
        const data = await apiJson<{ verified?: boolean; allowedStep?: number }>(
          `/api/teacher-registration/verify-access?phone=${encodeURIComponent(phone)}`
        );
        if (cancelled) return;
        if (!data.verified) {
          navigate('/teacher/register');
          return;
        }
        setAccessVerified(true);
        const allowedStep = data.allowedStep ?? 1;
        if (stepNum > allowedStep) {
          navigate(`/teacher/register/step/${allowedStep}?phone=${encodeURIComponent(phone)}`);
        }
      } catch {
        if (!cancelled) navigate('/teacher/register');
      }
    };
    checkAccess();
    return () => { cancelled = true; };
  }, [phone, stepNum, navigate]);

  useEffect(() => {
    if (phone && accessVerified) {
      fetchRegistration();
    } else if (!phone) {
      setDataLoading(false);
    }
  }, [phone, stepNum, accessVerified, fetchRegistration]);

  const saveProgress = useCallback(
    async (step: number, stepData: Record<string, unknown>) => {
      if (!phone) return;
      await apiJson('/api/teacher-registration/save', {
        method: 'POST',
        body: JSON.stringify({ phone, step, data: stepData }),
      });
      await fetchRegistration();
    },
    [phone, fetchRegistration]
  );

  const handleNext = async (nextStep: number, stepData?: Record<string, unknown>) => {
    if (stepData && !stepData.skippedStep5) {
      await saveProgress(stepNum, stepData);
    }
    if (nextStep <= 5) {
      navigate(`/teacher/register/step/${nextStep}?phone=${encodeURIComponent(phone)}`);
    } else if (stepData?.registrationComplete && stepData.token && stepData.user) {
      // Auto-login and redirect to dashboard - no need to show login page
      loginWithToken(stepData.token as string, stepData.user as { id: string; email: string; role: string });
      navigate('/teacher/dashboard', { replace: true });
    } else if (stepData?.skippedStep5) {
      navigate('/teacher/register?skipped=1');
    } else {
      navigate('/');
    }
  };

  const handleBack = () => {
    if (stepNum > 1) {
      if (stepNum === 3 && examActive) {
        setShowLeaveExamConfirm(true);
        pendingNavigateTo.current = stepNum - 1;
      } else {
        navigate(`/teacher/register/step/${stepNum - 1}?phone=${encodeURIComponent(phone)}`);
      }
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep >= 1 && targetStep < stepNum) {
      if (stepNum === 3 && examActive) {
        setShowLeaveExamConfirm(true);
        pendingNavigateTo.current = targetStep;
      } else {
        navigate(`/teacher/register/step/${targetStep}?phone=${encodeURIComponent(phone)}`);
      }
    }
  };

  const handleConfirmLeaveExam = async () => {
    await leaveExamRef.current?.confirmLeave(false);
    setShowLeaveExamConfirm(false);
    const target = pendingNavigateTo.current;
    pendingNavigateTo.current = null;
    if (target != null) {
      navigate(`/teacher/register/step/${target}?phone=${encodeURIComponent(phone)}`);
    }
  };

  if (!phone) return null;

  if (accessVerified === false || (accessVerified === null && phone)) {
    return (
      <AuthPageLayout title="Become a Teacher" subtitle="Verifying access..." wide card={false}>
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border-2 border-brand-200 bg-white p-8">
          <p className="text-brand-600">Verifying access...</p>
        </div>
      </AuthPageLayout>
    );
  }

  if (dataLoading) {
    return (
      <AuthPageLayout title="Become a Teacher" subtitle="Loading your registration data..." wide card={false}>
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border-2 border-brand-200 bg-white p-8">
          <p className="text-brand-600">Loading your registration data...</p>
        </div>
      </AuthPageLayout>
    );
  }

  if (dataError) {
    return (
      <AuthPageLayout title="Become a Teacher" subtitle="Error" wide card={false}>
        <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-8">
          <p className="text-red-600">{dataError}</p>
          <button type="button" onClick={() => fetchRegistration()} className="btn-primary mt-4">
            <span className="btn-text">Retry</span>
          </button>
        </div>
      </AuthPageLayout>
    );
  }

  const data = registrationData || {};

  return (
    <AuthPageLayout title="Become a Teacher" subtitle={`Step ${stepNum} of 5`} wide card={false}>
      <Modal
        isOpen={showLeaveExamConfirm}
        onClose={() => { setShowLeaveExamConfirm(false); pendingNavigateTo.current = null; }}
        maxWidth="max-w-lg"
      >
        <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-amber-800">Leave Exam?</h3>
            <p className="mb-6 text-amber-700">
              Leaving the exam now will count as one failed attempt. You can retry after 24 hours. Are you sure you want to leave?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => { setShowLeaveExamConfirm(false); pendingNavigateTo.current = null; }}
                className="btn-secondary"
              >
                <span className="btn-text">Stay</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmLeaveExam}
                className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
              >
                Yes, Leave
              </button>
            </div>
        </div>
      </Modal>
      <div className="rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-2xl">
        <div className="mb-8">
          <div className="mb-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500 ease-out"
                style={{ width: `${(stepNum / 5) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between">
            {STEPS.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => handleStepClick(s.num)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  s.num === stepNum ? 'scale-110' : s.num < stepNum ? 'opacity-80' : 'opacity-50'
                } ${s.num < stepNum ? 'cursor-pointer hover:opacity-100' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    s.num === stepNum
                      ? 'bg-brand-500 text-white shadow-lg ring-4 ring-brand-200'
                      : s.num < stepNum
                        ? 'bg-brand-200 text-brand-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {s.num < stepNum ? '✓' : s.num}
                </span>
                <span className="hidden text-xs font-medium text-brand-700 md:block">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {stepNum === 1 && (
          <TeacherStep1
            phone={phone}
            onNext={handleNext}
            initialData={(data.step1 as Record<string, unknown>) || {}}
            onSave={saveProgress}
          />
        )}
        {stepNum === 2 && (
          <TeacherStep2
            phone={phone}
            onNext={handleNext}
            onBack={handleBack}
            initialData={(data.step2 as Record<string, unknown>) || {}}
            onSave={saveProgress}
          />
        )}
        {stepNum === 3 && (
          <TeacherStep3
            phone={phone}
            onNext={handleNext}
            onBack={handleBack}
            onSave={saveProgress}
            onExamActiveChange={setExamActive}
            leaveExamRef={leaveExamRef}
          />
        )}
        {stepNum === 4 && (
          <TeacherStep4
            phone={phone}
            onNext={handleNext}
            onBack={handleBack}
            initialData={(data.step4 as Record<string, unknown>) || {}}
            onSave={saveProgress}
          />
        )}
        {stepNum === 5 && (
          <TeacherStep5
            phone={phone}
            onNext={handleNext}
            onBack={handleBack}
            initialData={{ step2: data.step2, step5: data.step5 } as Record<string, unknown>}
            onSave={saveProgress}
          />
        )}
      </div>
    </AuthPageLayout>
  );
}
