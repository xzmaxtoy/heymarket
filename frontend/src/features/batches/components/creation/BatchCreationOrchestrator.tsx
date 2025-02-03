import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  Box,
} from '@mui/material';
import TemplateSelectionStep from '../template/TemplateSelectionStep';
import CustomerConfigurationStep from './CustomerConfigurationStep';
import PreviewAndScheduleStep from '../preview/PreviewAndScheduleStep';
import ValidationSummary from '../validation/ValidationSummary';
import { useFeatureFlag, FEATURE_FLAGS } from '@/hooks/useFeatureFlag';
import { useAppSelector } from '@/store';
import { BatchCreationConfig, BatchCustomerData, BatchStatus } from '@/types/batch';
import { Template } from '@/types/template';
import { Customer } from '@/types/customer';

interface BatchCreationOrchestratorProps {
  open: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
  onSuccess?: (batchId: string) => void;
}

interface ScheduleConfig {
  scheduleTime?: string;
  batchName: string;
  priority: 'high' | 'normal' | 'low';
}

interface CustomerWithVariables extends Customer {
  variables: Record<string, string>;
}

const steps = [
  'Select Template',
  'Configure Recipients',
  'Preview & Schedule'
];

export const BatchCreationOrchestrator: React.FC<BatchCreationOrchestratorProps> = ({
  open,
  onClose,
  selectedCustomers,
  onSuccess
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [templateData, setTemplateData] = useState<Template | null>(null);
  const [customerData, setCustomerData] = useState<CustomerWithVariables[]>(
    selectedCustomers.map(customer => ({
      ...customer,
      variables: {}
    }))
  );
  const [scheduleData, setScheduleData] = useState<ScheduleConfig | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const useNewPreview = useFeatureFlag(FEATURE_FLAGS.NEW_PREVIEW_SYSTEM).isEnabled;
  const userId = useAppSelector(state => state.auth.user?.id);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleTemplateSelect = (template: Template) => {
    setTemplateData(template);
    handleNext();
  };

  const handleCustomerConfigure = (customers: CustomerWithVariables[]) => {
    setCustomerData(customers);
    handleNext();
  };

  const handleSchedule = async (scheduleConfig: ScheduleConfig) => {
    try {
      setScheduleData(scheduleConfig);
      
      // Create batch config
      const batchConfig: BatchCreationConfig = {
        templateId: templateData?.id || '',
        customers: customerData.map(customer => ({
          customer,
          variables: customer.variables
        })),
        scheduleFor: scheduleConfig.scheduleTime,
        name: scheduleConfig.batchName,
        priority: scheduleConfig.priority,
        userId
      };

      // Create batch using v2 API
      const response = await fetch('/api/v2/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchConfig),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create batch');
      }

      const result = await response.json();
      
      // Show success message or handle completion
      if (result.success) {
        onSuccess?.(result.data.id);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create batch');
      }
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Failed to create batch']);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <TemplateSelectionStep
            onSelect={handleTemplateSelect}
            onCancel={onClose}
          />
        );
      case 1:
        return templateData && (
          <CustomerConfigurationStep
            customers={customerData}
            template={templateData}
            onConfigure={handleCustomerConfigure}
            onBack={handleBack}
          />
        );
      case 2:
        return templateData && (
          <PreviewAndScheduleStep
            customers={customerData}
            template={templateData}
            onSchedule={handleSchedule}
            onBack={handleBack}
            useNewPreview={useNewPreview}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>Create Batch</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {validationErrors.length > 0 && (
            <ValidationSummary
              errors={validationErrors}
              onClear={() => setValidationErrors([])}
            />
          )}

          {getStepContent(activeStep)}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
