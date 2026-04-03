import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useFormStore } from './store/formStore';
import { ModalProvider } from './contexts/ModalContext';
import Home from './pages/Home';
import Verify from './pages/Verify';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Workshop from './components/builder/Workshop';
import Stage from './components/stage/Stage';
import Vault from './components/vault/Vault';

function AdminRoute({ children }) {
  const admin = useAuthStore((s) => s.admin);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <span className="text-[var(--color-text-tertiary)] text-[14px]">Loading…</span>
      </div>
    );
  }
  return admin ? children : <Navigate to="/" replace />;
}

function App() {
  const loadMe = useAuthStore((s) => s.loadMe);
  const admin = useAuthStore((s) => s.admin);
  const initForms = useFormStore((s) => s.initForms);
  const [appReady, setAppReady] = useState(false);

  // Restore session on first load
  useEffect(() => {
    loadMe().finally(() => setAppReady(true));
  }, []);

  // Load forms whenever the admin session is active
  useEffect(() => {
    if (admin) initForms();
  }, [admin]);

  if (!appReady) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <span className="text-[var(--color-text-tertiary)] text-[14px]">Loading…</span>
      </div>
    );
  }

  return (
    <ModalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/verify" element={<Verify />} />

          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/profile" element={<AdminRoute><Profile /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
          <Route path="/builder/:id" element={<AdminRoute><Workshop /></AdminRoute>} />
          <Route path="/vault/:id" element={<AdminRoute><Vault /></AdminRoute>} />

          {/* Public form view */}
          <Route path="/f/:id" element={<Stage />} />
        </Routes>
      </Router>
    </ModalProvider>
  );
}

export default App;
