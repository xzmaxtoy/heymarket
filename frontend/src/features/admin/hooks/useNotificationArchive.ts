import { useState, useCallback } from 'react';
import { BatchAlert } from '@/types/alerts';

interface ArchiveConfig {
  before?: Date;
  severity?: ('error' | 'warning')[];
  channels?: string[];
  status?: ('read' | 'unread')[];
}

interface UseNotificationArchiveResult {
  archiving: boolean;
  progress: number;
  error: string | null;
  archiveNotifications: (notifications: BatchAlert[], config?: ArchiveConfig) => Promise<void>;
  archiveSelectedNotifications: (notifications: BatchAlert[], selectedIds: string[]) => Promise<void>;
  cancelArchiving: () => void;
}

export function useNotificationArchive(): UseNotificationArchiveResult {
  const [archiving, setArchiving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cancelToken, setCancelToken] = useState<boolean>(false);

  const archiveNotifications = useCallback(async (notifications: BatchAlert[], config?: ArchiveConfig) => {
    setArchiving(true);
    setProgress(0);
    setError(null);
    setCancelToken(false);

    try {
      const toArchive = notifications.filter(notification => {
        if (cancelToken) return false;

        if (config?.before && new Date(notification.delivered_at) > config.before) {
          return false;
        }

        if (config?.severity?.length && !config.severity.includes(notification.severity)) {
          return false;
        }

        if (config?.channels?.length && !notification.channels.some(channel => config.channels?.includes(channel))) {
          return false;
        }

        if (config?.status?.length) {
          const isRead = !!notification.read_at;
          const wantsRead = config.status.includes('read');
          const wantsUnread = config.status.includes('unread');
          if ((wantsRead && !isRead) || (wantsUnread && isRead)) {
            return false;
          }
        }

        return true;
      });

      const total = toArchive.length;
      let completed = 0;

      for (const notification of toArchive) {
        if (cancelToken) break;

        try {
          // Simulate archiving - replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 100));
          completed++;
          setProgress((completed / total) * 100);
        } catch (err) {
          console.error('Failed to archive notification:', err);
          // Continue with next notification
        }
      }

      if (!cancelToken) {
        setProgress(100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive notifications');
    } finally {
      setArchiving(false);
      setCancelToken(false);
    }
  }, []);

  const archiveSelectedNotifications = useCallback(async (notifications: BatchAlert[], selectedIds: string[]) => {
    const selectedNotifications = notifications.filter(n => selectedIds.includes(n.id));
    await archiveNotifications(selectedNotifications);
  }, [archiveNotifications]);

  const cancelArchiving = useCallback(() => {
    setCancelToken(true);
  }, []);

  return {
    archiving,
    progress,
    error,
    archiveNotifications,
    archiveSelectedNotifications,
    cancelArchiving,
  };
}
