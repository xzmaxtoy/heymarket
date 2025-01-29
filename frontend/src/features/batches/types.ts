import { Template } from '../templates/types';
import { Customer } from '@/types/customer';

export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Batch {
  id: string;
  name: string;
  template_id: string | null;
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

export interface BatchLog {
  id: string;
  batch_id: string;
  date_utc: string;
  targets: string;
  status: string | null;
  message: string;
  error: string | null;
  variables: Record<string, any> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BatchPreview {
  customer: Customer;
  message: string;
  variables: Record<string, string>;
}

export interface BatchCreationStep {
  template: Template | null;
  customers: Customer[];
  variables: Record<string, string>;
  scheduledFor: string | null;
  name: string;
}

export interface BatchCreationState extends BatchCreationStep {
  currentStep: number;
  isValid: boolean;
  errors: Record<string, string>;
}

export interface BatchFilter {
  search?: string;
  status?: BatchStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: keyof Batch;
  sortOrder?: 'asc' | 'desc';
}

export interface BatchStats {
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
  averageDeliveryTime: number;
  successRate: number;
}

// Constants
export const BATCH_STEPS = [
  'Select Template',
  'Review Customers',
  'Configure Variables',
  'Schedule Delivery',
  'Preview & Confirm',
] as const;

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const BATCH_STATUS_COLORS: Record<BatchStatus, string> = {
  pending: 'info',
  processing: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
};

// Validation
export const BATCH_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  template: {
    required: true,
  },
  customers: {
    required: true,
    minCount: 1,
    maxCount: 1000, // Adjust based on your requirements
  },
  scheduledFor: {
    required: false,
    minDate: new Date(), // Cannot schedule in the past
  },
};

// Error messages
export const BATCH_ERROR_MESSAGES = {
  name: {
    required: 'Batch name is required',
    minLength: 'Batch name must not be empty',
    maxLength: 'Batch name must be less than 100 characters',
  },
  template: {
    required: 'Please select a template',
  },
  customers: {
    required: 'Please select at least one customer',
    minCount: 'Please select at least one customer',
    maxCount: 'Maximum 1000 customers allowed per batch',
  },
  scheduledFor: {
    minDate: 'Cannot schedule batch in the past',
  },
};