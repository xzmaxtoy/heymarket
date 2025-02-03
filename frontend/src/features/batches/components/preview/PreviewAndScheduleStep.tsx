import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { Customer } from '@/types/customer';
import { BatchCreationData } from '../creation/BatchCreationOrchestrator';
import { useBatchPreview } from '../../hooks/useBatchPreview';

interface PreviewAndScheduleStepProps {
  batchData: BatchCreationData;
  selectedCustomers: Customer[];
  onSchedule: (scheduledFor: string) => void;
  onBack: () => void;
}

const PreviewAndScheduleStep: React.FC<PreviewAndScheduleStepProps> = ({
  batchData,
  selectedCustomers,
  onSchedule,
  onBack,
}) => {
  const [scheduledFor, setScheduledFor] = React.useState<Dayjs | null>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = React.useState(0);
  const { loading, error, previewContent } = useBatchPreview(
    batchData.template!,
    selectedCustomers[currentPreviewIndex],
    batchData.variables
  );

  const handleNext = () => {
    setCurrentPreviewIndex((prev) => 
      prev === selectedCustomers.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevious = () => {
    setCurrentPreviewIndex((prev) => 
      prev === 0 ? selectedCustomers.length - 1 : prev - 1
    );
  };

  const handleSubmit = () => {
    if (scheduledFor) {
      onSchedule(scheduledFor.toISOString());
    }
  };

  const isValid = scheduledFor && scheduledFor.isAfter(dayjs());

  return (
    <Box>
      <Stack spacing={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Message Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Preview {currentPreviewIndex + 1} of {selectedCustomers.length}
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body1" whiteSpace="pre-wrap">
                {previewContent}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button onClick={handlePrevious}>
              Previous Preview
            </Button>
            <Button onClick={handleNext}>
              Next Preview
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Schedule Delivery
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Choose when to send the batch messages
          </Typography>

          <DateTimePicker
            label="Schedule For"
            value={scheduledFor}
            onChange={(newValue) => setScheduledFor(newValue)}
            minDateTime={dayjs()}
            sx={{ width: '100%', mt: 2 }}
          />
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button onClick={onBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            Next
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default PreviewAndScheduleStep;
