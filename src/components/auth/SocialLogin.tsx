// src/components/auth/SocialLogin.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../App';
import { signInWithGoogle, signInWithFacebook, setUserRole } from '../../store/authSlice';
import { UserRole } from '../../types';

const SocialLogin: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state: RootState) => state.auth);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  // If user is already logged in, redirect to appropriate dashboard
  React.useEffect(() => {
    if (user) {
      if (!user.phoneVerified) {
        navigate('/verify-phone');
      } else if (user.role === 'school' && !user.verified) {
        navigate('/register-school');
      } else {
        navigate('/progress');
      }
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await dispatch(signInWithGoogle()).unwrap();
      // If successful, useEffect will handle redirect
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await dispatch(signInWithFacebook()).unwrap();
      // If successful, useEffect will handle redirect
    } catch (error) {
      console.error('Facebook sign in failed:', error);
    }
  };

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (user) {
      await dispatch(setUserRole({ userId: user.id, role: selectedRole }));
      
      if (selectedRole === 'school') {
        navigate('/register-school');
      } else {
        navigate('/verify-phone');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Dance Platform
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect with dancers, find partners, and track your progress
          </p>
        </div>
        
        {!user ? (
          <div className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <div className="rounded-md shadow-sm space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </span>
                Sign in with Google
              </button>
              
              <button
                type="button"
                onClick={handleFacebookSignIn}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-blue-500 bg-white rounded-full" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="currentColor" />
                  </svg>
                </span>
                Sign in with Facebook
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-lg font-medium">Welcome, {user.displayName}!</p>
              <p className="text-sm text-gray-600">Please select your role to continue</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelection('student')}
                className={`p-4 rounded-lg border flex flex-col items-center ${
                  selectedRole === 'student' ? 'bg-indigo-50 border-indigo-500' : 'border-gray-200'
                }`}
              >
                <span className="text-2xl">👨‍🎓</span>
                <span className="mt-2 text-sm font-medium">Student</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleRoleSelection('instructor')}
                className={`p-4 rounded-lg border flex flex-col items-center ${
                  selectedRole === 'instructor' ? 'bg-indigo-50 border-indigo-500' : 'border-gray-200'
                }`}
              >
                <span className="text-2xl">👩‍🏫</span>
                <span className="mt-2 text-sm font-medium">Instructor</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleRoleSelection('school')}
                className={`p-4 rounded-lg border flex flex-col items-center ${
                  selectedRole === 'school' ? 'bg-indigo-50 border-indigo-500' : 'border-gray-200'
                }`}
              >
                <span className="text-2xl">🏫</span>
                <span className="mt-2 text-sm font-medium">Dance School</span>
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialLogin;