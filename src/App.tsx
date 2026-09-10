import React, { useEffect, useState } from 'react';
import './App.css';
import ProtectedRoute from '@/components/ProtectedRoute';
import AnalysisResumeDialog from '@/components/molecules/AnalysisResumeDialog';
import HeaderBar from '@/components/organisms/HeaderBar';
import HomePage from '@/components/pages/HomePage';
import LoginPage from '@/components/pages/LoginPage';
import LogoutPage from '@/components/pages/LogoutPage';
import OnboardingPage from '@/components/pages/OnboardingPage';
import CapturePage from '@/components/pages/CapturePage';
import AnalysisPage from '@/components/pages/AnalysisPage';
import ConfirmPage from '@/components/pages/ConfirmPage';
import FinishedPage from '@/components/pages/FinishedPage';
import SettingsPage from '@/components/pages/SettingsPage';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router';
import { clearAnalysisFlowCache } from '@/services/schedule-analysis';
import { getAnalysisFlowResumeTarget } from '@/services/analysis-flow';
import type { AnalysisFlowResumeTarget } from '@/types/schedule-analysis';
import { GoogleOAuthTokenProvider } from './contexts/google-oauth';

interface AppShellContentProps {
  resumeTarget: AnalysisFlowResumeTarget | null;
  onResumeHandled: () => void;
}

const AppShellContent = ({ resumeTarget, onResumeHandled }: AppShellContentProps) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!resumeTarget) {
      return;
    }

    navigate(resumeTarget.route, { replace: true });
    onResumeHandled();
  };

  const handleDiscard = () => {
    clearAnalysisFlowCache();
    onResumeHandled();
  };

  return (
    <>
      <HeaderBar />
      {resumeTarget ? (
        <AnalysisResumeDialog
          resumeTarget={resumeTarget}
          onContinue={handleContinue}
          onDiscard={handleDiscard}
        />
      ) : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<div>About page</div>} />
        <Route path="/help" element={<div>Help page</div>} />

        <Route element={<ProtectedRoute />}>
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/analyze" element={<AnalysisPage />} />
          <Route path="/confirm" element={<ConfirmPage />} />
          <Route path="/finished" element={<FinishedPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
      </Routes>
    </>
  );
};
const ScheduleSnap = () => {
  const [resumeTarget, setResumeTarget] = useState<AnalysisFlowResumeTarget | null>(null);

  useEffect(() => {
    setResumeTarget(getAnalysisFlowResumeTarget());
  }, []);

  return (
    <div className="app-shell">
      <BrowserRouter>
        <GoogleOAuthTokenProvider>
          <AppShellContent resumeTarget={resumeTarget} onResumeHandled={() => setResumeTarget(null)} />
        </GoogleOAuthTokenProvider>
      </BrowserRouter>
    </div>
  );
};

export default ScheduleSnap;
