import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-professional-gray-50 flex items-center justify-center">
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading</span>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src="/logo.png" 
              alt="DreamSpace Logo" 
              className="w-12 h-12 rounded-xl object-contain shadow-lg animate-spin"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-12 h-12 bg-gradient-to-br from-netsurit-red to-netsurit-coral rounded-xl items-center justify-center shadow-lg animate-spin hidden">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-3xl font-bold text-professional-gray-800">
              <span className="text-netsurit-red">Dream</span><span className="text-professional-gray-700">Space</span>
            </h1>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-netsurit-red mx-auto mb-4"></div>
          <p className="text-professional-gray-700">Authenticating...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
