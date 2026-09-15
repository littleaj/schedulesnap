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
import HelpPage from '@/components/pages/HelpPage';
import AboutPage from '@/components/pages/AboutPage';
import { BrowserRouter, Route, Routes, useNavigate, Outlet } from 'react-router';
import { clearAnalysisFlowCache } from '@/services/schedule-analysis';
import { getAnalysisFlowResumeTarget } from '@/services/analysis-flow';
import type { AnalysisFlowResumeTarget } from '@/types/schedule-analysis';
import { GoogleOAuthTokenProvider } from '@/contexts/google-oauth';
import useCurrentUser from '@/hooks/current-user';

interface ResumeProgressWrapperProps {
  resumeTarget: AnalysisFlowResumeTarget | null;
  onResumeHandled: () => void;
}

const ResumeProgressWrapper = ({ resumeTarget, onResumeHandled }: ResumeProgressWrapperProps) => {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const handleContinue = () => {
    if (!resumeTarget) {
      return;
    }

    navigate(resumeTarget.route, { replace: true });
    onResumeHandled();
  };

  const handleDiscard = () => {
    if (!user) {
      return;
    }

    clearAnalysisFlowCache(user.uid);
    navigate('/capture', { replace: true });
    onResumeHandled();
  };

  return (
    <>
      {resumeTarget && user ? (
        <AnalysisResumeDialog
          resumeTarget={resumeTarget}
          onContinue={handleContinue}
          onDiscard={handleDiscard}
        />
      ) : null}
      <Outlet />
    </>
  );
};
const ScheduleSnap = () => {
  const [resumeTarget, setResumeTarget] = useState<AnalysisFlowResumeTarget | null>(null);

  const user = useCurrentUser();

  useEffect(() => {
    console.log("Checking for analysis flow resume target", { "user.uid": user?.uid });
    if (!user) {
      return;
    }

    const analysisFlowTarget = getAnalysisFlowResumeTarget(user.uid);
    console.log("Checkied for analysis flow resume target: ", analysisFlowTarget?.route);
    setResumeTarget(analysisFlowTarget);
  }, [user]);

  return (
    <div className="app-shell">
      <BrowserRouter>
        <GoogleOAuthTokenProvider>
          <HeaderBar />
          <Routes>
            <Route element={<ResumeProgressWrapper
                resumeTarget={resumeTarget}
                onResumeHandled={() => setResumeTarget(null)} />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/logout" element={<LogoutPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/capture" element={<CapturePage />} />
                <Route path="/analyze" element={<AnalysisPage />} />
                <Route path="/confirm" element={<ConfirmPage />} />
                <Route path="/finished" element={<FinishedPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
              </Route>
            </Route>
          </Routes>
        </GoogleOAuthTokenProvider>
      </BrowserRouter>
    </div>
  );
};

export default ScheduleSnap;
