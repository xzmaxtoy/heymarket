import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { Batch } from '../types';

interface BatchActionsProps {
  batch: Batch;
  onCancel?: (batchId: string) => void;
  onPause?: (batchId: string) => void;
  onStart?: (batchId: string) => void;
  onRefresh?: (batchId: string) => void;
}

export const BatchActions: React.FC<BatchActionsProps> = ({
  batch,
  onCancel,
  onPause,
  onStart,
  onRefresh,
}) => {
  const isPending = batch.status === 'pending';
  const isProcessing = batch.status === 'processing';

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {/* Cancel Action */}
      {(isPending || isProcessing) && onCancel && (
        <Tooltip title="Cancel Batch">
          <IconButton
            size="small"
            onClick={() => onCancel(batch.id)}
            color="error"
          >
            <CancelIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Pause Action */}
      {isProcessing && onPause && (
        <Tooltip title="Pause Batch">
          <IconButton
            size="small"
            onClick={() => onPause(batch.id)}
          >
            <PauseIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Start Action */}
      {isPending && onStart && (
        <Tooltip title="Start Now">
          <IconButton
            size="small"
            onClick={() => onStart(batch.id)}
            color="primary"
          >
            <PlayArrowIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Refresh Action */}
      {onRefresh && (
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={() => onRefresh(batch.id)}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default BatchActions;