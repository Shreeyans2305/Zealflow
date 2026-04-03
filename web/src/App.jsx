import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Workshop from './components/builder/Workshop';
import Stage from './components/stage/Stage';

function AdminRoute({ children }) {
  const userRole = useAuthStore(state => state.userRole);
  return userRole === 'admin' ? children : <Navigate to="/" replace />;
}

function UserRoute({ children }) {
  const userRole = useAuthStore(state => state.userRole);
  // Allow if role is either user or admin (since admin can also fill forms)
  return userRole ? children : <Navigate to="/" replace />;
}

function App() {
  return (
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
          element={
            <UserRoute>
              <Stage />
            </UserRoute>
          } 
        />
        {/* Legacy redirect for vault to admin */}
        <Route path="/vault/:id" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
