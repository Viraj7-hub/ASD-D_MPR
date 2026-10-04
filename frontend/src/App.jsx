import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css'
import FirstPage from './first_page.jsx'
import SignUp from './SignUp.jsx'
import Login from './Login.jsx'
import VerifyEmail from './VerifyEmail.jsx'
import OTP from './OTP.jsx'
import NewPassword from './NewPassword.jsx'
import User_dashboard from './User_dashboard.jsx'
import Service_Plumbing from './Service_Plumbing.jsx'
import Service_Electrician from './Service_Electrician.jsx'
import Service_Carpentry from './Service_Carpentry.jsx'
import Service_Housekeeping from './Service_Housekeeping.jsx'
import Chat from './Chat.jsx'
import Booking from './Booking.jsx'
import Provider_dashboard from './Provider_dashboard.jsx'
import MyRequests from './MyRequests.jsx'
// FIX #17: Auth route guard
import ProtectedRoute from './ProtectedRoute.jsx'
// FIX #16: Global toast notification system
import { ToastProvider } from './Toast.jsx'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<FirstPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path='/verifyemail' element={<VerifyEmail />} />
          <Route path='/otp' element={<OTP />} />
          <Route path='/newpassword' element={<NewPassword />} />
          <Route path='/chat' element={<Chat />} />
          {/* FIX #17: Protected routes — require login */}
          <Route path='/User_dashboard' element={
            <ProtectedRoute requiredRole="User">
              <User_dashboard />
            </ProtectedRoute>
          } />
          <Route path='/my_requests' element={
            <ProtectedRoute requiredRole="User">
              <MyRequests />
            </ProtectedRoute>
          } />
          <Route path='/Service_Plumbing' element={
            <ProtectedRoute requiredRole="User">
              <Service_Plumbing />
            </ProtectedRoute>
          } />
          <Route path='/Service_Electrician' element={
            <ProtectedRoute requiredRole="User">
              <Service_Electrician />
            </ProtectedRoute>
          } />
          <Route path='/Service_Carpentry' element={
            <ProtectedRoute requiredRole="User">
              <Service_Carpentry />
            </ProtectedRoute>
          } />
          <Route path='/Service_HouseKeeping' element={
            <ProtectedRoute requiredRole="User">
              <Service_Housekeeping />
            </ProtectedRoute>
          } />
          <Route path='/booking' element={
            <ProtectedRoute requiredRole="User">
              <Booking />
            </ProtectedRoute>
          } />
          <Route path='/Provider_dashboard' element={
            <ProtectedRoute requiredRole="Service Provider">
              <Provider_dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
