import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNotificationStats } from '../hooks/useNotificationStats';
import { BatchAlert } from '@/types/alerts';

interface NotificationStatsProps {
  notifications: BatchAlert[];
}

export default function NotificationStats({ notifications }: NotificationStatsProps) {
  const stats = useNotificationStats(notifications);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours`;
  };

  const formatHour = (hour: number) => {
    return new Date(2020, 0, 1, hour).toLocaleTimeString([], {
      hour: 'numeric',
      hour12: true,
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notification Statistics
      </Typography>

      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <NotificationsIcon color="primary" />
                <Typography color="textSecondary">Total Notifications</Typography>
              </Box>
              <Typography variant="h4">{stats.totalCount}</Typography>
              <Box mt={1}>
                <Typography variant="body2" color="textSecondary">
                  {stats.unreadCount} unread
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.readRate}
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Severity Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ErrorIcon color="error" />
                <Typography color="textSecondary">Error Rate</Typography>
              </Box>
              <Typography variant="h4">
                {stats.severityStats.error.percentage.toFixed(1)}%
              </Typography>
              <Box mt={1}>
                <Typography variant="body2" color="textSecondary">
                  Avg. response time: {formatDuration(stats.severityStats.error.avgReadTime)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Response Time */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccessTimeIcon color="primary" />
                <Typography color="textSecondary">Avg Response Time</Typography>
              </Box>
              <Typography variant="h4">{formatDuration(stats.timeStats.avgResponseTime)}</Typography>
              <Box mt={1}>
                <Typography variant="body2" color="textSecondary">
                  Read rate: {stats.readRate.toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Peak Hours */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ScheduleIcon color="primary" />
                <Typography color="textSecondary">Peak Hours</Typography>
              </Box>
              <List dense>
                {stats.timeStats.peakHours.map((hour) => (
                  <ListItem key={hour}>
                    <ListItemIcon>
                      <TrendingUpIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={formatHour(hour)} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Channel Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Channel Distribution
            </Typography>
            <List>
              {Object.entries(stats.channelStats).map(([channel, data]) => (
                <ListItem key={channel}>
                  <ListItemText
                    primary={channel}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {data.count} notifications ({data.percentage.toFixed(1)}%)
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={data.percentage}
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                          Error rate: {data.errorRate.toFixed(1)}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Weekly Trends */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Trends
            </Typography>
            <List>
              {stats.trends.weekly.slice(-4).map((week) => (
                <ListItem key={week.week}>
                  <ListItemText
                    primary={`Week ${week.week.split('-W')[1]}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {week.total} notifications
                        </Typography>
                        <Box display="flex" gap={2} mt={0.5}>
                          <Typography variant="body2" color="error">
                            Error rate: {week.errorRate.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="primary">
                            Read rate: {week.readRate.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
