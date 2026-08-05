import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import NewAudit from './pages/NewAudit';
import AuditHistory from './pages/AuditHistory';
import Monitoring from './pages/Monitoring';
import ComplianceReports from './pages/ComplianceReports';
import Settings from './pages/Settings';
import Remediation from './pages/Remediation';

// Protected Route Component - checks authentication state
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

// Root Route Component
function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-audit"
        element={
          <ProtectedRoute>
            <NewAudit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-history"
        element={
          <ProtectedRoute>
            <AuditHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring"
        element={
          <ProtectedRoute>
            <Monitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance-reports"
        element={
          <ProtectedRoute>
            <ComplianceReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/remediation"
        element={
          <ProtectedRoute>
            <Remediation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;