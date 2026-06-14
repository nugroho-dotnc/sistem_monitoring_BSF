import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { Dashboard } from './features/dashboard/Dashboard';
import { Settings } from './pages/Settings';
import { FeedingPage } from './features/feeding/FeedingPage';
import { WeightPage } from './features/weight/WeightPage';
import { RouteGuard } from './components/RouteGuard';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const token = useAuthStore(state => state.token);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />
        
        {/* Protected Routes */}
        <Route element={<RouteGuard />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/feeding" element={<FeedingPage />} />
          <Route path="/weight" element={<WeightPage />} />
          <Route path="/settings" element={<Settings />} />
          {/* Default redirect to dashboard if logged in */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
