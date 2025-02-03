import { useMemo } from 'react';
import { BatchAlert } from '@/types/alerts';

interface TrendData {
  date: string;
  total: number;
  errors: number;
  warnings: number;
  readRate: number;
  channelDistribution: {
    [key: string]: number;
  };
}

interface TrendMetrics {
  dailyTrends: TrendData[];
  topChannels: { channel: string; count: number }[];
  averageReadTime: number;
  peakNotificationDay: {
    date: string;
    count: number;
  };
}

export function useNotificationTrends(notifications: BatchAlert[]): TrendMetrics {
  return useMemo(() => {
    // Group notifications by date
    const groupedByDate = notifications.reduce((acc, notification) => {
      const date = new Date(notification.delivered_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          total: 0,
          errors: 0,
          warnings: 0,
          read: 0,
          channels: {},
        };
      }

      acc[date].total++;
      if (notification.severity === 'error') acc[date].errors++;
      if (notification.severity === 'warning') acc[date].warnings++;
      if (notification.read_at) acc[date].read++;
      
      notification.channels.forEach(channel => {
        acc[date].channels[channel] = (acc[date].channels[channel] || 0) + 1;
      });

      return acc;
    }, {} as Record<string, {
      total: number;
      errors: number;
      warnings: number;
      read: number;
      channels: Record<string, number>;
    }>);

    // Convert to array and sort by date
    const dailyTrends = Object.entries(groupedByDate)
      .map(([date, data]) => ({
        date,
        total: data.total,
        errors: data.errors,
        warnings: data.warnings,
        readRate: (data.read / data.total) * 100,
        channelDistribution: data.channels,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate top channels
    const channelCounts = notifications.reduce((acc, notification) => {
      notification.channels.forEach(channel => {
        acc[channel] = (acc[channel] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topChannels = Object.entries(channelCounts)
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate average read time
    const readTimes = notifications
      .filter(n => n.read_at)
      .map(n => {
        const deliveredTime = new Date(n.delivered_at).getTime();
        const readTime = new Date(n.read_at!).getTime();
        return readTime - deliveredTime;
      });

    const averageReadTime = readTimes.length
      ? readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length
      : 0;

    // Find peak notification day
    const peakNotificationDay = dailyTrends.reduce(
      (peak, day) => (day.total > peak.count ? { date: day.date, count: day.total } : peak),
      { date: '', count: 0 }
    );

    return {
      dailyTrends,
      topChannels,
      averageReadTime,
      peakNotificationDay,
    };
  }, [notifications]);
}
