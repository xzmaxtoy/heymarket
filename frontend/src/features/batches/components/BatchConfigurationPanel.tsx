import React from 'react';
import {
  Box,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Dayjs } from 'dayjs';
import { useAppDispatch } from '@/store';
import { Template } from '@/features/templates/types';
import { Customer } from '@/types/customer';
import { 
  setName, 
  setTemplate, 
  setScheduledFor 
} from '@/store/slices/batchesSlice';

interface BatchConfigurationPanelProps {
  name: string;
  selectedTemplate: Template | null;
  scheduledFor: Dayjs | null;
  templates: Template[];
  selectedCustomers: Customer[];
}

export const BatchConfigurationPanel: React.FC<BatchConfigurationPanelProps> = ({
  name,
  selectedTemplate,
  scheduledFor,
  templates,
  selectedCustomers,
}) => {
  const dispatch = useAppDispatch();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Batch Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Configure your batch message settings
        </Typography>
      </Box>

      {/* Batch Name */}
      <TextField
        label="Batch Name"
        value={name}
        onChange={(e) => dispatch(setName(e.target.value))}
        fullWidth
        required
        helperText="Give your batch a descriptive name"
      />

      {/* Template Selection */}
      <FormControl fullWidth required>
        <InputLabel>Message Template</InputLabel>
        <Select
          value={selectedTemplate?.id || ''}
          onChange={(e) => {
            const template = templates.find(t => t.id === e.target.value);
            dispatch(setTemplate(template || null));
          }}
          label="Message Template"
        >
          {templates.map((template) => (
            <MenuItem key={template.id} value={template.id}>
              {template.name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Select a template for your batch message
        </FormHelperText>
      </FormControl>

      {/* Schedule */}
      <DateTimePicker
        label="Schedule For (Optional)"
        value={scheduledFor}
        onChange={(date) => dispatch(setScheduledFor(date))}
        slotProps={{
          textField: {
            fullWidth: true,
            helperText: "Leave empty to send immediately",
          },
        }}
      />

      {/* Recipients Summary */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Recipients
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
        </Typography>
      </Box>
    </Stack>
  );
};

export default BatchConfigurationPanel;