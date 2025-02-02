import React, { useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Alert,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBatchCreation, resetCreation } from '@/store/slices/batchesSlice';
import { createBatch } from '@/store/thunks/batchThunks';
import { Customer } from '@/types/customer';
import { getErrorMessage, withRetry } from '@/utils/errorHandling';
import { useTemplateList } from '@/features/templates/hooks/useTemplateList';
import { useTemplatePreview } from '@/features/templates/hooks/useTemplatePreview';
import { BatchCreationState } from '../types';
import BatchConfigurationPanel from './BatchConfigurationPanel';
import BatchPreviewPanel from './BatchPreviewPanel';

interface BatchCreationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
}

export const BatchCreationDialog: React.FC<BatchCreationDialogProps> = ({
  open,
  onClose,
  selectedCustomers,
}) => {
  const dispatch = useAppDispatch();
  const creation = useAppSelector(selectBatchCreation);
  const { templates } = useTemplateList();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Template preview with first selected customer
  const { previewContent, customVariables, setVariableValue } = useTemplatePreview(
    creation.template,
    selectedCustomers[0]
  );

  // Reset creation state when dialog closes
  React.useEffect(() => {
    if (!open) {
      dispatch(resetCreation());
      setError(null);
    }
  }, [open, dispatch]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const batchData: BatchCreationState = {
        ...creation,
        customers: selectedCustomers,
        variables: customVariables,
      };

      await withRetry(async () => {
        await dispatch(createBatch(batchData)).unwrap();
      });
      onClose();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      // Show more specific error messages based on error type
      if (errorMessage.includes('template')) {
        setError('Template validation failed. Please check your template configuration.');
      } else if (errorMessage.includes('schedule')) {
        setError('Invalid schedule time. Please select a future date and time.');
      } else if (errorMessage.includes('customer')) {
        setError('Customer data validation failed. Please check selected customers.');
      } else if (errorMessage.includes('network')) {
        setError('Network error occurred. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [creation, selectedCustomers, customVariables, dispatch, onClose]);

  // Validate schedule time
  const validateSchedule = useCallback(() => {
    if (creation.scheduledFor) {
      const scheduleTime = creation.scheduledFor.toDate();
      const now = new Date();
      if (scheduleTime <= now) {
        setError('Schedule time must be in the future');
        return false;
      }
    }
    return true;
  }, [creation.scheduledFor]);

  const isValid = 
    creation.template &&
    selectedCustomers.length > 0 &&
    creation.name.trim() !== '' &&
    validateSchedule();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>Create Batch Message</DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }} 
              onClose={() => setError(null)}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  RETRY
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Left Panel - Configuration */}
            <Grid item xs={12} md={5}>
              <BatchConfigurationPanel
                name={creation.name}
                selectedTemplate={creation.template}
                scheduledFor={creation.scheduledFor}
                templates={templates}
                selectedCustomers={selectedCustomers}
              />
            </Grid>

            {/* Right Panel - Preview */}
            <Grid item xs={12} md={7}>
              <BatchPreviewPanel
                template={creation.template}
                previewCustomer={selectedCustomers[0]}
                previewContent={previewContent}
                customVariables={customVariables}
                onVariableChange={setVariableValue}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? 'Creating...' : 'Create Batch'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchCreationDialog;
