export interface BatchProgress {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface BatchTiming {
  created: string;
  started: string | null;
  estimated_completion: string | null;
}

export interface BatchMetrics {
  messages_per_second: number;
  success_rate: number;
  credits_used: number;
}

export interface ErrorSample {
  phoneNumber: string;
  error: string;
  category: string;
  status?: number;
  rateLimitInfo?: {
    limit?: string;
    remaining?: string;
    reset?: string;
  };
  timestamp: string;
}

export interface BatchErrors {
  categories: Record<string, number>;
  samples: ErrorSample[];
}

export interface BatchAnalytics {
  batchId: string;
  progress: BatchProgress;
  timing: BatchTiming;
  metrics: BatchMetrics;
  errors: BatchErrors;
}

export interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
  };
  status?: string[];
  errorTypes?: string[];
}

export interface SystemMetrics {
  activeConnections: number;
  queueSize: number;
  avgResponseTime: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface AnalyticsState {
  batchAnalytics: BatchAnalytics[];
  systemMetrics: SystemMetrics;
  filters: AnalyticsFilters;
  isLoading: boolean;
  error: string | null;
}

export interface TrendData {
  timestamp: string;
  value: number;
}

export interface TrendMetrics {
  successRate: TrendData[];
  messageVolume: TrendData[];
  errorRate: TrendData[];
  responseTime: TrendData[];
}
