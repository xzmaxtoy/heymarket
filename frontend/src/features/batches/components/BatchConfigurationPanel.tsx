import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  SelectChangeEvent,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useAppDispatch } from '@/store';
import { setBatchName, setTemplate, setScheduledFor } from '@/store/slices/batchesSlice';
import { Template } from '@/features/templates/types';
import { Customer } from '@/types/customer';
import dayjs from 'dayjs';

interface BatchConfigurationPanelProps {
  name: string;
  selectedTemplate: Template | null;
  scheduledFor: string | null;
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

  const handleTemplateChange = (event: SelectChangeEvent<string>) => {
    const templateId = event.target.value;
    const template = templates.find(t => t.id === templateId);
    dispatch(setTemplate(template || null));
  };

  const handleScheduleChange = (date: dayjs.Dayjs | null) => {
    dispatch(setScheduledFor(date?.toISOString() || null));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Selected Customers Summary */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Selected Recipients
        </Typography>
        <Typography>
          {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
        </Typography>
      </Paper>

      {/* Basic Configuration */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Batch Name"
          value={name}
          onChange={(e) => dispatch(setBatchName(e.target.value))}
          required
          fullWidth
        />

        <FormControl fullWidth required>
          <InputLabel>Template</InputLabel>
          <Select
            value={selectedTemplate?.id || ''}
            onChange={handleTemplateChange}
            label="Template"
          >
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DateTimePicker
          label="Schedule For (Optional)"
          value={scheduledFor ? dayjs(scheduledFor) : null}
          onChange={handleScheduleChange}
          slotProps={{
            textField: {
              fullWidth: true,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default BatchConfigurationPanel;