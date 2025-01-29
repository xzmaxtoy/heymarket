import { Template } from '@/features/templates/types';
import { Customer } from '@/types/customer';
import { Dayjs } from 'dayjs';
import { ChipProps } from '@mui/material';

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

type ChipColor = NonNullable<ChipProps['color']>;

export const BATCH_STATUS_COLORS: Record<BatchStatus, ChipColor> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
} as const;

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
} as const;

export interface Batch {
  id: string;
  name: string;
  template_id: string;
  status: BatchStatus;
  total_recipients: number;
  completed_count: number;
  failed_count: number;
  external_batch_id: string | null;
  scheduled_for: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchFilter {
  search?: string;
  status?: BatchStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BatchStats {
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
  successRate: number;
  averageDeliveryTime: number;
}

export interface BatchCreationState {
  name: string;
  template: Template | null;
  scheduledFor: Dayjs | null;
  customers: Customer[];
  variables: Record<string, string>;
}

export interface BatchPagination {
  currentPage: number;
  pageSize: number;
  total: number;
}