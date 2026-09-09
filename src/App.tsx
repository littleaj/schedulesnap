import React from 'react';
import './App.css';
import ProtectedRoute from '@/components/ProtectedRoute';
import HeaderBar from '@/components/organisms/HeaderBar';
import HomePage from '@/components/pages/HomePage';
import LoginPage from '@/components/pages/LoginPage';
import LogoutPage from '@/components/pages/LogoutPage';
import OnboardingPage from '@/components/pages/OnboardingPage';
import CapturePage from '@/components/pages/CapturePage';
import AnalysisPage from '@/components/pages/AnalysisPage';
import SettingsPage from '@/components/pages/SettingsPage';
import { BrowserRouter, Route, Routes } from 'react-router';

const ScheduleSnap = () => {
  return (
    <div className="app-shell">
      <BrowserRouter>
        <HeaderBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<div>About page</div>} />
          <Route path="/help" element={<div>Help page</div>} />

          <Route element={<ProtectedRoute />}>
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/capture" element={<CapturePage />} />
            <Route path="/analyze" element={<AnalysisPage />} />
            <Route path="/confirm" element={<div>Confirm page</div>} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default ScheduleSnap;
