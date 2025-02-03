import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Stack,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { BatchAlert } from '@/types/alerts';
import { useNotificationAnalytics } from '../hooks/useNotificationAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface NotificationAnalyticsProps {
  notifications: BatchAlert[];
}

export default function NotificationAnalytics({ notifications }: NotificationAnalyticsProps) {
  const theme = useTheme();
  const analytics = useNotificationAnalytics(notifications);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notification Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Delivery Success */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Delivery Success Rate
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h4" color="success.main">
                  {analytics.deliverySuccess.successRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {analytics.deliverySuccess.successful} of {analytics.deliverySuccess.total} delivered successfully
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Chip
                  icon={<SuccessIcon />}
                  label={`${analytics.deliverySuccess.successful} Successful`}
                  color="success"
                />
                <Chip
                  icon={<ErrorIcon />}
                  label={`${analytics.deliverySuccess.failed} Failed`}
                  color="error"
                />
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* User Interactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              User Interaction Metrics
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h4">
                  {analytics.userInteractions.readRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Read Rate
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1">
                  Average Read Time: {formatTime(analytics.userInteractions.averageReadTime)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Notification Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Notification Trends
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="error"
                    name="Errors"
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="warning"
                    name="Warnings"
                    stroke={theme.palette.warning.main}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Channel Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Channel Performance
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.channelMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
                  <YAxis yAxisId="right" orientation="right" stroke={theme.palette.error.main} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="readRate"
                    name="Read Rate (%)"
                    fill={theme.palette.primary.main}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="errorRate"
                    name="Error Rate (%)"
                    fill={theme.palette.error.main}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Volume by Hour */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Volume by Hour
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.volumeByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={formatHour}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={formatHour}
                  />
                  <Bar
                    dataKey="count"
                    name="Notifications"
                    fill={theme.palette.primary.main}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Top Error Channels */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Top Error Channels
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {analytics.topErrorChannels.map(channel => (
                <Chip
                  key={channel.channel}
                  label={`${channel.channel} (${channel.errorCount})`}
                  color="error"
                  variant="outlined"
                  icon={<ErrorIcon />}
                />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
