import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLoading } from './AuthLoading';

export const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Citizens attempting admin routes are redirected to citizen dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
