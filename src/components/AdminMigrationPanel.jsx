// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fixLegacyTemplates, checkLegacyTemplates } from '../utils/fixLegacyTemplates';

/**
 * AdminMigrationPanel - One-time utility to fix legacy templates
 * 
 * This component provides a UI to fix weekly goal templates that are missing dreamId.
 * After running once successfully, this component can be removed.
 */
export default function AdminMigrationPanel() {
  const { currentUser, weeklyGoals } = useApp();
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState(null);
  const [templatesNeedingFix, setTemplatesNeedingFix] = useState([]);
  
  const handleCheck = () => {
    setIsChecking(true);
    try {
      const templates = checkLegacyTemplates(weeklyGoals);
      setTemplatesNeedingFix(templates);
      setResult(null);
    } catch (error) {
      console.error('Error checking templates:', error);
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleFix = async () => {
    if (!currentUser?.id || !currentUser?.dreamBook) {
      alert('Cannot fix: User data not loaded');
      return;
    }
    
    if (templatesNeedingFix.length === 0) {
      alert('No templates need fixing. Run "Check" first.');
      return;
    }
    
    const confirmed = window.confirm(
      `Fix ${templatesNeedingFix.length} templates with missing dreamId?\n\n` +
      'This will update the templates to include the correct dreamId based on dreamTitle.'
    );
    
    if (!confirmed) return;
    
    setIsFixing(true);
    
    try {
      const summary = await fixLegacyTemplates(
        currentUser.id,
        weeklyGoals,
        currentUser.dreamBook
      );
      
      setResult(summary);
      
      // Refresh the page to load updated templates
      if (summary.fixed > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Error fixing templates:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <div className="bg-professional-gray-50 border border-professional-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-netsurit-orange flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-professional-gray-900 mb-1">
            Legacy Template Migration
          </h3>
          <p className="text-sm text-professional-gray-600 mb-3">
            Fix weekly goal templates that are missing <code className="bg-professional-gray-200 px-1 py-0.5 rounded text-xs">dreamId</code> field.
            This is a one-time cleanup for legacy data.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCheck}
              disabled={isChecking || isFixing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-professional-gray-300 rounded-lg text-sm font-medium text-professional-gray-700 hover:bg-professional-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="check-templates-btn"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Check Templates'}
            </button>
            
            {templatesNeedingFix.length > 0 && (
              <button
                onClick={handleFix}
                disabled={isFixing}
                className="flex items-center gap-2 px-4 py-2 bg-netsurit-red text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="fix-templates-btn"
              >
                <CheckCircle className={`w-4 h-4 ${isFixing ? 'animate-spin' : ''}`} />
                {isFixing ? 'Fixing...' : `Fix ${templatesNeedingFix.length} Templates`}
              </button>
            )}
          </div>
          
          {/* Check Results */}
          {!isChecking && templatesNeedingFix.length > 0 && !result && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 mb-2">
                Found {templatesNeedingFix.length} templates needing fix:
              </p>
              <ul className="text-xs text-yellow-800 space-y-1 max-h-40 overflow-y-auto">
                {templatesNeedingFix.map(t => (
                  <li key={t.id} className="flex items-start gap-2">
                    <span className="flex-shrink-0">•</span>
                    <span>
                      <strong>{t.title}</strong> (Dream: {t.dreamTitle})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {!isChecking && templatesNeedingFix.length === 0 && !result && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ All templates have dreamId! No fix needed.
              </p>
            </div>
          )}
          
          {/* Fix Results */}
          {result && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-2">
                Migration Complete!
              </p>
              <ul className="text-xs text-green-800 space-y-1">
                <li>✅ Fixed: {result.fixed} templates</li>
                <li>❌ Errors: {result.errors} templates</li>
                <li>📊 Total: {result.total} templates</li>
              </ul>
              {result.fixed > 0 && (
                <p className="text-xs text-green-700 mt-2 italic">
                  Page will refresh in 3 seconds to load updated templates...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

