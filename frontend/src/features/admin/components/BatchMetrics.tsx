import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BatchAnalytics } from '@/types/batch';
import { useBatchMetrics } from '../hooks/useBatchMetrics';
import { useBatchAlerts } from '../hooks/useBatchAlerts';
import { notifyAdminsOfAlert } from '@/services/notifications';
import { notifyAllChannels } from '@/services/slackNotifications';
import BatchAlerts from './BatchAlerts';
import { useAppSelector } from '@/store';
import { BatchAlert } from '@/types/alerts';
import { getNotificationPreferences, getAdminEmails, getSlackWebhooks } from '@/services/settings';

interface TimeRange {
  label: string;
  value: number; // hours
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Last 24 Hours', value: 24 },
  { label: 'Last 7 Days', value: 168 },
  { label: 'Last 30 Days', value: 720 },
];


export default function BatchMetrics() {
  const [timeRange, setTimeRange] = useState<number>(24);
  const { loading, error, analytics, refresh } = useBatchMetrics({
    timeRange,
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  const userId = useAppSelector(state => state.auth.user?.id);

  const handleNewAlert = useCallback(async (alert: BatchAlert) => {
    try {
      // Get user notification preferences and system settings
      if (userId) {
        const [preferences, adminEmails, slackWebhooks] = await Promise.all([
          getNotificationPreferences(userId),
          getAdminEmails(),
          getSlackWebhooks()
        ]);
        
        // Send email notifications if enabled
        if (preferences.email && adminEmails.length > 0) {
          await notifyAdminsOfAlert(alert, adminEmails);
        }
        
        // Send Slack notifications if enabled
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

  const MetricCard: React.FC<{
    title: string;
    value: number;
    suffix?: string;
    color?: string;
  }> = ({ title, value, suffix = '', color = 'primary.main' }) => (
    <Card>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" color={color}>
          {value.toFixed(1)}{suffix}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) return null;

  return (
    <Box>
      {analytics && (
        <BatchAlerts
          analytics={analytics}
          onAcknowledge={acknowledgeAlert}
          onDismiss={dismissAlert}
        />
      )}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Batch Metrics</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(Number(e.target.value))}
          >
            {TIME_RANGES.map((range) => (
              <MenuItem key={range.value} value={range.value}>
                {range.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Success Rate"
            value={analytics.success_rate}
            suffix="%"
            color={analytics.success_rate > 95 ? 'success.main' : 'warning.main'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Messages"
            value={analytics.total_messages}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Failed Messages"
            value={analytics.failed}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Credits Used"
            value={analytics.credits_used}
          />
        </Grid>
      </Grid>

      {analytics.trends && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Message Volume Trends
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.trends}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value: string) => new Date(value).toLocaleDateString()}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(value: string) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="message_volume"
                  name="Message Volume"
                  stroke="#8884d8"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="success_rate"
                  name="Success Rate (%)"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Error Distribution
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(analytics.error_categories).map(([category, count]) => {
            const errorCount = count as number;
            return (
              <Grid item xs={12} sm={6} md={4} key={category}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      {category}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {errorCount}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {((errorCount / analytics.failed) * 100).toFixed(1)}% of errors
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
}
