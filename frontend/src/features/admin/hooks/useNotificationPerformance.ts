import { useMemo } from 'react';
import { BatchAlert } from '@/types/alerts';

interface SLAConfig {
  warning: number; // minutes
  critical: number; // minutes
}

interface SLAMetrics {
  totalCount: number;
  withinSLA: number;
  atRisk: number;
  breached: number;
  averageResponseTime: number;
  percentageWithinSLA: number;
  longestResponseTime: number;
  shortestResponseTime: number;
  slaBreachTrend: {
    date: string;
    count: number;
  }[];
}

interface ChannelPerformance {
  channel: string;
  totalCount: number;
  averageResponseTime: number;
  slaBreachCount: number;
  slaBreachPercentage: number;
}

interface NotificationPerformanceResult {
  slaMetrics: SLAMetrics;
  channelPerformance: ChannelPerformance[];
  topBreachedChannels: string[];
  responseTimeDistribution: {
    range: string;
    count: number;
  }[];
  peakBreachHours: {
    hour: number;
    count: number;
  }[];
}

const defaultSLAConfig: SLAConfig = {
  warning: 15, // 15 minutes
  critical: 30, // 30 minutes
};

function calculateSLABreachTrend(
  responseTimes: { notification: BatchAlert; responseTime: number }[],
  config: SLAConfig
): { date: string; count: number }[] {
  const breachesByDate = new Map<string, number>();
  
  responseTimes.forEach(({ notification, responseTime }) => {
    if (responseTime > config.critical) {
      const date = new Date(notification.delivered_at).toISOString().split('T')[0];
      breachesByDate.set(date, (breachesByDate.get(date) || 0) + 1);
    }
  });

  return Array.from(breachesByDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateResponseTimeDistribution(
  responseTimes: { responseTime: number }[]
): { range: string; count: number }[] {
  const ranges = [
    { max: 5, label: '0-5 min' },
    { max: 15, label: '5-15 min' },
    { max: 30, label: '15-30 min' },
    { max: 60, label: '30-60 min' },
    { max: Infinity, label: '60+ min' },
  ];

  const distribution = ranges.map(range => ({
    range: range.label,
    count: responseTimes.filter(({ responseTime }) => 
      responseTime <= range.max && 
      (range.max === ranges[0].max || responseTime > ranges[ranges.indexOf(range) - 1].max)
    ).length,
  }));

  return distribution;
}

function calculatePeakBreachHours(
  responseTimes: { notification: BatchAlert; responseTime: number }[],
  config: SLAConfig
): { hour: number; count: number }[] {
  const breachesByHour = new Array(24).fill(0);

  responseTimes.forEach(({ notification, responseTime }) => {
    if (responseTime > config.critical) {
      const hour = new Date(notification.delivered_at).getHours();
      breachesByHour[hour]++;
    }
  });

  return breachesByHour.map((count, hour) => ({ hour, count }));
}

export function useNotificationPerformance(
  notifications: BatchAlert[],
  config: SLAConfig = defaultSLAConfig
): NotificationPerformanceResult {
  return useMemo(() => {
    const now = new Date();
    const responseTimes = notifications.map(notification => {
      const deliveredAt = new Date(notification.delivered_at);
      const readAt = notification.read_at ? new Date(notification.read_at) : now;
      return {
        notification,
        responseTime: (readAt.getTime() - deliveredAt.getTime()) / (1000 * 60), // in minutes
      };
    });

    // Calculate SLA metrics
    const slaMetrics: SLAMetrics = {
      totalCount: notifications.length,
      withinSLA: responseTimes.filter(({ responseTime }) => responseTime <= config.warning).length,
      atRisk: responseTimes.filter(({ responseTime }) => 
        responseTime > config.warning && responseTime <= config.critical
      ).length,
      breached: responseTimes.filter(({ responseTime }) => responseTime > config.critical).length,
      averageResponseTime: responseTimes.reduce((acc, { responseTime }) => acc + responseTime, 0) / notifications.length || 0,
      percentageWithinSLA: (responseTimes.filter(({ responseTime }) => 
        responseTime <= config.warning
      ).length / notifications.length) * 100 || 0,
      longestResponseTime: Math.max(...responseTimes.map(({ responseTime }) => responseTime), 0),
      shortestResponseTime: Math.min(...responseTimes.map(({ responseTime }) => responseTime), 0),
      slaBreachTrend: calculateSLABreachTrend(responseTimes, config),
    };

    // Calculate channel performance
    const channelMap = new Map<string, {
      totalCount: number;
      totalResponseTime: number;
      breachCount: number;
    }>();

    responseTimes.forEach(({ notification, responseTime }) => {
      notification.channels.forEach(channel => {
        const stats = channelMap.get(channel) || {
          totalCount: 0,
          totalResponseTime: 0,
          breachCount: 0,
        };
        stats.totalCount++;
        stats.totalResponseTime += responseTime;
        if (responseTime > config.critical) {
          stats.breachCount++;
        }
        channelMap.set(channel, stats);
      });
    });

    const channelPerformance: ChannelPerformance[] = Array.from(channelMap.entries())
      .map(([channel, stats]) => ({
        channel,
        totalCount: stats.totalCount,
        averageResponseTime: stats.totalResponseTime / stats.totalCount,
        slaBreachCount: stats.breachCount,
        slaBreachPercentage: (stats.breachCount / stats.totalCount) * 100,
      }))
      .sort((a, b) => b.slaBreachCount - a.slaBreachCount);

    // Calculate top breached channels
    const topBreachedChannels = channelPerformance
      .filter(channel => channel.slaBreachCount > 0)
      .sort((a, b) => b.slaBreachPercentage - a.slaBreachPercentage)
      .slice(0, 5)
      .map(channel => channel.channel);

    // Calculate response time distribution
    const responseTimeDistribution = calculateResponseTimeDistribution(responseTimes);

    // Calculate peak breach hours
    const peakBreachHours = calculatePeakBreachHours(responseTimes, config);

    return {
      slaMetrics,
      channelPerformance,
      topBreachedChannels,
      responseTimeDistribution,
      peakBreachHours,
    };
  }, [notifications, config]);
}
