import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AiCoachProvider } from './context/AiCoachContext';
import { PwaProvider } from './context/PwaContext';
import { PwaIosGuideModal } from './components/pwa/PwaInstallButton';
import { ProtectedRoute, PublicAuthRoute, OnboardingRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { AuthPage } from './pages/Auth/AuthPage';
import { OnboardingPage } from './pages/Onboarding/OnboardingPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { StudyProgram } from './pages/StudyProgram';
import { StudyTimerPage } from './pages/StudyTimer/StudyTimerPage';
import { ExamScoresPage } from './pages/ExamScores/ExamScoresPage';
import { AiCoachPage } from './pages/AiCoach/AiCoachPage';
import { ProfilePage } from './pages/Profile/ProfilePage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PwaProvider>
        <AuthProvider>
          <AiCoachProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Route */}
                <Route element={<PublicAuthRoute />}>
                  <Route path="/auth" element={<AuthPage />} />
                </Route>

                {/* Onboarding Route (Authenticated users who haven't completed onboarding or are editing) */}
                <Route element={<OnboardingRoute />}>
                  <Route path="/onboarding" element={<OnboardingPage />} />
                </Route>

                {/* Protected Application Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="program" element={<StudyProgram />} />
                    <Route path="sayac" element={<StudyTimerPage />} />
                    <Route path="denemeler" element={<ExamScoresPage />} />
                    <Route path="koc" element={<AiCoachPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>
                </Route>

                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
            <PwaIosGuideModal />
          </AiCoachProvider>
        </AuthProvider>
      </PwaProvider>
    </ThemeProvider>
  );
};

export default App;
