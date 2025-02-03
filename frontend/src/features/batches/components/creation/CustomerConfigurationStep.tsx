import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Paper,
  Stack,
} from '@mui/material';
import { Customer } from '@/types/customer';
import { Template } from '@/features/templates/types';
import { BatchCreationData } from './BatchCreationOrchestrator';

interface CustomerConfigurationStepProps {
  selectedCustomers: Customer[];
  template: Template;
  onConfigure: (data: Partial<BatchCreationData>) => void;
  onBack: () => void;
}

const CustomerConfigurationStep: React.FC<CustomerConfigurationStepProps> = ({
  selectedCustomers,
  template,
  onConfigure,
  onBack,
}) => {
  const [batchName, setBatchName] = React.useState('');
  const [variables, setVariables] = React.useState<Record<string, string>>({});

  const handleVariableChange = (variable: string, value: string) => {
    setVariables((prev) => ({
      ...prev,
      [variable]: value,
    }));
  };

  const handleSubmit = () => {
    onConfigure({
      name: batchName,
      variables,
    });
  };

  const isValid = batchName.trim() !== '' && 
    template.variables?.every((variable) => variables[variable]?.trim() !== '');

  return (
    <Box>
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Batch Name"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          required
          helperText="Enter a name to identify this batch"
        />

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Selected Recipients ({selectedCustomers.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Messages will be sent to the following customers:
          </Typography>
          <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
            {selectedCustomers.map((customer) => (
              <Typography key={customer.id} variant="body2" sx={{ py: 0.5 }}>
                {customer.name} ({customer.phone})
              </Typography>
            ))}
          </Box>
        </Paper>

        {template.variables && template.variables.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Template Variables
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure custom variables for your message template
            </Typography>
            <Grid container spacing={2}>
              {template.variables.map((variable) => (
                <Grid item xs={12} sm={6} key={variable}>
                  <TextField
                    fullWidth
                    label={variable}
                    value={variables[variable] || ''}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                    required
                    helperText={`Enter value for ${variable}`}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

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

export default CustomerConfigurationStep;
