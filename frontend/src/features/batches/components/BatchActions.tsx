import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '@/store';
import { startBatch, cancelBatch, pauseBatch } from '@/store/thunks/batchThunks';
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
  const isPaused = batch.status === 'paused';

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

  const handlePause = async () => {
    try {
      setIsLoading(true);
      await dispatch(pauseBatch(batch.id)).unwrap();
      if (onRefresh) {
        onRefresh(batch.id);
      }
    } catch (error) {
      console.error('Failed to pause batch:', error);
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const buttonSize = isMobile ? 'medium' : 'small';
  const iconSize = isMobile ? 24 : 20;

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: { xs: 1, sm: 0.5 },
      '& .MuiIconButton-root': {
        p: { xs: 1.5, sm: 1 }
      }
    }}>
      {/* Cancel Action */}
      {(isPending || isProcessing) && (
        <Tooltip title="Cancel Batch">
          <IconButton
            size={buttonSize}
            sx={{
              '& .MuiSvgIcon-root': {
                fontSize: iconSize
              }
            }}
            onClick={handleCancel}
            color="error"
            disabled={isLoading}
          >
            <CancelIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Pause Action */}
      {isProcessing && (
        <Tooltip title="Pause Batch">
          <IconButton
            size={buttonSize}
            sx={{
              '& .MuiSvgIcon-root': {
                fontSize: iconSize
              }
            }}
            onClick={handlePause}
            color="warning"
            disabled={isLoading}
          >
            <PauseIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* Start/Resume Action */}
      {(isPending || isPaused) && (
        <Tooltip title={isPaused ? "Resume Batch" : "Start Now"}>
          <IconButton
            size={buttonSize}
            sx={{
              '& .MuiSvgIcon-root': {
                fontSize: iconSize
              }
            }}
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
            size={buttonSize}
            sx={{
              '& .MuiSvgIcon-root': {
                fontSize: iconSize
              }
            }}
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
