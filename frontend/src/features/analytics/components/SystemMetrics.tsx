import React from 'react';
import { Grid, Card, CardHeader, CardContent, LinearProgress, Typography, Box } from '@mui/material';
import { SystemMetrics as SystemMetricsType } from '../types';
import MetricsCard from './MetricsCard';

interface SystemMetricsProps {
  metrics?: SystemMetricsType;
  loading?: boolean;
}

const defaultMetrics: SystemMetricsType = {
  cpuUsage: 0,
  memoryUsage: 0,
  queueSize: 0,
  activeConnections: 0,
  avgResponseTime: 0
};

const SystemMetrics: React.FC<SystemMetricsProps> = ({ metrics = defaultMetrics, loading = false }) => {
  const formatPercentage = (value?: number) => `${Math.round(value ?? 0)}%`;
  const formatNumber = (value?: number) => (value ?? 0).toLocaleString();
  const formatTime = (value?: number) => `${(value ?? 0).toFixed(2)}ms`;

  const getHealthColor = (value: number | undefined, type: 'cpu' | 'memory' | 'queue'): 'success' | 'warning' | 'error' => {
    if (value === undefined) return 'success';
    switch (type) {
      case 'cpu':
        return value > 90 ? 'error' : value > 70 ? 'warning' : 'success';
      case 'memory':
        return value > 85 ? 'error' : value > 65 ? 'warning' : 'success';
      case 'queue':
        return value > 1000 ? 'error' : value > 500 ? 'warning' : 'success';
      default:
        return 'success';
    }
  };

  return (
    <Card>
      <CardHeader title="System Health" />
      <CardContent>
        <Grid container spacing={3}>
          {/* CPU Usage */}
          <Grid item xs={12} md={4}>
            <MetricsCard
              title="CPU Usage"
              value={formatPercentage(metrics.cpuUsage)}
              loading={loading}
              color={getHealthColor(metrics.cpuUsage, 'cpu')}
              tooltip="Current CPU utilization"
            />
          </Grid>

          {/* Memory Usage */}
          <Grid item xs={12} md={4}>
            <MetricsCard
              title="Memory Usage"
              value={formatPercentage(metrics.memoryUsage)}
              loading={loading}
              color={getHealthColor(metrics.memoryUsage, 'memory')}
              tooltip="Current memory utilization"
            />
          </Grid>

          {/* Queue Size */}
          <Grid item xs={12} md={4}>
            <MetricsCard
              title="Queue Size"
              value={formatNumber(metrics.queueSize)}
              loading={loading}
              color={getHealthColor(metrics.queueSize, 'queue')}
              tooltip="Number of messages in queue"
            />
          </Grid>

          {/* Active Connections */}
          <Grid item xs={12} md={6}>
            <MetricsCard
              title="Active Connections"
              value={formatNumber(metrics.activeConnections)}
              loading={loading}
              color="info"
              tooltip="Number of active WebSocket connections"
            />
          </Grid>

          {/* Average Response Time */}
          <Grid item xs={12} md={6}>
            <MetricsCard
              title="Average Response Time"
              value={formatTime(metrics.avgResponseTime)}
              loading={loading}
              color="primary"
              tooltip="Average API response time"
            />
          </Grid>

          {/* System Health Indicators */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                System Health Indicators
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    CPU Load
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.cpuUsage}
                    color={getHealthColor(metrics.cpuUsage, 'cpu')}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Memory Usage
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.memoryUsage}
                    color={getHealthColor(metrics.memoryUsage, 'memory')}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SystemMetrics;
