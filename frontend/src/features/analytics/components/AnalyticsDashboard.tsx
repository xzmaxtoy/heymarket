import React, { useEffect } from 'react';
import { Grid, Container, Alert, CircularProgress, Box, Snackbar, Button, AlertTitle, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [sectionErrors, setSectionErrors] = React.useState<{
    metrics?: string;
    trends?: string;
    system?: string;
  }>({});

  const {
    batchAnalytics,
    systemMetrics,
    filters,
    isLoading,
    error
  } = useAppSelector((state) => state.analytics);

  const fetchData = React.useCallback(() => {
    setSectionErrors({});
    Promise.all([
      dispatch(fetchBatchesAnalytics(filters)).unwrap().catch(err => {
        setSectionErrors(prev => ({ ...prev, metrics: err.message }));
      }),
      dispatch(fetchTrendMetrics(filters)).unwrap().catch(err => {
        setSectionErrors(prev => ({ ...prev, trends: err.message }));
      }),
      dispatch(fetchSystemMetrics()).unwrap().catch(err => {
        setSectionErrors(prev => ({ ...prev, system: err.message }));
      })
    ]);
  }, [dispatch, filters]);

  // Retry mechanism with exponential backoff
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchData();
      }, Math.pow(2, retryCount) * 1000);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, fetchData]);

  useEffect(() => {
    // Initial data fetch
    fetchData();
    
    // Start system metrics polling
    dispatch(startMetricsPolling());

    // Cleanup polling on unmount
    return () => {
      dispatch(stopMetricsPolling());
    };
  }, [dispatch, fetchData]);

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

  const handleExport = async () => {
    try {
      await dispatch(downloadAnalyticsReport(filters)).unwrap();
    } catch (err) {
      setExportError('Failed to export analytics data');
    }
  };

  const handleCloseExportError = () => {
    setExportError(null);
  };

  const handleRetrySection = (section: keyof typeof sectionErrors) => {
    setSectionErrors(prev => ({ ...prev, [section]: undefined }));
    switch (section) {
      case 'metrics':
        dispatch(fetchBatchesAnalytics(filters));
        break;
      case 'trends':
        dispatch(fetchTrendMetrics(filters));
        break;
      case 'system':
        dispatch(fetchSystemMetrics());
        break;
    }
  };

  if (error && retryCount >= 3) {
    return (
      <Container>
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<RefreshIcon />}
              onClick={() => {
                setRetryCount(0);
                fetchData();
              }}
            >
              RETRY
            </Button>
          }
        >
          <AlertTitle>Failed to Load Analytics</AlertTitle>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {error && retryCount < 3 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Having trouble loading data. Retrying... ({retryCount + 1}/3)
        </Alert>
      )}

      {!error && batchAnalytics?.length === 0 && !isLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No analytics data available for the selected filters.
        </Alert>
      )}

      <Snackbar
        open={!!exportError}
        autoHideDuration={6000}
        onClose={handleCloseExportError}
      >
        <Alert 
          onClose={handleCloseExportError}
          severity="error"
          sx={{ width: '100%' }}
          action={
            <Button color="inherit" size="small" onClick={handleExport}>
              RETRY
            </Button>
          }
        >
          {exportError}
        </Alert>
      </Snackbar>
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
            {sectionErrors.metrics ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Alert 
                    severity="error"
                    action={
                      <Button 
                        color="inherit" 
                        size="small" 
                        onClick={() => handleRetrySection('metrics')}
                      >
                        RETRY
                      </Button>
                    }
                  >
                    Failed to load metrics: {sectionErrors.metrics}
                  </Alert>
                </Paper>
              </Grid>
            ) : aggregateMetrics && (
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
              {sectionErrors.trends ? (
                <Paper sx={{ p: 2 }}>
                  <Alert 
                    severity="error"
                    action={
                      <Button 
                        color="inherit" 
                        size="small" 
                        onClick={() => handleRetrySection('trends')}
                      >
                        RETRY
                      </Button>
                    }
                  >
                    Failed to load trends: {sectionErrors.trends}
                  </Alert>
                </Paper>
              ) : (
                <TrendsChart
                  title="Message Volume Trends"
                  data={batchAnalytics?.map((batch: BatchAnalytics) => ({
                    timestamp: batch.timing.created,
                    value: batch.progress.total
                  })) || []}
                  dataKey="value"
                  color="#2196f3"
                />
              )}
            </Grid>

            {/* System Metrics */}
            <Grid item xs={12} md={4}>
              {sectionErrors.system ? (
                <Paper sx={{ p: 2 }}>
                  <Alert 
                    severity="error"
                    action={
                      <Button 
                        color="inherit" 
                        size="small" 
                        onClick={() => handleRetrySection('system')}
                      >
                        RETRY
                      </Button>
                    }
                  >
                    Failed to load system metrics: {sectionErrors.system}
                  </Alert>
                </Paper>
              ) : (
                <SystemMetrics metrics={systemMetrics} />
              )}
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default AnalyticsDashboard;
