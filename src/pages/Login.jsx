// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import { Star, Users, Target, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';

const Login = () => {
  const { login, isLoading, loginError, clearLoginError } = useAuth();
  
  console.log('Login component state:', { isLoading, hasError: !!loginError });
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="DreamSpace Logo" 
              className="w-20 h-20 object-contain rounded-2xl"
              style={{ backgroundColor: 'transparent' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-20 h-20 bg-netsurit-red rounded-xl items-center justify-center shadow-lg hidden">
              <Star className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-professional-gray-900 mb-2">
            Welcome to the Dreams Program
          </h2>
          <p className="text-professional-gray-600 mb-8">
            A space to dream bigger, learn from others, and track the steps that get you there.
          </p>
        </div>

        {/* Features Preview */}
        <div className="bg-white rounded-2xl shadow-xl border border-professional-gray-200 p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-netsurit-light-coral/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-netsurit-red" />
              </div>
              <div>
                <h3 className="font-medium text-professional-gray-900">Dream Book</h3>
                <p className="text-sm text-professional-gray-600">Capture your dreams and keep them moving.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-netsurit-light-coral/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-netsurit-red" />
              </div>
              <div>
                <h3 className="font-medium text-professional-gray-900">Dream Connect</h3>
                <p className="text-sm text-professional-gray-600">Meet colleagues with similar dreams. Share, learn, inspire.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-netsurit-light-coral/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-netsurit-red" />
              </div>
              <div>
                <h3 className="font-medium text-professional-gray-900">Progress Tracking</h3>
                <p className="text-sm text-professional-gray-600">Monitor your journey and celebrate your progress.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {loginError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm">{loginError}</p>
              <button 
                onClick={clearLoginError}
                className="text-red-600 hover:text-red-800 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Login Button */}
        <div className="space-y-4">
          <button
            onClick={() => login(false)}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-6 py-4 bg-netsurit-red text-white rounded-xl hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 font-semibold text-lg disabled:opacity-50 shadow-lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="currentColor" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Microsoft logo">
                <path d="M0 0h9.5v9.5H0V0z"/>
                <path d="M11.5 0H21v9.5h-9.5V0z"/>
                <path d="M0 11.5h9.5V21H0V11.5z"/>
                <path d="M11.5 11.5H21V21h-9.5V11.5z"/>
              </svg>
            )}
            Sign in with Microsoft
          </button>
          
          {loginError && !isLoading && (
            <button
              onClick={() => {
                clearLoginError();
                login(false);
              }}
              className="w-full flex items-center justify-center px-4 py-2 bg-white border border-netsurit-red text-netsurit-red rounded-xl hover:bg-netsurit-red hover:text-white focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;