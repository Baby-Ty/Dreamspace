// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';
import DreamTrackerLayout from '../pages/dream-tracker/DreamTrackerLayout';

/**
 * DreamTrackerModal - Thin wrapper re-exporting DreamTrackerLayout
 * Maintains backward compatibility while delegating to new architecture
 * @component
 */
const DreamTrackerModal = ({ dream, onClose, onUpdate }) => {
  return (
    <DreamTrackerLayout 
      dream={dream} 
      onClose={onClose} 
      onUpdate={onUpdate} 
    />
  );
};

DreamTrackerModal.propTypes = {
  dream: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string,
    progress: PropTypes.number.isRequired,
    image: PropTypes.string,
    goals: PropTypes.array,
    notes: PropTypes.array,
    history: PropTypes.array
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default DreamTrackerModal;
