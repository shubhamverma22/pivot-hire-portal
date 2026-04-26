import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import { PageLoader } from './components/UI';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FounderDashboard from './pages/FounderDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import BrowseJobsPage from './pages/BrowseJobsPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import FounderProfilePage from './pages/FounderProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';
import PostJobPage from './pages/PostJobPage';
import MyJobsPage from './pages/MyJobsPage';
import ManageCandidatesPage from './pages/ManageCandidatesPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// ── Route Guards ──────────────────────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function FounderRoute({ children }) {
  const { user, loading, isFounder } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isFounder) return <Navigate to="/dashboard" replace />;
  return children;
}

function CompanyRoute({ children }) {
  const { user, loading, isCompany } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isCompany) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Dashboard Router ──────────────────────────────────────────────────────────

function DashboardRouter() {
  const { isCompany } = useAuth();
  return isCompany ? <CompanyDashboard /> : <FounderDashboard />;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Guest Routes */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

          {/* Dashboard Routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Founder Routes */}
            <Route path="/jobs" element={<FounderRoute><BrowseJobsPage /></FounderRoute>} />
            <Route path="/applications" element={<FounderRoute><MyApplicationsPage /></FounderRoute>} />
            <Route path="/profile" element={<FounderRoute><FounderProfilePage /></FounderRoute>} />
            <Route path="/subscription" element={<FounderRoute><SubscriptionPage /></FounderRoute>} />

            {/* Company Routes */}
            <Route path="/post-job" element={<CompanyRoute><PostJobPage /></CompanyRoute>} />
            <Route path="/my-jobs" element={<CompanyRoute><MyJobsPage /></CompanyRoute>} />
            <Route path="/candidates" element={<CompanyRoute><ManageCandidatesPage /></CompanyRoute>} />
            <Route path="/company-profile" element={<CompanyRoute><CompanyProfilePage /></CompanyRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
