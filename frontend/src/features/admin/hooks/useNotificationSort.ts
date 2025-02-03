import { useMemo } from 'react';
import { BatchAlert } from '@/types/alerts';

export type SortField = 'date' | 'severity' | 'channel' | 'status';
export type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export function useNotificationSort(notifications: BatchAlert[], sortConfig: SortConfig) {
  return useMemo(() => {
    const sortedNotifications = [...notifications];
    
    sortedNotifications.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'date':
          comparison = new Date(a.delivered_at).getTime() - new Date(b.delivered_at).getTime();
          break;

        case 'severity':
          // Sort errors before warnings
          comparison = a.severity === 'error' ? -1 : b.severity === 'error' ? 1 : 0;
          break;

        case 'channel':
          // Sort by first channel in the list
          comparison = (a.channels[0] || '').localeCompare(b.channels[0] || '');
          break;

        case 'status':
          // Sort read/unread
          const aRead = !!a.read_at;
          const bRead = !!b.read_at;
          comparison = aRead === bRead ? 0 : aRead ? 1 : -1;
          break;

        default:
          comparison = 0;
      }

      // Apply sort order
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    return sortedNotifications;
  }, [notifications, sortConfig.field, sortConfig.order]);
}

export function getSortIcon(field: SortField, currentField: SortField, order: SortOrder): string {
  if (field !== currentField) return 'sort';
  return order === 'asc' ? 'arrow_upward' : 'arrow_downward';
}

export function getNextSortOrder(field: SortField, currentField: SortField, currentOrder: SortOrder): SortOrder {
  if (field !== currentField) return 'desc';
  return currentOrder === 'asc' ? 'desc' : 'asc';
}

export function getSortButtonLabel(field: SortField, currentField: SortField, order: SortOrder): string {
  const direction = field === currentField ? (order === 'asc' ? 'ascending' : 'descending') : 'descending';
  return `Sort by ${field} ${direction}`;
}
