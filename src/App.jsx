import React, { useEffect, lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageSkeleton from './components/common/PageSkeleton';

// --- Lazy Loaded Pages ---
const Profile = lazy(() => import('./pages/Profile'));

// --- Auth Pages ---
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const OAuth2RedirectHandler = lazy(() => import('./pages/OAuth2RedirectHandler'));

// --- Student Pages ---
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const Courses = lazy(() => import('./pages/Courses'));
const Lessons = lazy(() => import('./pages/Lessons'));
const CourseDetail = lazy(() => import('./pages/courseDetail'));
const Assessment = lazy(() => import('./pages/Assessment'));
const Progress = lazy(() => import('./pages/Progress'));
const MyLearning = lazy(() => import('./pages/MyLearning'));
const Discussions = lazy(() => import('./pages/Discussions'));
const Enroll = lazy(() => import('./pages/Enroll'));

// --- Instructor Pages ---
const InstructorDashboard = lazy(() => import('./pages/instructor/InstructorDashboard'));
const CreateCourse = lazy(() => import('./pages/instructor/CreateCourse'));
const EditCourse = lazy(() => import('./pages/instructor/EditCourse'));
const CurriculumBuilder = lazy(() => import('./pages/instructor/CurriculumBuilder'));
const InstructorAnalytics = lazy(() => import('./pages/instructor/InstructorAnalytics'));
const InstructorDiscussions = lazy(() => import('./pages/instructor/InstructorDiscussions'));
const Transactions = lazy(() => import('./pages/Transactions'));

// --- Admin Pages ---
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const AdminCourseDetail = lazy(() => import('./pages/admin/CourseDetail'));
const AdminBugs = lazy(() => import('./pages/admin/Bugs'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));

// --- Static Components & Context ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageContainer from './components/PageContainer';
import ColorUpdater from './components/ColorUpdater';
import ProtectedRoute from './components/ProtectedRoute';
import { getAuthUser } from './utils/auth';
import { ThemeProvider } from './context/ThemeContext';
import { ColorProvider } from './context/ColorContext';

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Crash detected:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', maxWidth: '500px', margin: '4rem auto', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 950, fontSize: '1.5rem', color: '#ef4444' }}>Something went wrong</h3>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>We encountered an unexpected error while rendering this page. Our team has been notified. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()} className="glass-btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '1rem', fontSize: '1rem' }}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Landing = lazy(() => import('./pages/Landing'));
const BugReport = lazy(() => import('./pages/BugReport'));
import api from './services/api';

const BugReportWidget = lazy(() => import('./components/common/BugReportWidget'));
const MotivationPopup = lazy(() => import('./components/common/MotivationPopup'));
const NotificationToast = lazy(() => import('./components/NotificationToast'));
import AdminSkeleton from './components/common/AdminSkeleton';
import { NotificationProvider, useNotificationContext } from './context/NotificationContext';

// 1. Simple wrapper for page content
const PageWrapper = ({ children }) => (
  <PageContainer>
    {children}
  </PageContainer>
);

// 2. The Smart Traffic Cop
const RootRedirect = () => {
  const user = getAuthUser();
  
  if (!user) {
    return <PageWrapper><Landing /></PageWrapper>;
  }
  
  if (user.role?.toUpperCase() === 'INSTRUCTOR') {
    return <Navigate to="/instructor/dashboard" replace />;
  }
  
  if (user.role?.toUpperCase() === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // Default to student if logged in
  return <Navigate to="/student/dashboard" replace />;
};

// ─── Inner component that CONSUMES the notification context ─────────────────
function AppContent() {
  const location = useLocation();
  // Only mount non-critical widgets after browser is idle
  const [idleReady, setIdleReady] = useState(false);

  useEffect(() => {
    let handle;
    if (typeof requestIdleCallback !== 'undefined') {
      handle = requestIdleCallback(() => setIdleReady(true), { timeout: 4000 });
    } else {
      handle = setTimeout(() => setIdleReady(true), 2500);
    }
    return () => {
      if (typeof requestIdleCallback !== 'undefined') cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <ColorUpdater />

      <div className="app-wrapper">
        <div className="ambient-bg-system">
          <div className="ambient-blob ambient-blob-1" />
          <div className="ambient-blob ambient-blob-2" />
        </div>
        <Navbar />
        
        <main className="main-content">
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* === HOME ROUTE (Moved to Top) === */}
              <Route path="/" element={<RootRedirect />} />

              {/* === PUBLIC AUTH ROUTES === */}
              <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
              <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
              <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
              <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
              <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

              {/* === STRICTLY STUDENT ROUTES === */}
              <Route path="/student/dashboard" element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <PageWrapper><StudentDashboard /></PageWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
                  <PageWrapper><Profile /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/courses" element={<PageWrapper><Courses /></PageWrapper>} />
              <Route path="/search" element={<PageWrapper><Courses /></PageWrapper>} />
              
              <Route path="/course/:courseId" element={<PageWrapper><CourseDetail /></PageWrapper>} />
              <Route path="/enroll/:courseId" element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <PageWrapper><Enroll /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/course/:courseId/lesson/:lessonId/preview" element={<PageWrapper><Lessons /></PageWrapper>} />
              <Route path="/report-bug" element={<PageWrapper><BugReport /></PageWrapper>} />

              <Route path="/student/course/:courseId/lessons" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
                  <PageWrapper><Lessons /></PageWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/student/assessment" element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <PageWrapper><Assessment /></PageWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/student/learning" element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <PageWrapper><MyLearning /></PageWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/student/progress" element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <PageWrapper><Progress /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/student/transactions" element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <PageWrapper><Transactions /></PageWrapper>
                </ProtectedRoute>
              } />

              {/* === DISCUSSIONS - Shared between Students and Staff === */}
              <Route path="/discussions" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
                  <PageWrapper><Discussions /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/instructor/dashboard" element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <PageWrapper><InstructorDashboard /></PageWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/instructor/analytics" element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <PageWrapper><InstructorAnalytics /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/instructor/discussions" element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <PageWrapper><InstructorDiscussions /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/instructor/transactions" element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <PageWrapper><Transactions /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/instructor/create-course" element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <PageWrapper><CreateCourse /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/instructor/course/:courseId/edit" element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <PageWrapper><EditCourse /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/instructor/course/:courseId/curriculum" element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <PageWrapper><CurriculumBuilder /></PageWrapper>
                </ProtectedRoute>
              } />

              {/* === STRICTLY ADMIN ROUTES === */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Suspense fallback={<AdminSkeleton />}>
                    <PageWrapper><AdminDashboard /></PageWrapper>
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Suspense fallback={<AdminSkeleton />}>
                    <PageWrapper><AdminUsers /></PageWrapper>
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/admin/profile/:userId" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PageWrapper><Profile /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/admin/courses" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Suspense fallback={<AdminSkeleton />}>
                    <PageWrapper><AdminCourses /></PageWrapper>
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/admin/bugs" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Suspense fallback={<AdminSkeleton />}>
                    <PageWrapper><AdminBugs /></PageWrapper>
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/admin/course/:courseId" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Suspense fallback={<AdminSkeleton />}>
                    <PageWrapper><AdminCourseDetail /></PageWrapper>
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/admin/analytics" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Suspense fallback={<AdminSkeleton />}>
                    <PageWrapper><AdminAnalytics /></PageWrapper>
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Fallback for 404s */}
              <Route path="*" element={<Navigate to="/" replace />} />
              
            </Routes>
          </Suspense>
        </ErrorBoundary>
          <Footer />
        </main>
      </div>
      
      {/* ─── Global Non-Critical Widgets — deferred until browser is idle ─── */}
      <div id="global-widget-portal" style={{ position: 'fixed', zIndex: 10000, pointerEvents: 'none' }}>
        {idleReady && (
          <ErrorBoundary>
            <Suspense fallback={null}>
              <BugReportWidget />
              <MotivationPopup />
            </Suspense>
          </ErrorBoundary>
        )}
        {/* Action feedback system (Profile updated, Saved, etc.) */}
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        {/* WebSocket/System notification toasts — survive page transitions */}
        <NotificationToast />
      </div>
    </>
  );
}

// ─── Root App — sets up providers ────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <ColorProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ColorProvider>
    </ThemeProvider>
  );
}