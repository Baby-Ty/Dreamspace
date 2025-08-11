import React from 'react';
import { Star, Users, Target, BookOpen } from 'lucide-react';

const Login = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Star className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DreamSpace
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to the Dreams Program
          </h2>
          <p className="text-gray-600 mb-8">
            Track your dreams, connect with colleagues, and achieve your goals together.
          </p>
        </div>

        {/* Features Preview */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Dream Book</h3>
                <p className="text-sm text-gray-600">Document and track your personal dreams</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Dream Connect</h3>
                <p className="text-sm text-gray-600">Connect with colleagues sharing similar dreams</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Progress Tracking</h3>
                <p className="text-sm text-gray-600">Monitor your journey and earn points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-lg"
          >
            <Users className="w-5 h-5 mr-2" />
            Enter DreamSpace
          </button>
          
          <p className="text-center text-sm text-gray-500">
            Demo mode - Click to explore as Sarah Johnson
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>© 2025 Dreams Program</p>
        </div>
      </div>
    </div>
  );
};

export default Login;