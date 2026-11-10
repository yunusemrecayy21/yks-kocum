import React from 'react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { Loader2, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col items-center justify-center p-6">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-purple to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-purple/25 mb-4">
      <GraduationCap className="w-6 h-6 text-white" />
    </div>
    <div className="flex items-center gap-2.5 text-sm font-medium text-slate-300">
      <Loader2 className="w-4 h-4 text-brand-purpleLight animate-spin" />
      <span>Oturum kontrol ediliyor...</span>
    </div>
  </div>
);

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isAuthLoading, hasCompletedOnboarding } = useAuth();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export const OnboardingRoute: React.FC = () => {
  const { isAuthenticated, isAuthLoading, hasCompletedOnboarding } = useAuth();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (hasCompletedOnboarding && !isEditMode) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const PublicAuthRoute: React.FC = () => {
  const { isAuthenticated, isAuthLoading, hasCompletedOnboarding } = useAuth();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={hasCompletedOnboarding ? '/' : '/onboarding'} replace />;
  }

  return <Outlet />;
};
