import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import type { LinearProgressProps } from '@mui/material';
import { Batch } from '../types';

interface BatchProgressProps {
  batch: Batch;
}

type ProgressColor = NonNullable<LinearProgressProps['color']>;
type ProgressVariant = NonNullable<LinearProgressProps['variant']>;

interface ProgressProps {
  color: ProgressColor;
  variant: ProgressVariant;
  value: number;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({ batch }) => {
  const completed = (batch.completed_count / batch.total_recipients) * 100;
  const failed = (batch.failed_count / batch.total_recipients) * 100;
  const total = completed + failed;

  // Determine progress color and variant based on status
  const getProgressProps = (): ProgressProps => {
    if (batch.status === 'pending') {
      return {
        color: 'warning',
        variant: 'determinate',
        value: 0
      };
    }
    
    if (batch.status === 'processing') {
      return {
        color: 'primary',
        variant: 'indeterminate',
        value: total
      };
    }

    if (batch.status === 'failed') {
      return {
        color: 'error',
        variant: 'determinate',
        value: total
      };
    }

    if (batch.status === 'completed') {
      return {
        color: 'success',
        variant: 'determinate',
        value: 100
      };
    }

    // Default case
    return {
      color: failed > 0 ? 'warning' : 'primary',
      variant: 'determinate',
      value: total
    };
  };

  const progressProps = getProgressProps();

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          {...progressProps}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: batch.status === 'pending' ? 'action.hover' : undefined,
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 85, display: 'flex', gap: 0.5 }}>
        {batch.status === 'pending' ? (
          <span>Ready to start</span>
        ) : (
          <>
            <span style={{ color: 'success.main' }}>{batch.completed_count}</span>
            {batch.failed_count > 0 && (
              <span style={{ color: 'error.main' }}>/{batch.failed_count}</span>
            )}
            <span>/{batch.total_recipients}</span>
          </>
        )}
      </Typography>
    </Box>
  );
};

export default BatchProgress;
