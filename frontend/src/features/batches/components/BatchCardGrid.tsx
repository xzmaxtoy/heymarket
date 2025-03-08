import React from 'react';
import { Grid, Box, useTheme, useMediaQuery } from '@mui/material';
import { Batch } from '../types';
import BatchCard from './BatchCard';

interface BatchCardGridProps {
  batches: Batch[];
  onRefresh: (batchId: string) => void;
}

export default function BatchCardGrid({ batches, onRefresh }: BatchCardGridProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const getColumnCount = () => {
    if (isMobile) return 12; // 1 column
    if (isTablet) return 6;  // 2 columns
    if (isDesktop) return 4; // 3 columns
    return 3;                // 4 columns on large screens
  };

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Grid container spacing={2}>
        {batches.map(batch => (
          <Grid 
            key={batch.id} 
            item 
            xs={getColumnCount()}
            sx={{
              display: 'flex',
              [theme.breakpoints.down('sm')]: {
                px: 1 // Smaller padding on mobile
              }
            }}
          >
            <BatchCard
              batch={batch}
              onRefresh={onRefresh}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
