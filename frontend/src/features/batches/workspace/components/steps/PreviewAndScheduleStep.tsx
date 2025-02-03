import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store';
import { createBatch } from '@/store/thunks/batchThunks';
import { Template } from '@/features/templates/types';  // Use the correct Template type
import { Customer } from '@/types/customer';
import { BatchWorkspaceState } from '../../types';
import { useBatchPreview } from '../../hooks/useBatchPreview';

interface PreviewAndScheduleStepProps {
  state: BatchWorkspaceState;
  onBack: () => void;
  useNewPreview: boolean;
  settings: any; // TODO: Add proper type
}

export default function PreviewAndScheduleStep({
  state,
  onBack,
  useNewPreview,
  settings,
}: PreviewAndScheduleStepProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [previewIndex, setPreviewIndex] = useState(0);
  const [batchName, setBatchName] = useState(state.batchName || '');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>(state.priority || 'normal');
  const [scheduleTime, setScheduleTime] = useState(state.scheduleTime || '');
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { messages, loading, error: previewError, generatePreview } = useBatchPreview();

  useEffect(() => {
    if (state.selectedTemplate && state.selectedCustomers.length > 0) {
      generatePreview(state.selectedTemplate, state.selectedCustomers, {
        count: useNewPreview ? 10 : 5,
        includeVariables: true,
      });
    }
  }, [state.selectedTemplate, state.selectedCustomers, useNewPreview, generatePreview]);

  const handlePrevious = () => {
    setPreviewIndex((prev) => (prev > 0 ? prev - 1 : messages.length - 1));
  };

  const handleNext = () => {
    setPreviewIndex((prev) => (prev < messages.length - 1 ? prev + 1 : 0));
  };

  const validateSchedule = () => {
    if (!batchName.trim()) {
      setError('Batch name is required');
      return false;
    }

    if (scheduleTime) {
      const scheduleDate = new Date(scheduleTime);
      const now = new Date();
      if (scheduleDate <= now) {
        setError('Schedule time must be in the future');
        return false;
      }
    }

    return true;
  };

  const handleSchedule = async () => {
    try {
      if (!validateSchedule()) {
        return;
      }

      setScheduling(true);
      setError(null);

      // Convert template variables to string array if needed
      const template = state.selectedTemplate && {
        ...state.selectedTemplate,
        variables: state.selectedTemplate.variables.map(v => 
          typeof v === 'string' ? v : v.name
        )
      };

      // Get variables from preview messages
      const variables = messages.reduce((acc, msg, index) => ({
        ...acc,
        [state.selectedCustomers[index].id]: msg.variables
      }), {});

      const batchData = {
        name: batchName,
        template,
        customers: state.selectedCustomers,
        scheduledFor: scheduleTime || null,
        priority,
        variables,
      };

      await dispatch(createBatch(batchData)).unwrap();
      setSuccess(true);
      
      // Navigate to batch list after short delay
      setTimeout(() => {
        navigate('/batches');  // Navigate to the root batch list
      }, 1500);
    } catch (err) {
      console.error('Error scheduling batch:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule batch');
    } finally {
      setScheduling(false);
    }
  };

  if (previewError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{previewError}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Configuration */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Typography variant="h6" gutterBottom>
                Batch Configuration
              </Typography>

              <TextField
                fullWidth
                label="Batch Name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                error={!!error && !batchName}
                helperText={!batchName && error ? 'Batch name is required' : ''}
                required
              />

              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  label="Priority"
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Schedule Time"
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                error={!!error && scheduleTime !== '' && new Date(scheduleTime) <= new Date()}
                helperText={error && scheduleTime !== '' && new Date(scheduleTime) <= new Date() ? error : ''}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Preview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Typography variant="h6" gutterBottom>
                Message Preview
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : messages.length === 0 ? (
                <Alert severity="info">No preview messages available</Alert>
              ) : (
                <>
                  <Box sx={{ position: 'relative' }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          To: {messages[previewIndex].phoneNumber}
                        </Typography>
                        <Typography variant="body1">
                          {messages[previewIndex].content}
                        </Typography>
                      </CardContent>
                    </Card>

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      position: 'absolute',
                      top: '50%',
                      left: -20,
                      right: -20,
                      transform: 'translateY(-50%)',
                    }}>
                      <IconButton onClick={handlePrevious}>
                        <NavigateBeforeIcon />
                      </IconButton>
                      <IconButton onClick={handleNext}>
                        <NavigateNextIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="caption" align="center">
                    Preview {previewIndex + 1} of {messages.length}
                  </Typography>
                </>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          disabled={scheduling}
        >
          Back
        </Button>
        <Button
          variant="contained"
          endIcon={scheduling ? <CircularProgress size={20} /> : <SendIcon />}
          onClick={handleSchedule}
          disabled={scheduling || loading || messages.length === 0 || !batchName}
        >
          {scheduling ? 'Scheduling...' : 'Schedule Batch'}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Batch scheduled successfully"
      />
    </Box>
  );
}
