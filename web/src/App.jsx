import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ModalProvider } from './contexts/ModalContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Workshop from './components/builder/Workshop';
import Stage from './components/stage/Stage';

function AdminRoute({ children }) {
  const userRole = useAuthStore(state => state.userRole);
  return userRole === 'admin' ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <ModalProvider>
      <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } 
        />
        <Route path="/profile" element={<AdminRoute><Profile /></AdminRoute>} />
        <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route 
          path="/builder/:id" 
          element={
            <AdminRoute>
              <Workshop />
            </AdminRoute>
          } 
        />
        <Route 
          path="/f/:id" 
          element={<Stage />} 
        />
        {/* Legacy redirect for vault to admin */}
        <Route path="/vault/:id" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
    </ModalProvider>
  );
}

export default App;
