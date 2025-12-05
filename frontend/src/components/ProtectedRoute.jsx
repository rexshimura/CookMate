import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user } = useAuth();
  const location = useLocation();

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    // Redirect to signin page with return url
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If user is authenticated and we're on an auth page (signin/signup), redirect them away
  if (!requireAuth && user && (location.pathname === '/signin' || location.pathname === '/signup')) {
    // Redirect to home or the page they came from
    const from = location.state?.from?.pathname || '/home';
    return <Navigate to={from} replace />;
  }

  // Render children if authentication requirements are met
  return children;
};

export default ProtectedRoute;