import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // ✅ MUDOU: novo path

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); // ✅ MUDOU: isAuthenticated

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) { // ✅ MUDOU: de !user para !isAuthenticated
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;