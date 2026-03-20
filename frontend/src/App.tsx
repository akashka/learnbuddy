import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AppShell from '@/components/AppShell';
import { CmsPageView } from '@/components/CmsPageView';
import ErrorBoundary from '@/components/ErrorBoundary';
import { RouteMeta } from '@/components/RouteMeta';
import ProtectedRoute from '@/components/ProtectedRoute';
import NotFoundPage from '@/pages/errors/NotFoundPage';
import { RootRedirect } from '@/components/RootRedirect';
import Register from '@/pages/Register';
import ParentRegisterStart from '@/pages/parent/ParentRegisterStart';
import ParentRegisterForm from '@/pages/parent/ParentRegisterForm';
import ParentDashboard from '@/pages/parent/ParentDashboard';
import ParentMarketplace from '@/pages/parent/ParentMarketplace';
import ParentStudents from '@/pages/parent/ParentStudents';
import ParentClasses from '@/pages/parent/ParentClasses';
import ParentProfile from '@/pages/parent/ParentProfile';
import ParentPerformances from '@/pages/parent/ParentPerformances';
import ParentCheckout from '@/pages/parent/ParentCheckout';
import ParentPayment from '@/pages/parent/ParentPayment';
import ParentPayments from '@/pages/parent/ParentPayments';
import ParentExamDetail from '@/pages/parent/ParentExamDetail';
import Privacy from '@/pages/Privacy';
import Settings from '@/pages/Settings';
import TeacherRegister from '@/pages/teacher/TeacherRegister';
import TeacherRegisterStep from '@/pages/teacher/TeacherRegisterStep';
import TeacherDashboard from '@/pages/teacher/TeacherDashboard';
import TeacherBatches from '@/pages/teacher/TeacherBatches';
import TeacherClasses from '@/pages/teacher/TeacherClasses';
import TeacherProfile from '@/pages/teacher/TeacherProfile';
import TeacherExams from '@/pages/teacher/TeacherExams';
import TeacherExamDetail from '@/pages/teacher/TeacherExamDetail';
import TeacherStudents from '@/pages/teacher/TeacherStudents';
import TeacherAgreements from '@/pages/teacher/TeacherAgreements';
import TeacherPayments from '@/pages/teacher/TeacherPayments';
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentCourses from '@/pages/student/StudentCourses';
import StudentClasses from '@/pages/student/StudentClasses';
import StudentExams from '@/pages/student/StudentExams';
import StudentExamDetail from '@/pages/student/StudentExamDetail';
import TakeExam from '@/pages/student/TakeExam';
import StudyMaterials from '@/pages/StudyMaterials';
import ReviewRequests from '@/pages/ReviewRequests';
import Notifications from '@/pages/Notifications';
import AboutUs from '@/pages/static/AboutUs';
import ContactUs from '@/pages/static/ContactUs';
import Faq from '@/pages/static/Faq';
import ForYou from '@/pages/static/ForYou';
import Features from '@/pages/static/Features';
import HowItWorks from '@/pages/static/HowItWorks';
import PrivacyPolicy from '@/pages/static/PrivacyPolicy';
import TermsConditions from '@/pages/static/TermsConditions';
import RefundPolicy from '@/pages/static/RefundPolicy';
import CourseOwnershipRules from '@/pages/static/CourseOwnershipRules';
import SafetyAndTrust from '@/pages/static/SafetyAndTrust';
import VerifyEmail from '@/pages/VerifyEmail';
import Disputes from '@/pages/Disputes';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
          <RouteMeta />
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<RootRedirect />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/for-you" element={<ForYou />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/for-parents" element={<CmsPageView slug="for-parents" links={[{ to: '/for-students', label: 'For Students' }, { to: '/for-teachers', label: 'For Teachers' }, { to: '/for-you', label: 'For You' }]} />} />
              <Route path="/for-students" element={<CmsPageView slug="for-students" links={[{ to: '/for-parents', label: 'For Parents' }, { to: '/for-teachers', label: 'For Teachers' }, { to: '/for-you', label: 'For You' }]} />} />
              <Route path="/for-teachers" element={<CmsPageView slug="for-teachers" links={[{ to: '/for-parents', label: 'For Parents' }, { to: '/for-students', label: 'For Students' }, { to: '/for-you', label: 'For You' }]} />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/course-ownership-rules" element={<CourseOwnershipRules />} />
              <Route path="/safety-and-trust" element={<SafetyAndTrust />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              {/* Parent - public registration start */}
              <Route path="/parent/register" element={<ParentRegisterStart />} />
              <Route path="/parent/register/form" element={<ParentRegisterForm />} />

              {/* Parent - protected */}
              <Route
                path="/parent/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/marketplace"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentMarketplace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/students"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentStudents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/classes"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentClasses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/profile"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/checkout"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentCheckout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/payment"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentPayment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/payments"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/performances"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentPerformances />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/exam/:id"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentExamDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/privacy"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <Privacy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/settings"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/disputes"
                element={
                  <ProtectedRoute allowedRoles={['parent', 'teacher']}>
                    <Disputes />
                  </ProtectedRoute>
                }
              />

              {/* Teacher */}
              <Route path="/teacher/register" element={<TeacherRegister />} />
              <Route path="/teacher/register/step/:step" element={<TeacherRegisterStep />} />
              <Route
                path="/teacher/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/batches"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherBatches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/classes"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherClasses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/payments"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/profile"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/privacy"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <Privacy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/settings"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/students"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherStudents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/exam/:id"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherExamDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/agreements"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherAgreements />
                  </ProtectedRoute>
                }
              />

              {/* Student */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/courses"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/classes"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentClasses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/exams"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentExams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/exams/:id"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentExamDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/exam/take"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <TakeExam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/study"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudyMaterials />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/study"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <StudyMaterials />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute allowedRoles={['parent', 'teacher', 'student']}>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/review-requests"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ReviewRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/review-requests"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <ReviewRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/review-requests"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ReviewRequests />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
