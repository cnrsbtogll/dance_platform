// src/components/auth/PhoneVerification.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../App';
import { sendPhoneVerification, verifyPhoneCode } from '../../store/authSlice';

const PhoneVerification: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, loading, error, phoneVerificationId } = useSelector((state: RootState) => state.auth);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if phone is already verified
    if (user.phoneVerified) {
      navigate('/progress');
    }
    
    // Set initial phone number if available from user
    if (user.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
    }
  }, [user, navigate]);

  useEffect(() => {
    // Set verification sent flag if we have a verification ID
    if (phoneVerificationId) {
      setVerificationSent(true);
      setCountdown(60); // Start 60-second countdown
    }
  }, [phoneVerificationId]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      return;
    }
    
    try {
      // Format phone number with international code if needed
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      await dispatch(sendPhoneVerification(formattedPhone)).unwrap();
    } catch (error) {
      console.error('Error sending verification:', error);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || !phoneVerificationId || !user) {
      return;
    }
    
    try {
      await dispatch(
        verifyPhoneCode({
          verificationId: phoneVerificationId,
          code: verificationCode,
          userId: user.id
        })
      ).unwrap();
      
      // Verification successful, redirect based on role
      if (user.role === 'school' && !user.verified) {
        navigate('/register-school');
      } else {
        navigate('/progress');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Phone Verification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We need to verify your phone number for partner matching and security
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div id="recaptcha-container"></div>

        {!verificationSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendVerification}>
            <div className="rounded-md shadow-sm">
              <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone-number"
                name="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !phoneNumber.trim()}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
            <div className="rounded-md shadow-sm">
              <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                id="verification-code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                placeholder="Enter 6-digit code"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !verificationCode.trim() || verificationCode.length < 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>

            {countdown > 0 ? (
              <p className="text-center text-sm text-gray-600">
                Resend code in {countdown} seconds
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={loading}
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none"
              >
                Resend verification code
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneVerification;