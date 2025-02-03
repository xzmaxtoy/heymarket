docs/BATCH_IMPLEMENTATION.mdimport React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import NotificationAnalytics from '../components/NotificationAnalytics';
import { BatchAlert } from '@/types/alerts';

const theme = createTheme();

const mockNotifications: BatchAlert[] = [
  {
    id: '1',
    message: 'Test message 1',
    severity: 'error',
    channels: ['email', 'sms'],
    delivered_at: '2025-02-01T10:00:00Z',
    read_at: '2025-02-01T10:15:00Z',
  },
  {
    id: '2',
    message: 'Test message 2',
    severity: 'warning',
    channels: ['sms'],
    delivered_at: '2025-02-01T11:00:00Z',
    read_at: null,
  },
  {
    id: '3',
    message: 'Test message 3',
    severity: 'error',
    channels: ['email'],
    delivered_at: '2025-02-01T12:00:00Z',
    read_at: '2025-02-01T12:30:00Z',
  },
];

describe('NotificationAnalytics', () => {
  const renderComponent = (notifications = mockNotifications) => {
    return render(
      <ThemeProvider theme={theme}>
        <NotificationAnalytics notifications={notifications} />
      </ThemeProvider>
    );
  };

  it('renders delivery success metrics', () => {
    renderComponent();
    expect(screen.getByText('Delivery Success Rate')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 delivered successfully')).toBeInTheDocument();
  });

  it('renders user interaction metrics', () => {
    renderComponent();
    expect(screen.getByText('User Interaction Metrics')).toBeInTheDocument();
    expect(screen.getByText('66.7%')).toBeInTheDocument(); // 2 out of 3 read
    expect(screen.getByText(/Average Read Time/)).toBeInTheDocument();
  });

  it('renders notification trends', () => {
    renderComponent();
    expect(screen.getByText('Notification Trends')).toBeInTheDocument();
    // Verify legend items
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });

  it('renders channel performance', () => {
    renderComponent();
    expect(screen.getByText('Channel Performance')).toBeInTheDocument();
    expect(screen.getByText('Read Rate (%)')).toBeInTheDocument();
    expect(screen.getByText('Error Rate (%)')).toBeInTheDocument();
  });

  it('renders volume by hour', () => {
    renderComponent();
    expect(screen.getByText('Volume by Hour')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders top error channels', () => {
    renderComponent();
    expect(screen.getByText('Top Error Channels')).toBeInTheDocument();
    // Verify error channel chips
    const errorChannels = screen.getAllByRole('button');
    expect(errorChannels.some(chip => chip.textContent?.includes('email'))).toBeTruthy();
    expect(errorChannels.some(chip => chip.textContent?.includes('sms'))).toBeTruthy();
  });

  it('handles empty notifications array', () => {
    renderComponent([]);
    expect(screen.getByText('Delivery Success Rate')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const notifications: BatchAlert[] = [
      {
        id: '1',
        message: 'Test message',
        severity: 'error',
        channels: ['email'],
        delivered_at: '2025-02-01T10:00:00Z',
        read_at: '2025-02-01T12:00:00Z', // 2 hours difference
      },
    ];
    renderComponent(notifications);
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
  });
});
