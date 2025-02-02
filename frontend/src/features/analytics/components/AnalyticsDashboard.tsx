import React, { useEffect } from 'react';
import { Grid, Container, Alert, CircularProgress, Box } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { BatchAnalytics } from '../types';
import {
  fetchBatchesAnalytics,
  fetchSystemMetrics,
  fetchTrendMetrics,
  downloadAnalyticsReport,
  startMetricsPolling,
  stopMetricsPolling
} from '../../../store/thunks/analyticsThunks';
import { setFilters } from '../../../store/slices/analyticsSlice';
import AnalyticsFilters from './AnalyticsFilters';
import MetricsCard from './MetricsCard';
import TrendsChart from './TrendsChart';
import SystemMetrics from './SystemMetrics';

const AnalyticsDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    batchAnalytics,
    systemMetrics,
    filters,
    isLoading,
    error
  } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    // Initial data fetch
    dispatch(fetchBatchesAnalytics(filters));
    dispatch(fetchTrendMetrics(filters));
    
    // Start system metrics polling
    dispatch(startMetricsPolling());

    // Cleanup polling on unmount
    return () => {
      dispatch(stopMetricsPolling());
    };
  }, [dispatch]);

  // Calculate aggregate metrics
  const aggregateMetrics = React.useMemo(() => {
    if (!batchAnalytics?.length) return null;

    interface TotalMetrics {
      messages: number;
      completed: number;
      failed: number;
      credits: number;
    }

    const total = batchAnalytics.reduce<TotalMetrics>((acc, batch) => {
      acc.messages += batch.progress.total;
      acc.completed += batch.progress.completed;
      acc.failed += batch.progress.failed;
      acc.credits += batch.metrics.credits_used;
      return acc;
    }, {
      messages: 0,
      completed: 0,
      failed: 0,
      credits: 0
    });

    const successRate = (total.completed / total.messages) * 100;
    const errorRate = (total.failed / total.messages) * 100;

    return {
      total,
      successRate,
      errorRate
    };
  }, [batchAnalytics]);

  const handleFiltersChange = (newFilters: typeof filters) => {
    dispatch(setFilters(newFilters));
    dispatch(fetchBatchesAnalytics(newFilters));
    dispatch(fetchTrendMetrics(newFilters));
  };

  const handleRefresh = () => {
    dispatch(fetchBatchesAnalytics(filters));
    dispatch(fetchTrendMetrics(filters));
    dispatch(fetchSystemMetrics());
  };

  const handleExport = () => {
    dispatch(downloadAnalyticsReport(filters));
  };

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12}>
          <AnalyticsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
            onExport={handleExport}
            loading={isLoading}
          />
        </Grid>

        {isLoading ? (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : (
          <>
            {/* Key Metrics */}
            {aggregateMetrics && (
              <>
                <Grid item xs={12} md={3}>
                  <MetricsCard
                    title="Total Messages"
                    value={aggregateMetrics.total.messages}
                    color="primary"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MetricsCard
                    title="Success Rate"
                    value={aggregateMetrics.successRate.toFixed(1)}
                    unit="%"
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MetricsCard
                    title="Error Rate"
                    value={aggregateMetrics.errorRate.toFixed(1)}
                    unit="%"
                    color="error"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MetricsCard
                    title="Credits Used"
                    value={aggregateMetrics.total.credits}
                    color="info"
                  />
                </Grid>
              </>
            )}

            {/* Trends */}
            <Grid item xs={12} md={8}>
              <TrendsChart
                title="Message Volume Trends"
                data={batchAnalytics?.map((batch: BatchAnalytics) => ({
                  timestamp: batch.timing.created,
                  value: batch.progress.total
                })) || []}
                dataKey="value"
                color="#2196f3"
              />
            </Grid>

            {/* System Metrics */}
            <Grid item xs={12} md={4}>
              <SystemMetrics metrics={systemMetrics} />
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default AnalyticsDashboard;
