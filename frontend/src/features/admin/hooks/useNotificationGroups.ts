import { useMemo } from 'react';
import { BatchAlert } from '@/types/alerts';

type GroupBy = 'severity' | 'channel' | 'date' | 'status';

interface GroupedNotifications {
  [key: string]: BatchAlert[];
}

export function useNotificationGroups(notifications: BatchAlert[], groupBy: GroupBy) {
  return useMemo(() => {
    const groups: GroupedNotifications = {};

    notifications.forEach(notification => {
      let key: string;

      switch (groupBy) {
        case 'severity':
          key = notification.severity;
          break;

        case 'channel':
          // For notifications sent through multiple channels, create separate groups
          notification.channels.forEach(channel => {
            if (!groups[channel]) {
              groups[channel] = [];
            }
            groups[channel].push(notification);
          });
          return;

        case 'date':
          // Group by date (ignoring time)
          key = new Date(notification.delivered_at).toLocaleDateString();
          break;

        case 'status':
          key = notification.read_at ? 'Read' : 'Unread';
          break;

        default:
          key = 'Other';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    // Sort groups by size (descending) and date (newest first)
    return Object.entries(groups)
      .sort(([keyA, groupA], [keyB, groupB]) => {
        // First sort by group size
        const sizeDiff = groupB.length - groupA.length;
        if (sizeDiff !== 0) return sizeDiff;

        // Then by date (for date groups)
        if (groupBy === 'date') {
          return new Date(keyB).getTime() - new Date(keyA).getTime();
        }

        // Then alphabetically
        return keyA.localeCompare(keyB);
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as GroupedNotifications);
  }, [notifications, groupBy]);
}

export function getGroupLabel(groupName: string, count: number, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'severity':
      return `${groupName.charAt(0).toUpperCase() + groupName.slice(1)} (${count})`;

    case 'channel':
      return `${groupName} Channel (${count})`;

    case 'date':
      const date = new Date(groupName);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return `Today (${count})`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday (${count})`;
      }
      return `${groupName} (${count})`;

    case 'status':
      return `${groupName} (${count})`;

    default:
      return `${groupName} (${count})`;
  }
}

export function getGroupIcon(groupName: string, groupBy: GroupBy) {
  switch (groupBy) {
    case 'severity':
      return groupName.toLowerCase() === 'error' ? 'error' : 'warning';

    case 'channel':
      switch (groupName.toLowerCase()) {
        case 'email':
          return 'email';
        case 'slack':
          return 'message';
        case 'push':
          return 'notifications';
        default:
          return 'send';
      }

    case 'status':
      return groupName.toLowerCase() === 'read' ? 'mark_email_read' : 'mark_email_unread';

    case 'date':
      return 'calendar_today';

    default:
      return 'folder';
  }
}
