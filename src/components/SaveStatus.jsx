import React, { useState, useEffect } from 'react';
import { Check, Save } from 'lucide-react';
import { SUCCESS_NOTIFICATION_DURATION } from '../constants/timing';

const SaveStatus = () => {
  const [showSaved, setShowSaved] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  useEffect(() => {
    const handleSaved = () => {
      setLastSaveTime(new Date());
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    };

    window.addEventListener('dreamspace:saved', handleSaved);
    return () => window.removeEventListener('dreamspace:saved', handleSaved);
  }, []);

  if (!showSaved) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl shadow-xl border border-white/20 flex items-center space-x-2 animate-slide-up backdrop-blur-sm">
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">Progress Saved</span>
      </div>
    </div>
  );
};

export default SaveStatus;