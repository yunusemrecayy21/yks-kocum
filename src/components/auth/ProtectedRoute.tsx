import React from 'react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export const OnboardingRoute: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (hasCompletedOnboarding && !isEditMode) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const PublicAuthRoute: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={hasCompletedOnboarding ? '/' : '/onboarding'} replace />;
  }

  return <Outlet />;
};
