import { Customer } from './customer';
import { Template } from './template';

export interface BatchCustomerData {
  customer: Customer;
  variables: Record<string, string>;
  overrides?: {
    isPrivate?: boolean;
    author?: string;
  };
}

export interface BatchCreationConfig {
  templateId: string;
  customers: BatchCustomerData[];
  scheduleFor?: string;
  name: string;
  priority: 'high' | 'normal' | 'low';
  userId?: string;
}

export interface BatchStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    processing: number;
  };
  timing: {
    created: string;
    started?: string;
    completed?: string;
    estimated_completion?: string;
  };
  metrics: {
    messages_per_second: number;
    success_rate: number;
    credits_used: number;
  };
  errors: {
    categories: Record<string, number>;
    samples: BatchError[];
  };
}

export interface BatchError {
  phoneNumber: string;
  error: string;
  category: string;
  timestamp: string;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export interface BatchPreview {
  template: Template;
  messages: {
    phoneNumber: string;
    content: string;
    variables: Record<string, string>;
  }[];
}

export interface BatchAnalytics {
  total_messages: number;
  completed: number;
  failed: number;
  success_rate: number;
  error_rate: number;
  credits_used: number;
  error_categories: Record<string, number>;
  error_samples: BatchError[];
  trends?: {
    timestamp: string;
    message_volume: number;
    success_rate: number;
    error_rate: number;
  }[];
}
