import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { StaffProfileProvider } from '@/contexts/StaffProfileContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/Toast';
import AdminLogin from '@/pages/AdminLogin';
import Dashboard from '@/pages/Dashboard';
import AdminLayout from '@/components/AdminLayout';
import Profile from '@/pages/Profile';
import Masters from '@/pages/Masters';
import AiData from '@/pages/AiData';
import AiDataDetail from '@/pages/AiDataDetail';
import Drafts from '@/pages/Drafts';
import Teachers from '@/pages/Teachers';
import TeacherDetail from '@/pages/TeacherDetail';
import Parents from '@/pages/Parents';
import ParentDetail from '@/pages/ParentDetail';
import Students from '@/pages/Students';
import StudentDetail from '@/pages/StudentDetail';
import Enrollments from '@/pages/Enrollments';
import EnrollmentDetail from '@/pages/EnrollmentDetail';
import DiscountCodes from '@/pages/DiscountCodes';
import Classes from '@/pages/Classes';
import ClassSessionDetail from '@/pages/ClassSessionDetail';
import CmsPages from '@/pages/CmsPages';
import CmsPageEditor from '@/pages/CmsPageEditor';
import WebsiteSettings from '@/pages/WebsiteSettings';
import JobPositions from '@/pages/JobPositions';
import JobPositionEditor from '@/pages/JobPositionEditor';
import SecurityIncidents from '@/pages/SecurityIncidents';
import AuditLogs from '@/pages/AuditLogs';
import AuditLogDetail from '@/pages/AuditLogDetail';
import ContactSubmissions from '@/pages/ContactSubmissions';
import AIReviewRequests from '@/pages/AIReviewRequests';
import AIUsageLogs from '@/pages/AIUsageLogs';
import AIUsageLogDetail from '@/pages/AIUsageLogDetail';
import Users from '@/pages/Users';
import TeacherPayments from '@/pages/TeacherPayments';
import Documents from '@/pages/Documents';
import Reports from '@/pages/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-accent-50">
        <p className="text-accent-600">Loading...</p>
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route
        element={
          <ProtectedRoute>
            <StaffProfileProvider>
              <AdminLayout />
            </StaffProfileProvider>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<Users />} />
        <Route path="masters" element={<Masters />} />
        <Route path="ai-data" element={<AiData />} />
        <Route path="ai-data/:id" element={<AiDataDetail />} />
        <Route path="drafts" element={<Drafts />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="teachers/:id" element={<TeacherDetail />} />
        <Route path="parents" element={<Parents />} />
        <Route path="parents/:id" element={<ParentDetail />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="enrollments" element={<Enrollments />} />
        <Route path="enrollments/:type/:id" element={<EnrollmentDetail />} />
        <Route path="discount-codes" element={<DiscountCodes />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:id" element={<ClassSessionDetail />} />
        <Route path="teacher-payments" element={<TeacherPayments />} />
        <Route path="cms-pages" element={<CmsPages />} />
        <Route path="cms-pages/:slug" element={<CmsPageEditor />} />
        <Route path="website-settings" element={<WebsiteSettings />} />
        <Route path="contact-submissions" element={<ContactSubmissions />} />
        <Route path="job-positions" element={<JobPositions />} />
        <Route path="job-positions/:id" element={<JobPositionEditor />} />
        <Route path="security-incidents" element={<SecurityIncidents />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="audit-logs/:id" element={<AuditLogDetail />} />
        <Route path="ai-usage-logs" element={<AIUsageLogs />} />
        <Route path="ai-usage-logs/:id" element={<AIUsageLogDetail />} />
        <Route path="ai-review-requests" element={<AIReviewRequests />} />
        <Route path="documents" element={<Documents />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ErrorBoundary>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
