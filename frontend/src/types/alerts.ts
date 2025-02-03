export interface BatchAlert {
  id: string;
  message: string;
  severity: 'error' | 'warning';
  timestamp: string;
  acknowledged: boolean;
  metric: string;
  value: number;
  threshold: number;
  channels: string[];
  delivered_at: string;
  read_at?: string;
}

export interface AlertThreshold {
  metric: string;
  condition: 'above' | 'below';
  value: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface AlertNotificationConfig {
  enabled: boolean;
  emailNotifications: boolean;
  adminEmails: string[];
  slackWebhook?: string;
  alertThresholds: AlertThreshold[];
}

export interface AlertNotificationPreferences {
  userId: string;
  email: boolean;
  slack: boolean;
  pushNotifications: boolean;
  thresholds: {
    success_rate: number;
    error_rate: number;
    credits_used: number;
  };
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    metric: 'success_rate',
    condition: 'below',
    value: 95,
    severity: 'error',
    message: 'Success rate has dropped below 95%',
  },
  {
    metric: 'error_rate',
    condition: 'above',
    value: 5,
    severity: 'error',
    message: 'Error rate exceeds 5%',
  },
  {
    metric: 'credits_used',
    condition: 'above',
    value: 1000,
    severity: 'warning',
    message: 'High credit usage detected',
  },
];
