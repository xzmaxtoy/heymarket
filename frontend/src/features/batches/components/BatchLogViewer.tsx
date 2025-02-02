import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Batch } from '../types';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
}

interface BatchLogViewerProps {
  batch: Batch;
}

export const BatchLogViewer: React.FC<BatchLogViewerProps> = ({ batch }) => {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const { subscribe, unsubscribe } = useWebSocket();

  React.useEffect(() => {
    // Subscribe to batch updates
    const handleUpdate = (data: any) => {
      if (data.type === 'log') {
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          type: data.logType || 'info',
          message: data.message,
          details: data.details
        }]);
      }
    };

    subscribe(batch.id, handleUpdate);
    return () => unsubscribe(batch.id);
  }, [batch.id]);

  const getIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDetails = (details: Record<string, any>) => {
    return Object.entries(details).map(([key, value]) => (
      <Box key={key} sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {key}:
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          {typeof value === 'object' ? JSON.stringify(value, null, 2) : value?.toString()}
        </Typography>
      </Box>
    ));
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Batch Logs
        {batch.status === 'processing' && (
          <CircularProgress size={20} sx={{ ml: 2 }} />
        )}
      </Typography>

      {logs.length === 0 ? (
        <Alert severity="info">No logs available yet</Alert>
      ) : (
        logs.map((log, index) => (
          <Accordion key={index} sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {getIcon(log.type)}
                <Typography sx={{ flex: 1 }}>{log.message}</Typography>
                <Chip
                  label={formatTime(log.timestamp)}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 2 }}
                />
              </Box>
            </AccordionSummary>
            {log.details && (
              <AccordionDetails>
                <Box sx={{ 
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  p: 2,
                  fontFamily: 'monospace'
                }}>
                  {formatDetails(log.details)}
                </Box>
              </AccordionDetails>
            )}
          </Accordion>
        ))
      )}
    </Paper>
  );
};

export default BatchLogViewer;
