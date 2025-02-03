import { useState, useEffect, useCallback } from 'react';
import { BatchAnalytics } from '@/types/batch';

interface BatchAlert {
  id: string;
  message: string;
  severity: 'error' | 'warning';
  timestamp: string;
  acknowledged: boolean;
  metric: string;
  value: number;
  threshold: number;
}

interface UseBatchAlertsOptions {
  analytics: BatchAnalytics | null;
  onNewAlert?: (alert: BatchAlert) => void;
}

export function useBatchAlerts({ analytics, onNewAlert }: UseBatchAlertsOptions) {
  const [alerts, setAlerts] = useState<BatchAlert[]>([]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(currentAlerts =>
      currentAlerts.map(alert =>
        alert.id === alertId
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(currentAlerts =>
      currentAlerts.filter(alert => alert.id !== alertId)
    );
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Store alerts in localStorage to persist across page reloads
  useEffect(() => {
    const storedAlerts = localStorage.getItem('batchAlerts');
    if (storedAlerts) {
      try {
        const parsedAlerts = JSON.parse(storedAlerts);
        setAlerts(parsedAlerts);
      } catch (error) {
        console.error('Failed to parse stored alerts:', error);
        localStorage.removeItem('batchAlerts');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('batchAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Clean up old alerts (older than 24 hours)
  useEffect(() => {
    const cleanup = () => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      setAlerts(currentAlerts =>
        currentAlerts.filter(alert => {
          const alertTime = new Date(alert.timestamp);
          return alertTime > twentyFourHoursAgo || !alert.acknowledged;
        })
      );
    };

    cleanup();
    const interval = setInterval(cleanup, 60 * 60 * 1000); // Run cleanup every hour
    return () => clearInterval(interval);
  }, []);

  // Check for new alerts when analytics change
  useEffect(() => {
    if (!analytics) return;

    const checkThresholds = () => {
      const newAlerts: BatchAlert[] = [];

      // Check success rate
      if (analytics.success_rate < 95) {
        newAlerts.push({
          id: `success-rate-${Date.now()}`,
          message: 'Success rate has dropped below 95%',
          severity: 'error',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          metric: 'success_rate',
          value: analytics.success_rate,
          threshold: 95,
        });
      }

      // Check error rate
      if (analytics.error_rate > 5) {
        newAlerts.push({
          id: `error-rate-${Date.now()}`,
          message: 'Error rate exceeds 5%',
          severity: 'error',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          metric: 'error_rate',
          value: analytics.error_rate,
          threshold: 5,
        });
      }

      // Check credit usage
      if (analytics.credits_used > 1000) {
        newAlerts.push({
          id: `credits-${Date.now()}`,
          message: 'High credit usage detected',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          metric: 'credits_used',
          value: analytics.credits_used,
          threshold: 1000,
        });
      }

      // Add new alerts and notify
      if (newAlerts.length > 0) {
        setAlerts(currentAlerts => [...currentAlerts, ...newAlerts]);
        newAlerts.forEach(alert => onNewAlert?.(alert));
      }
    };

    checkThresholds();
  }, [analytics, onNewAlert]);

  return {
    alerts,
    acknowledgeAlert,
    dismissAlert,
    clearAlerts,
  };
}
