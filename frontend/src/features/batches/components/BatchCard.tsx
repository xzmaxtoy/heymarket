import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { Batch } from '../types';
import BatchStatusChip from './BatchStatusChip';
import BatchProgress from './BatchProgress';
import BatchActions from './BatchActions';

interface BatchCardProps {
  batch: Batch;
  onRefresh: (batchId: string) => void;
}

export default function BatchCard({ batch, onRefresh }: BatchCardProps) {
  const theme = useTheme();

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardHeader
        title={batch.name}
        action={<BatchStatusChip status={batch.status} />}
        titleTypographyProps={{ variant: 'h6', noWrap: true }}
        sx={{
          pb: 1,
          '& .MuiCardHeader-content': {
            overflow: 'hidden'
          }
        }}
      />
      
      <CardContent sx={{ flex: 1, pt: 0 }}>
        <BatchProgress batch={batch} />
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
              <Typography variant="h6">
                {batch.completed_count}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
              <Typography variant="h6" color="error.main">
                {batch.failed_count}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Created
            </Typography>
            <Typography>
              {new Date(batch.created_at).toLocaleString()}
            </Typography>
          </Grid>
          
          {batch.scheduled_for && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Scheduled
              </Typography>
              <Typography>
                {new Date(batch.scheduled_for).toLocaleString()}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <BatchActions
          batch={batch}
          onRefresh={onRefresh}
        />
      </CardActions>
    </Card>
  );
}
