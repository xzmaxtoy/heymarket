import React, { useState, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import BatchMetrics from './BatchMetrics';
import BatchAlerts from './BatchAlerts';
import NotificationHistory from './NotificationHistory';
import { BatchAnalytics } from '@/types/batch';
import { useBatchMetrics } from '../hooks/useBatchMetrics';
import { useBatchAlerts } from '../hooks/useBatchAlerts';
import { getNotificationPreferences, getAdminEmails, getSlackWebhooks } from '@/services/settings';
import { notifyAdminsOfAlert } from '@/services/notifications';
import { notifyAllChannels } from '@/services/slackNotifications';
import { useAppSelector } from '@/store';
import { BatchAlert } from '@/types/alerts';

export default function SystemMonitor() {
  const userId = useAppSelector(state => state.auth.user?.id);
  const { analytics } = useBatchMetrics({
    timeRange: 24,
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  const handleNewAlert = useCallback(async (alert: BatchAlert) => {
    try {
      if (userId) {
        const [preferences, adminEmails, slackWebhooks] = await Promise.all([
          getNotificationPreferences(userId),
          getAdminEmails(),
          getSlackWebhooks()
        ]);
        
        if (preferences.email && adminEmails.length > 0) {
          await notifyAdminsOfAlert(alert, adminEmails);
        }
        
        if (preferences.slack && slackWebhooks.length > 0) {
          await notifyAllChannels(alert, slackWebhooks);
        }
      }
    } catch (error) {
      console.error('Failed to send alert notifications:', error);
    }
  }, [userId]);

  const { alerts, acknowledgeAlert, dismissAlert } = useBatchAlerts({
    analytics,
    onNewAlert: handleNewAlert
  });

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <BatchMetrics />
        </Grid>
        {analytics && (
          <Grid item xs={12}>
            <BatchAlerts
              analytics={analytics}
              onAcknowledge={acknowledgeAlert}
              onDismiss={dismissAlert}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <NotificationHistory />
        </Grid>
      </Grid>
    </Box>
  );
}
