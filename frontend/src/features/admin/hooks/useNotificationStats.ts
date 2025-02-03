import { useMemo } from 'react';
import { BatchAlert } from '@/types/alerts';

interface NotificationStats {
  totalCount: number;
  unreadCount: number;
  readRate: number;
  channelStats: {
    [channel: string]: {
      count: number;
      percentage: number;
      errorRate: number;
    };
  };
  severityStats: {
    error: {
      count: number;
      percentage: number;
      avgReadTime: number;
    };
    warning: {
      count: number;
      percentage: number;
      avgReadTime: number;
    };
  };
  timeStats: {
    avgReadTime: number;
    avgResponseTime: number;
    peakHours: number[];
    quietHours: number[];
  };
  trends: {
    daily: {
      date: string;
      total: number;
      errors: number;
      warnings: number;
    }[];
    weekly: {
      week: string;
      total: number;
      errorRate: number;
      readRate: number;
    }[];
  };
}

export function useNotificationStats(notifications: BatchAlert[]): NotificationStats {
  return useMemo(() => {
    // Calculate basic counts
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read_at).length;
    const readRate = total > 0 ? ((total - unread) / total) * 100 : 0;

    // Calculate channel statistics
    const channelStats = notifications.reduce((acc, n) => {
      n.channels.forEach(channel => {
        if (!acc[channel]) {
          acc[channel] = { count: 0, errors: 0, total: 0 };
        }
        acc[channel].count++;
        acc[channel].total++;
        if (n.severity === 'error') acc[channel].errors++;
      });
      return acc;
    }, {} as Record<string, { count: number; errors: number; total: number }>);

    // Calculate severity statistics
    const severityStats = notifications.reduce(
      (acc, n) => {
        const severity = n.severity;
        acc[severity].count++;
        if (n.read_at) {
          const readTime = new Date(n.read_at).getTime() - new Date(n.delivered_at).getTime();
          acc[severity].totalReadTime += readTime;
          acc[severity].readCount++;
        }
        return acc;
      },
      {
        error: { count: 0, totalReadTime: 0, readCount: 0 },
        warning: { count: 0, totalReadTime: 0, readCount: 0 },
      }
    );

    // Calculate time-based statistics
    const timeStats = notifications.reduce(
      (acc, n) => {
        const hour = new Date(n.delivered_at).getHours();
        acc.hourCounts[hour] = (acc.hourCounts[hour] || 0) + 1;

        if (n.read_at) {
          const readTime = new Date(n.read_at).getTime() - new Date(n.delivered_at).getTime();
          acc.totalReadTime += readTime;
          acc.readCount++;
        }

        return acc;
      },
      {
        hourCounts: {} as Record<number, number>,
        totalReadTime: 0,
        readCount: 0,
      }
    );

    // Calculate trends
    const dailyTrends = notifications.reduce((acc, n) => {
      const date = new Date(n.delivered_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, errors: 0, warnings: 0 };
      }
      acc[date].total++;
      if (n.severity === 'error') acc[date].errors++;
      if (n.severity === 'warning') acc[date].warnings++;
      return acc;
    }, {} as Record<string, { total: number; errors: number; warnings: number }>);

    // Process weekly trends
    const weeklyTrends = notifications.reduce((acc, n) => {
      const date = new Date(n.delivered_at);
      const week = `${date.getFullYear()}-W${Math.ceil(
        (date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7
      )}`;
      
      if (!acc[week]) {
        acc[week] = { total: 0, errors: 0, read: 0 };
      }
      acc[week].total++;
      if (n.severity === 'error') acc[week].errors++;
      if (n.read_at) acc[week].read++;
      return acc;
    }, {} as Record<string, { total: number; errors: number; read: number }>);

    // Find peak and quiet hours
    const hourEntries = Object.entries(timeStats.hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }));
    hourEntries.sort((a, b) => b.count - a.count);
    const peakHours = hourEntries.slice(0, 3).map(h => h.hour);
    const quietHours = hourEntries.slice(-3).map(h => h.hour);

    return {
      totalCount: total,
      unreadCount: unread,
      readRate,
      channelStats: Object.entries(channelStats).reduce(
        (acc, [channel, stats]) => ({
          ...acc,
          [channel]: {
            count: stats.count,
            percentage: (stats.count / total) * 100,
            errorRate: (stats.errors / stats.total) * 100,
          },
        }),
        {}
      ),
      severityStats: {
        error: {
          count: severityStats.error.count,
          percentage: (severityStats.error.count / total) * 100,
          avgReadTime:
            severityStats.error.readCount > 0
              ? severityStats.error.totalReadTime / severityStats.error.readCount
              : 0,
        },
        warning: {
          count: severityStats.warning.count,
          percentage: (severityStats.warning.count / total) * 100,
          avgReadTime:
            severityStats.warning.readCount > 0
              ? severityStats.warning.totalReadTime / severityStats.warning.readCount
              : 0,
        },
      },
      timeStats: {
        avgReadTime:
          timeStats.readCount > 0 ? timeStats.totalReadTime / timeStats.readCount : 0,
        avgResponseTime:
          timeStats.readCount > 0 ? timeStats.totalReadTime / timeStats.readCount : 0,
        peakHours,
        quietHours,
      },
      trends: {
        daily: Object.entries(dailyTrends)
          .map(([date, stats]) => ({
            date,
            ...stats,
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        weekly: Object.entries(weeklyTrends)
          .map(([week, stats]) => ({
            week,
            total: stats.total,
            errorRate: (stats.errors / stats.total) * 100,
            readRate: (stats.read / stats.total) * 100,
          }))
          .sort((a, b) => a.week.localeCompare(b.week)),
      },
    };
  }, [notifications]);
}
