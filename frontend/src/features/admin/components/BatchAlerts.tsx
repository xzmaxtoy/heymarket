import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { BatchAnalytics } from '@/types/batch';

interface AlertThreshold {
  metric: keyof BatchAnalytics | string;
  condition: 'above' | 'below';
  value: number;
  severity: 'error' | 'warning';
  message: string;
}

const ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    metric: 'success_rate',
    condition: 'below',
    value: 95,
    severity: 'error',
    message: 'Success rate has dropped below 95%',
  },
  {
    metric: 'failed',
    condition: 'above',
    value: 100,
    severity: 'error',
    message: 'High number of failed messages',
  },
  {
    metric: 'credits_used',
    condition: 'above',
    value: 1000,
    severity: 'warning',
    message: 'High credit usage detected',
  },
  {
    metric: 'error_rate',
    condition: 'above',
    value: 5,
    severity: 'error',
    message: 'Error rate exceeds 5%',
  },
];

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

interface BatchAlertsProps {
  analytics: BatchAnalytics;
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

interface AlertWithMetadata extends BatchAlert {
  channels: string[];
  delivered_at: string;
  read_at?: string;
}

function enrichAlert(alert: BatchAlert): AlertWithMetadata {
  return {
    ...alert,
    channels: ['system'],
    delivered_at: alert.timestamp,
    read_at: alert.acknowledged ? alert.timestamp : undefined,
  };
}

export default function BatchAlerts({ analytics, onAcknowledge, onDismiss }: BatchAlertsProps) {
  const checkThresholds = (analytics: BatchAnalytics): AlertWithMetadata[] => {
    return ALERT_THRESHOLDS.filter(threshold => {
      const value = analytics[threshold.metric as keyof BatchAnalytics] as number;
      return threshold.condition === 'above' ? value > threshold.value : value < threshold.value;
    }).map(threshold => enrichAlert({
      id: `${threshold.metric}-${Date.now()}`,
      message: threshold.message,
      severity: threshold.severity,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metric: threshold.metric,
      value: analytics[threshold.metric as keyof BatchAnalytics] as number,
      threshold: threshold.value,
    }));
  };

  const activeAlerts = checkThresholds(analytics);

  if (activeAlerts.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <CheckIcon color="success" />
          <Typography>All systems operating normally</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Active Alerts</Typography>
        <Chip
          label={`${activeAlerts.length} ${activeAlerts.length === 1 ? 'Alert' : 'Alerts'}`}
          color={activeAlerts.some(a => a.severity === 'error') ? 'error' : 'warning'}
        />
      </Box>
      <List>
        {activeAlerts.map((alert) => (
          <ListItem key={alert.id} sx={{ display: 'block', mb: 2 }}>
            <Alert
              severity={alert.severity}
              icon={alert.severity === 'error' ? <ErrorIcon /> : <WarningIcon />}
              action={
                <Box>
                  {!alert.acknowledged && (
                    <IconButton
                      aria-label="acknowledge"
                      color="inherit"
                      size="small"
                      onClick={() => onAcknowledge(alert.id)}
                      sx={{ mr: 1 }}
                    >
                      <CheckIcon fontSize="inherit" />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label="dismiss"
                    color="inherit"
                    size="small"
                    onClick={() => onDismiss(alert.id)}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                </Box>
              }
              sx={{ width: '100%' }}
            >
              <AlertTitle>
                {alert.severity === 'error' ? 'Error Alert' : 'Warning Alert'}
                {alert.acknowledged && (
                  <Chip
                    label="Acknowledged"
                    size="small"
                    color="default"
                    sx={{ ml: 1 }}
                  />
                )}
              </AlertTitle>
              <Typography paragraph>{alert.message}</Typography>
              <Box display="flex" gap={2}>
                <Chip
                  label={`Current: ${alert.value.toFixed(1)}`}
                  size="small"
                  color={alert.severity}
                  variant="outlined"
                />
                <Chip
                  label={`Threshold: ${alert.threshold}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={new Date(alert.timestamp).toLocaleString()}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Alert>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
