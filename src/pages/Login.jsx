import React from 'react';
import { Star, Users, Target, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, isLoading, loginError, clearLoginError } = useAuth();
  
  console.log('Login component state:', { isLoading, hasError: !!loginError });
  
  return (
    <div className="min-h-screen bg-professional-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src="/logo.png" 
              alt="DreamSpace Logo" 
              className="w-12 h-12 rounded-xl object-contain shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-12 h-12 bg-gradient-to-br from-netsurit-red to-netsurit-coral rounded-xl items-center justify-center shadow-lg hidden">
              <Star className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black">
              Netsurit
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-professional-gray-900 mb-2">
            Welcome to the Dreams Program
          </h2>
          <p className="text-professional-gray-600 mb-8">
            Track your dreams, connect with colleagues, and achieve your goals together.
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
                <p className="text-sm text-professional-gray-600">Document and track your personal dreams</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-netsurit-light-coral/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-netsurit-red" />
              </div>
              <div>
                <h3 className="font-medium text-professional-gray-900">Dream Connect</h3>
                <p className="text-sm text-professional-gray-600">Connect with colleagues sharing similar dreams</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-netsurit-light-coral/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-netsurit-red" />
              </div>
              <div>
                <h3 className="font-medium text-professional-gray-900">Progress Tracking</h3>
                <p className="text-sm text-professional-gray-600">Monitor your journey and earn points</p>
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
            className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-light-coral focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-lg disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="currentColor">
                <path d="M1 1h10v10H1z"/>
                <path d="M12 1h10v10H12z"/>
                <path d="M1 12h10v10H1z"/>
                <path d="M12 12h10v10H12z"/>
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
          
          <p className="text-center text-sm text-professional-gray-500">
            Use your company Microsoft account to access DreamSpace
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-professional-gray-400">
          <p>© 2025 Dreams Program</p>
        </div>
      </div>
    </div>
  );
};

export default Login;