import VirtualList from '../../components/VirtualList';
import { useState } from 'react';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { coachingService } from '../../services/coachingService';
import { showToast } from '../../utils/toast';
import { generateRandomTeamName } from '../../utils/teamNameGenerator';
import { CoachCard } from './coach-list';

/**
 * Pure presentational component for displaying a list of coaches
 * @param {Array} coaches - Array of coach objects with team data
 * @param {Function} onSelect - Callback when coach is selected (deprecated - now toggles expansion)
 * @param {Function} onUnassignUser - Callback when user is unassigned (member, coachId) => void
 * @param {Function} onReplaceCoach - Callback when coach is replaced (coach) => void
 * @param {Function} onRefresh - Callback to refresh data after updates
 */
export default function CoachList({ coaches, onSelect, onUnassignUser, onReplaceCoach, onRefresh }) {
  const [expandedTeams, setExpandedTeams] = useState({});
  const [editingTeamName, setEditingTeamName] = useState(null);
  const [editedTeamName, setEditedTeamName] = useState('');

  // Roving tabindex for keyboard navigation
  const { getItemProps, onKeyDown: handleRovingKeyDown } = useRovingFocus(coaches?.length || 0, {
    loop: true,
    direction: 'vertical'
  });

  const toggleTeamExpansion = (coachId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [coachId]: !prev[coachId]
    }));
    if (editingTeamName === coachId) {
      setEditingTeamName(null);
      setEditedTeamName('');
    }
  };

  const handleStartEditTeamName = (coach, e) => {
    e.stopPropagation();
    setEditingTeamName(coach.id);
    setEditedTeamName(coach.teamName || '');
  };

  const handleCancelEditTeamName = (e) => {
    e.stopPropagation();
    setEditingTeamName(null);
    setEditedTeamName('');
  };

  const handleGenerateRandomTeamName = (e) => {
    e.stopPropagation();
    const randomName = generateRandomTeamName();
    setEditedTeamName(randomName);
  };

  const handleSaveTeamName = async (coach, e) => {
    e.stopPropagation();
    if (!editedTeamName.trim()) {
      showToast('Team name cannot be empty', 'error');
      return;
    }

    try {
      const result = await coachingService.updateTeamName(coach.id, editedTeamName.trim());
      
      if (result.success) {
        showToast('Team name updated successfully', 'success');
        setEditingTeamName(null);
        setEditedTeamName('');
        if (onRefresh) {
          onRefresh();
        }
      } else {
        showToast(result.error || 'Failed to update team name', 'error');
      }
    } catch (error) {
      console.error('Error updating team name:', error);
      showToast('Error updating team name', 'error');
    }
  };

  const handleKeyDown = (e, action, index) => {
    handleRovingKeyDown(e);
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  if (!coaches || coaches.length === 0) {
    return (
      <div className="text-center py-12 text-professional-gray-500">
        <p>No coaches found.</p>
      </div>
    );
  }

  // Use virtual list for large datasets (100+ coaches)
  const useVirtualization = coaches.length > 100;

  // Render a single coach card
  const renderCoachCard = (coach, index, style = {}) => {
    const isExpanded = expandedTeams[coach.id];
    const rovingProps = getItemProps(index);
    
    return (
      <CoachCard
        key={coach.id}
        coach={coach}
        index={index}
        isExpanded={isExpanded}
        rovingProps={rovingProps}
        editingTeamName={editingTeamName}
        editedTeamName={editedTeamName}
        setEditedTeamName={setEditedTeamName}
        onToggle={toggleTeamExpansion}
        onStartEdit={handleStartEditTeamName}
        onCancelEdit={handleCancelEditTeamName}
        onSaveTeamName={handleSaveTeamName}
        onGenerateRandomName={handleGenerateRandomTeamName}
        onKeyDown={handleKeyDown}
        onUnassignUser={onUnassignUser}
        onReplaceCoach={onReplaceCoach}
        useVirtualization={useVirtualization}
        style={style}
      />
    );
  };

  // Conditional rendering: virtual list for 100+ items, regular list otherwise
  if (useVirtualization) {
    return (
      <VirtualList
        items={coaches}
        renderItem={renderCoachCard}
        itemHeight={120}
        height={600}
        ariaLabel="Virtual coach teams list"
        testId="coach-list-virtual"
        className="rounded-lg"
      />
    );
  }

  // Regular rendering for smaller lists
  return (
    <div 
      className="space-y-2"
      role="list"
      aria-label="Coach teams list"
      data-testid="coach-list-regular"
    >
      {coaches.map((coach, index) => renderCoachCard(coach, index))}
    </div>
  );
}