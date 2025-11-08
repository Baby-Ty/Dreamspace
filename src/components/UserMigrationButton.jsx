// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Button to manually trigger user upgrade to v3 6-container architecture
 */
const UserMigrationButton = ({ userId }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpgrade = async () => {
    if (!userId) {
      setMessage('Error: No user ID');
      return;
    }

    setIsUpgrading(true);
    setMessage('Upgrading to v3 architecture...');

    try {
      // Call the backend to manually set user to v3
      const response = await fetch(`/api/upgradeUserToV3/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upgrade failed');
      }

      const result = await response.json();
      setMessage(`✅ Success! ${result.message}. Refreshing page...`);
      
      // Refresh the page after 2 seconds to reload data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Upgrade error:', error);
      setMessage(`❌ Error: ${error.message}`);
      setIsUpgrading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800">
          Your account is using an older data structure (v1)
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          Upgrade to v3 for better performance and new features
        </p>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={isUpgrading}
        className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Upgrade to v3"
      >
        <RefreshCw className={`w-4 h-4 ${isUpgrading ? 'animate-spin' : ''}`} />
        <span>{isUpgrading ? 'Upgrading...' : 'Upgrade Now'}</span>
      </button>
      {message && (
        <p className="text-sm text-gray-700 mt-2">{message}</p>
      )}
    </div>
  );
};

export default UserMigrationButton;

