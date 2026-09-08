import React from 'react';
import './App.css';
import ProtectedRoute from '@/components/ProtectedRoute';
import HeaderBar from '@/components/organisms/HeaderBar';
import HomePage from '@/components/pages/HomePage';
import LoginPage from '@/components/pages/LoginPage';
import LogoutPage from '@/components/pages/LogoutPage';
import { BrowserRouter, Route, Routes } from 'react-router';

const ScheduleSnap = () => {
  return (
    <div className="app-shell">
      <BrowserRouter>
        <HeaderBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/help" element={<div>Help page</div>} />

          <Route element={<ProtectedRoute />}>
            <Route path="/logout" element={<LogoutPage />} />
            {/* placeholders for protected routes */}
            <Route path="/capture" element={<div>Capture page</div>} />
            <Route path="/confirm" element={<div>Confirm page</div>} />
            <Route path="/settings" element={<div>Settings page</div>} />
            <Route path="/onboarding" element={<div>Onboarding page</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default ScheduleSnap;
