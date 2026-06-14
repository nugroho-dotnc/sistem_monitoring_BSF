import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const RouteGuard: React.FC = () => {
  const token = useAuthStore(state => state.token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
