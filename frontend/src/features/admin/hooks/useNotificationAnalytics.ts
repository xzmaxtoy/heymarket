import { useMemo } from 'react';
import { BatchAlert } from '@/types/alerts';

interface NotificationTrend {
  date: string;
  total: number;
  error: number;
  warning: number;
  read: number;
  unread: number;
}

interface ChannelMetrics {
  channel: string;
  total: number;
  errorRate: number;
  readRate: number;
  avgResponseTime: number;
  trend: {
    date: string;
    count: number;
  }[];
}

interface UserInteractionMetrics {
  readRate: number;
  averageReadTime: number;
  peakActivityHours: {
    hour: number;
    count: number;
  }[];
  interactionsByDay: {
    day: string;
    reads: number;
    responses: number;
  }[];
}

interface NotificationAnalytics {
  trends: NotificationTrend[];
  channelMetrics: ChannelMetrics[];
  userInteractions: UserInteractionMetrics;
  volumeByHour: {
    hour: number;
    count: number;
  }[];
  topErrorChannels: {
    channel: string;
    errorCount: number;
    errorRate: number;
  }[];
  deliverySuccess: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
}

function groupByDate(notifications: BatchAlert[]): Map<string, BatchAlert[]> {
  const groups = new Map<string, BatchAlert[]>();
  
  notifications.forEach(notification => {
    const date = new Date(notification.delivered_at).toISOString().split('T')[0];
    const group = groups.get(date) || [];
    group.push(notification);
    groups.set(date, group);
  });

  return groups;
}

function calculateTrends(dateGroups: Map<string, BatchAlert[]>): NotificationTrend[] {
  return Array.from(dateGroups.entries())
    .map(([date, notifications]) => ({
      date,
      total: notifications.length,
      error: notifications.filter(n => n.severity === 'error').length,
      warning: notifications.filter(n => n.severity === 'warning').length,
      read: notifications.filter(n => n.read_at).length,
      unread: notifications.filter(n => !n.read_at).length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateChannelMetrics(
  notifications: BatchAlert[],
  dateGroups: Map<string, BatchAlert[]>
): ChannelMetrics[] {
  const channelMap = new Map<string, {
    total: number;
    errors: number;
    read: number;
    totalResponseTime: number;
    readCount: number;
    trend: Map<string, number>;
  }>();

  notifications.forEach(notification => {
    notification.channels.forEach(channel => {
      const stats = channelMap.get(channel) || {
        total: 0,
        errors: 0,
        read: 0,
        totalResponseTime: 0,
        readCount: 0,
        trend: new Map<string, number>(),
      };

      stats.total++;
      if (notification.severity === 'error') stats.errors++;
      if (notification.read_at) {
        stats.read++;
        stats.totalResponseTime += new Date(notification.read_at).getTime() -
          new Date(notification.delivered_at).getTime();
        stats.readCount++;
      }

      const date = new Date(notification.delivered_at).toISOString().split('T')[0];
      stats.trend.set(date, (stats.trend.get(date) || 0) + 1);

      channelMap.set(channel, stats);
    });
  });

  return Array.from(channelMap.entries()).map(([channel, stats]) => ({
    channel,
    total: stats.total,
    errorRate: (stats.errors / stats.total) * 100,
    readRate: (stats.read / stats.total) * 100,
    avgResponseTime: stats.readCount ? stats.totalResponseTime / stats.readCount / 1000 / 60 : 0, // in minutes
    trend: Array.from(stats.trend.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }));
}

function calculateUserInteractions(notifications: BatchAlert[]): UserInteractionMetrics {
  const readNotifications = notifications.filter(n => n.read_at);
  const totalReadTime = readNotifications.reduce((acc, n) => {
    return acc + (new Date(n.read_at!).getTime() - new Date(n.delivered_at).getTime());
  }, 0);

  const activityByHour = new Array(24).fill(0);
  const interactionsByDay = new Map<string, { reads: number; responses: number }>();

  notifications.forEach(notification => {
    const hour = new Date(notification.delivered_at).getHours();
    activityByHour[hour]++;

    const day = new Date(notification.delivered_at).toISOString().split('T')[0];
    const dayStats = interactionsByDay.get(day) || { reads: 0, responses: 0 };
    if (notification.read_at) dayStats.reads++;
    // Assuming a response is tracked somewhere in the notification object
    // dayStats.responses++;
    interactionsByDay.set(day, dayStats);
  });

  return {
    readRate: (readNotifications.length / notifications.length) * 100,
    averageReadTime: readNotifications.length ? totalReadTime / readNotifications.length / 1000 / 60 : 0,
    peakActivityHours: activityByHour.map((count, hour) => ({ hour, count })),
    interactionsByDay: Array.from(interactionsByDay.entries())
      .map(([day, stats]) => ({ day, ...stats }))
      .sort((a, b) => a.day.localeCompare(b.day)),
  };
}

export function useNotificationAnalytics(notifications: BatchAlert[]): NotificationAnalytics {
  return useMemo(() => {
    const dateGroups = groupByDate(notifications);
    const trends = calculateTrends(dateGroups);
    const channelMetrics = calculateChannelMetrics(notifications, dateGroups);

    // Calculate volume by hour
    const volumeByHour = new Array(24).fill(0).map((_, hour) => ({
      hour,
      count: notifications.filter(n => new Date(n.delivered_at).getHours() === hour).length,
    }));

    // Calculate top error channels
    const topErrorChannels = channelMetrics
      .map(({ channel, total, errorRate }) => ({
        channel,
        errorCount: Math.round((errorRate * total) / 100),
        errorRate,
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);

    // Calculate delivery success metrics
    const deliverySuccess = {
      total: notifications.length,
      successful: notifications.filter(n => n.delivered_at).length,
      failed: notifications.filter(n => !n.delivered_at).length,
      successRate: (notifications.filter(n => n.delivered_at).length / notifications.length) * 100,
    };

    return {
      trends,
      channelMetrics,
      userInteractions: calculateUserInteractions(notifications),
      volumeByHour,
      topErrorChannels,
      deliverySuccess,
    };
  }, [notifications]);
}
