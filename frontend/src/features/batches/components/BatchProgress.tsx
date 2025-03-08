import React from 'react';
import { Box, Typography, LinearProgress, useTheme, useMediaQuery } from '@mui/material';
import { Batch } from '../types';

interface BatchProgressProps {
  batch: Batch;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({ batch }) => {
  const progress = (batch.completed_count / batch.total_recipients) * 100;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      gap: 0.5
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1
      }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '0.75rem' }
          }}
        >
          Progress
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            minWidth: { xs: 75, sm: 65 },
            fontSize: { xs: '0.875rem', sm: '0.75rem' },
            fontWeight: 'medium'
          }}
        >
          {`${batch.completed_count}/${batch.total_recipients}`}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: { xs: 10, sm: 8 },
          borderRadius: { xs: 5, sm: 4 },
          backgroundColor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            borderRadius: { xs: 5, sm: 4 }
          }
        }}
      />
    </Box>
  );
};

export default BatchProgress;
