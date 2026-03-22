import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffProfile } from '@/contexts/StaffProfileContext';
import Breadcrumbs from './Breadcrumbs';
import GlobalSearch from './GlobalSearch';
import ActionItemsDropdown from './ActionItemsDropdown';
import ProfileDropdown from './ProfileDropdown';
import BrandLogo from './BrandLogo';

const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed';

const ALL_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/masters', label: 'Masters', icon: '📋' },
  { to: '/cms-pages', label: 'CMS Pages', icon: '📄' },
  { to: '/website-settings', label: 'Website Settings', icon: '🌐' },
  { to: '/ai-data', label: 'AI Data', icon: '🤖' },
  { to: '/drafts', label: 'Drafts', icon: '📝' },
  { to: '/teachers', label: 'Teachers', icon: '👩‍🏫' },
  { to: '/parents', label: 'Parents', icon: '👨‍👩‍👧' },
  { to: '/students', label: 'Students', icon: '👦' },
  { to: '/enrollments', label: 'Enrollments', icon: '📚' },
  { to: '/discount-codes', label: 'Discount Codes', icon: '🏷️' },
  { to: '/classes', label: 'Classes', icon: '📅' },
  { to: '/teacher-payments', label: 'Teacher Payments', icon: '💰' },
  { to: '/ai-usage-logs', label: 'AI Usage Logs', icon: '📋' },
  { to: '/ai-review-requests', label: 'AI Review Requests', icon: '🔍' },
  { to: '/security-incidents', label: 'Security Incidents', icon: '🔒' },
  { to: '/audit-logs', label: 'Audit Log', icon: '📜' },
  { to: '/wishlist-activity', label: 'Wishlist Updates', icon: '📌' },
  { to: '/teacher-changes', label: 'Teacher Changes', icon: '🔄' },
  { to: '/job-positions', label: 'Job Positions', icon: '💼' },
  { to: '/documents', label: 'Documents', icon: '📁' },
  { to: '/contact-submissions', label: 'Contact Submissions', icon: '📬' },
  { to: '/notification-templates', label: 'Notification Templates', icon: '📢' },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const { canAccess } = useStaffProfile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  const toggleCollapsed = () => setSidebarCollapsed((c) => !c);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const navItems = ALL_NAV_ITEMS.filter((item) => canAccess(item.to));
  const currentPath = '/' + location.pathname.replace(/^\/+/, '').split('/')[0];
  if (currentPath && !canAccess(currentPath)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-accent-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - fixed on desktop, drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-accent-200 bg-white transition-[width] duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'}`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div
            className={`flex items-center border-b border-accent-200 py-4 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}
          >
            <BrandLogo
              to="/dashboard"
              variant="admin"
              showTagline
              collapsed={sidebarCollapsed}
              size="sm"
              className={`flex-1 ${sidebarCollapsed ? 'justify-center' : ''}`}
              onClick={() => setSidebarOpen(false)}
            />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-accent-600 hover:bg-accent-100 lg:hidden"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-1.5">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.to ||
                (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`mb-0.5 flex items-center rounded-lg text-sm transition last:mb-0 ${
                    sidebarCollapsed
                      ? 'justify-center px-0 py-2'
                      : 'gap-2 px-2.5 py-2'
                  } ${
                    isActive
                      ? 'bg-accent-100 font-medium text-accent-800'
                      : 'text-accent-700 hover:bg-accent-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!sidebarCollapsed && item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-accent-200 p-1.5">
            <button
              type="button"
              onClick={toggleCollapsed}
              title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
              className={`hidden w-full items-center rounded-lg px-2.5 py-2 text-sm text-accent-600 hover:bg-accent-100 lg:flex ${
                sidebarCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <svg
                className={`h-5 w-5 shrink-0 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content - offset by sidebar width on desktop */}
      <main
        className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${
          sidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64'
        }`}
      >
        {/* Top header: search left, notifications + profile right */}
        <header className="sticky top-0 z-30 flex flex-col border-b border-accent-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-accent-600 hover:bg-accent-100 lg:hidden"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <GlobalSearch />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <ActionItemsDropdown />
              <ProfileDropdown />
            </div>
          </div>
          {/* Breadcrumb row - middle layer between header and content (hidden on dashboard) */}
          {!location.pathname.match(/^\/dashboard\/?$/) && (
            <div className="border-t border-accent-200 bg-accent-100 px-4 py-2 sm:px-6">
              <Breadcrumbs />
            </div>
          )}
        </header>
        <div className="flex-1 overflow-auto bg-accent-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
