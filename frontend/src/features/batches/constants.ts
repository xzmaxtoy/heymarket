import { BatchStatus } from './types';

export const BATCH_STATUS_COLORS: Record<BatchStatus, string> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
};

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const BATCH_STATUS_OPTIONS = Object.entries(BATCH_STATUS_LABELS).map(([value, label]) => ({
  value: value as BatchStatus,
  label,
}));