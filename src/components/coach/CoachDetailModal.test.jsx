import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoachDetailModal from './CoachDetailModal';

// Mock the child components
vi.mock('./CoachMetrics', () => ({
  default: ({ metrics }) => <div data-testid="coach-metrics">Metrics: {metrics?.teamSize}</div>
}));

vi.mock('./TeamMemberList', () => ({
  default: ({ members }) => <div data-testid="team-member-list">Members: {members?.length}</div>
}));

vi.mock('./CoachingAlerts', () => ({
  default: ({ alerts }) => <div data-testid="coaching-alerts">Alerts: {alerts?.length}</div>
}));

// Mock the hook
vi.mock('./useCoachDetail', () => ({
  useCoachDetail: () => ({
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    filterStatus: 'all',
    setFilterStatus: vi.fn(),
    sortBy: 'score',
    setSortBy: vi.fn(),
    teamMetrics: {
      teamSize: 5,
      averageScore: 85,
      engagementRate: 90,
      teamMembers: [
        { id: '1', name: 'Member 1', score: 90 },
        { id: '2', name: 'Member 2', score: 80 }
      ]
    },
    coachingAlerts: [
      { severity: 'high', message: 'Test alert' }
    ],
    filteredAndSortedMembers: [
      { id: '1', name: 'Member 1', score: 90 },
      { id: '2', name: 'Member 2', score: 80 }
    ],
    summaryMetrics: {
      teamSize: 5,
      averageScore: 85,
      engagementRate: 90,
      exceeding: 2,
      onTrack: 2,
      needsAttention: 1
    },
    getStatusColor: () => 'text-professional-gray-700 bg-professional-gray-100',
    getStatusText: () => 'On Track'
  })
}));

describe('CoachDetailModal', () => {
  const mockCoach = {
    id: 'coach-1',
    name: 'John Doe',
    email: 'john@example.com',
    office: 'Cape Town',
    avatar: 'https://example.com/avatar.jpg',
    teamMetrics: {
      teamSize: 5,
      averageScore: 85,
      engagementRate: 90,
      teamMembers: [
        { id: '1', name: 'Member 1', score: 90 },
        { id: '2', name: 'Member 2', score: 80 }
      ]
    },
    alerts: [
      { severity: 'high', message: 'Test alert' }
    ]
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal with role="dialog" and aria-modal', () => {
    render(<CoachDetailModal coach={mockCoach} onClose={mockOnClose} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should display coach name and email', () => {
    render(<CoachDetailModal coach={mockCoach} onClose={mockOnClose} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<CoachDetailModal coach={mockCoach} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close coach detail modal/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<CoachDetailModal coach={mockCoach} onClose={mockOnClose} />);

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render when coach is null', () => {
    const { container } = render(<CoachDetailModal coach={null} onClose={mockOnClose} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should prevent body scroll when modal is open', () => {
    const originalOverflow = document.body.style.overflow;
    
    const { unmount } = render(<CoachDetailModal coach={mockCoach} onClose={mockOnClose} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it('should match snapshot', () => {
    const { container } = render(<CoachDetailModal coach={mockCoach} onClose={mockOnClose} />);
    
    expect(container.firstChild).toMatchSnapshot();
  });
});