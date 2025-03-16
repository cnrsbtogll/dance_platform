// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './store/authSlice';
import DashboardLayout from './components/layout/DashboardLayout';
import SocialLogin from './components/auth/SocialLogin';
import PhoneVerification from './components/auth/PhoneVerification';
import SchoolRegistration from './components/profile/SchoolRegistration';
import PartnerMatching from './components/partners/PartnerMatching';
import BadgeSystem from './components/progress/BadgeSystem';
import InstructorCalendar from './components/calendar/InstructorCalendar';

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<SocialLogin />} />
          <Route path="/verify-phone" element={<PhoneVerification />} />
          <Route path="/register-school" element={<SchoolRegistration />} />
          <Route element={<DashboardLayout />}>
            <Route path="/partners" element={<PartnerMatching />} />
            <Route path="/progress" element={<BadgeSystem />} />
            <Route path="/calendar" element={<InstructorCalendar />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;