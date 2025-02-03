import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { Customer } from '@/types/customer';
import { BatchCreationData } from '../creation/BatchCreationOrchestrator';
import { useAppDispatch } from '@/store';
import { createBatch } from '@/store/thunks/batchThunks';

interface ValidationSummaryProps {
  batchData: BatchCreationData;
  selectedCustomers: Customer[];
  onBack: () => void;
  onClose: () => void;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  batchData,
  selectedCustomers,
  onBack,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      await dispatch(createBatch({
        name: batchData.name,
        template: batchData.template!,
        scheduledFor: batchData.scheduledFor || null,
        customers: selectedCustomers,
        variables: batchData.variables,
      })).unwrap();

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack spacing={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Batch Summary
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <DescriptionIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Template"
                secondary={batchData.template?.name}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <GroupIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Recipients"
                secondary={`${selectedCustomers.length} customers selected`}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <ScheduleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Scheduled For"
                secondary={batchData.scheduledFor ? new Date(batchData.scheduledFor).toLocaleString() : 'Not scheduled'}
              />
            </ListItem>

            {Object.entries(batchData.variables || {}).map(([key, value]) => (
              <ListItem key={key}>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`Variable: ${key}`}
                  secondary={value}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
          >
            {isSubmitting ? 'Creating Batch...' : 'Create Batch'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default ValidationSummary;
