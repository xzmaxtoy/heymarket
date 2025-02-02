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
import { useAppDispatch } from '@/store';
import { startBatch, cancelBatch } from '@/store/thunks/batchThunks';
import { Batch } from '../types';

interface BatchActionsProps {
  batch: Batch;
  onRefresh?: (batchId: string) => void;
}

export const BatchActions: React.FC<BatchActionsProps> = ({
  batch,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = React.useState(false);

  const isPending = batch.status === 'pending';
  const isProcessing = batch.status === 'processing';

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await dispatch(startBatch(batch.id)).unwrap();
      if (onRefresh) {
        onRefresh(batch.id);
      }
    } catch (error) {
      console.error('Failed to start batch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      await dispatch(cancelBatch(batch.id)).unwrap();
      if (onRefresh) {
        onRefresh(batch.id);
      }
    } catch (error) {
      console.error('Failed to cancel batch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {/* Cancel Action */}
      {(isPending || isProcessing) && (
        <Tooltip title="Cancel Batch">
          <IconButton
            size="small"
            onClick={handleCancel}
            color="error"
            disabled={isLoading}
          >
            <CancelIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Pause Action - To be implemented */}
      {isProcessing && (
        <Tooltip title="Pause Batch (Coming Soon)">
          <span>
            <IconButton
              size="small"
              disabled={true}
            >
              <PauseIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Start Action */}
      {isPending && (
        <Tooltip title="Start Now">
          <IconButton
            size="small"
            onClick={handleStart}
            color="primary"
            disabled={isLoading}
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
            disabled={isLoading}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default BatchActions;