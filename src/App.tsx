import React from 'react';
import './App.css';
import HomePage from './components/pages/HomePage/HomePage';
import { BrowserRouter, Route, Routes } from 'react-router';

const ScheduleSnap = () => {
  return (
    <div className="app-shell">
      <BrowserRouter>
        <Routes>
          <Route index element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default ScheduleSnap;
