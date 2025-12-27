import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './domains/auth/contexts/AuthContext';
import { ToastProvider } from './shared/contexts/ToastContext';
import { ToastContainer } from './shared/components/Toast';
import { ProtectedRoute } from './domains/auth/components/ProtectedRoute';
import { AdminLayout } from './shared/layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Invitations from './pages/Invitations';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="invitations" element={<Invitations />} />
            <Route path="settings" element={<Settings />} />
            {/* Add more admin routes here */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
