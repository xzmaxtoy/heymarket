import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Batch } from '../types';

interface BatchProgressProps {
  batch: Batch;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({ batch }) => {
  const progress = (batch.completed_count / batch.total_recipients) * 100;

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 65 }}>
        {`${batch.completed_count}/${batch.total_recipients}`}
      </Typography>
    </Box>
  );
};

export default BatchProgress;