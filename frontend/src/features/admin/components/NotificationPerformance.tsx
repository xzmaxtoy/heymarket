import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { BatchAlert } from '@/types/alerts';
import { useNotificationPerformance } from '../hooks/useNotificationPerformance';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface NotificationPerformanceProps {
  notifications: BatchAlert[];
}

export default function NotificationPerformance({ notifications }: NotificationPerformanceProps) {
  const theme = useTheme();
  const performance = useNotificationPerformance(notifications);
  const { slaMetrics, channelPerformance, responseTimeDistribution, peakBreachHours } = performance;

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getSLAColor = (percentage: number) => {
    if (percentage >= 95) return theme.palette.success.main;
    if (percentage >= 85) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Performance Metrics
      </Typography>

      <Grid container spacing={3}>
        {/* SLA Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              SLA Compliance
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h4">
                  {slaMetrics.percentageWithinSLA.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={slaMetrics.percentageWithinSLA}
                  sx={{
                    width: '100%',
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getSLAColor(slaMetrics.percentageWithinSLA),
                    },
                  }}
                />
              </Stack>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Stack alignItems="center">
                  <CheckCircleIcon color="success" />
                  <Typography variant="body2" color="textSecondary">
                    Within SLA
                  </Typography>
                  <Typography variant="h6">{slaMetrics.withinSLA}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack alignItems="center">
                  <WarningIcon color="warning" />
                  <Typography variant="body2" color="textSecondary">
                    At Risk
                  </Typography>
                  <Typography variant="h6">{slaMetrics.atRisk}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack alignItems="center">
                  <ErrorIcon color="error" />
                  <Typography variant="body2" color="textSecondary">
                    Breached
                  </Typography>
                  <Typography variant="h6">{slaMetrics.breached}</Typography>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Response Time Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Response Time Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Average Response Time
                    </Typography>
                    <Typography variant="h6">
                      {formatMinutes(slaMetrics.averageResponseTime)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Fastest Response
                    </Typography>
                    <Typography variant="h6">
                      {formatMinutes(slaMetrics.shortestResponseTime)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Notifications
                    </Typography>
                    <Typography variant="h6">{slaMetrics.totalCount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Slowest Response
                    </Typography>
                    <Typography variant="h6">
                      {formatMinutes(slaMetrics.longestResponseTime)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
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
                <BarChart
                  data={channelPerformance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
                  <YAxis yAxisId="right" orientation="right" stroke={theme.palette.error.main} />
                  <Tooltip />
                  <Bar
                    yAxisId="left"
                    dataKey="averageResponseTime"
                    name="Avg Response Time (min)"
                    fill={theme.palette.primary.main}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="slaBreachCount"
                    name="SLA Breaches"
                    fill={theme.palette.error.main}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Response Time Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Response Time Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={responseTimeDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* SLA Breach Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              SLA Breach Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={slaMetrics.slaBreachTrend}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Top Breached Channels */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Top Breached Channels
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {performance.topBreachedChannels.map(channel => (
                <Chip
                  key={channel}
                  label={channel}
                  color="error"
                  variant="outlined"
                  icon={<WarningIcon />}
                />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
