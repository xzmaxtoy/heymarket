import React from 'react';
import { Chip } from '@mui/material';
import { BatchStatus, BATCH_STATUS_COLORS } from '../types';

interface BatchStatusChipProps {
  status: BatchStatus;
}

export const BatchStatusChip: React.FC<BatchStatusChipProps> = ({ status }) => {
  return (
    <Chip
      label={status}
      color={BATCH_STATUS_COLORS[status]}
      size="small"
      sx={{ textTransform: 'capitalize' }}
    />
  );
};

export default BatchStatusChip;