import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, mentorOrAdminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-1 h-1 bg-black animate-pulse"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <h1 className="text-lg font-medium text-black tracking-tight mb-4">
            Access Denied
          </h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            Admin access required
          </p>
        </div>
      </div>
    );
  }

  if (mentorOrAdminOnly && user?.role !== 'admin' && user?.role !== 'mentor') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <h1 className="text-lg font-medium text-black tracking-tight mb-4">
            Access Denied
          </h1>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            Mentor or admin access required
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
