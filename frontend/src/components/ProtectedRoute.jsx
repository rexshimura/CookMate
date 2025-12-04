import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    // Redirect to signin page with return url
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If user is authenticated but we want to redirect authenticated users away (like from signin page)
  // Only redirect if specifically requested via a special state flag
  if (!requireAuth && user && location.state?.redirectAuthenticated) {
    // Redirect to home or the page they came from
    const from = location.state?.from?.pathname || '/home';
    return <Navigate to={from} replace />;
  }

  // Render children if authentication requirements are met
  return children;
};

export default ProtectedRoute;