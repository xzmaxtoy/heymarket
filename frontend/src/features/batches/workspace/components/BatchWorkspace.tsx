import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import { BatchWorkspaceState } from '../types';
import TemplateSelectionStep from './steps/TemplateSelectionStep';
import CustomerConfigurationStep from './steps/CustomerConfigurationStep';
import PreviewAndScheduleStep from './steps/PreviewAndScheduleStep';
import { useFeatureFlag, FEATURE_FLAGS } from '@/hooks/useFeatureFlag';
import { useSystemSettings } from '@/services/settings';

const steps = [
  'Select Template',
  'Configure Recipients',
  'Preview & Schedule'
];

const defaultSettings = {
  batchProcessing: {
    rate: 5,
    maxRetries: 3,
    retryDelay: 300000,
    maxSize: 10000,
  },
  performance: {
    slaWarningThreshold: 900000,
    slaCriticalThreshold: 1800000,
    sampleRate: 100,
  },
  featureFlags: {
    newBatchSystem: false,
    analyticsDashboard: false,
    performanceMonitoring: false,
  },
  cache: {
    previewSize: 1000,
    previewTtl: 3600,
  },
};

interface BatchWorkspaceProps {
  initialState?: BatchWorkspaceState;
}

const defaultState: BatchWorkspaceState = {
  selectedCustomers: [],
  selectedTemplate: null,
  batchName: '',
  priority: 'normal',
  step: 'template',
  filterMode: 'direct',
};

export default function BatchWorkspace({ initialState }: BatchWorkspaceProps) {
  const [state, setState] = useState<BatchWorkspaceState>(initialState || defaultState);

  const { data: settings, loading: settingsLoading, error: settingsError } = useSystemSettings();
  const { isEnabled: useNewPreview } = useFeatureFlag(FEATURE_FLAGS.NEW_PREVIEW_SYSTEM);

  const handleTemplateSelect = (template: BatchWorkspaceState['selectedTemplate']) => {
    setState(prev => ({
      ...prev,
      selectedTemplate: template,
      step: 'customers'
    }));
  };

  const handleCustomersConfigure = (customers: BatchWorkspaceState['selectedCustomers']) => {
    setState(prev => ({
      ...prev,
      selectedCustomers: customers,
      step: 'preview'
    }));
  };

  const handleBack = () => {
    setState(prev => ({
      ...prev,
      step: prev.step === 'preview' ? 'customers' : 'template'
    }));
  };

  const getCurrentStepIndex = () => {
    switch (state.step) {
      case 'template':
        return 0;
      case 'customers':
        return 1;
      case 'preview':
        return 2;
      default:
        return 0;
    }
  };

  const renderStep = () => {
    const currentSettings = settings || defaultSettings;

    switch (state.step) {
      case 'template':
        return (
          <TemplateSelectionStep
            onSelect={handleTemplateSelect}
            selectedTemplate={state.selectedTemplate}
          />
        );
      case 'customers':
        return (
          <CustomerConfigurationStep
            onConfigure={handleCustomersConfigure}
            onBack={handleBack}
            selectedCustomers={state.selectedCustomers}
            template={state.selectedTemplate!}
            filterMode={state.filterMode}
            activeFilters={state.activeFilters}
            searchText={state.searchText}
          />
        );
      case 'preview':
        return (
          <PreviewAndScheduleStep
            state={state}
            onBack={handleBack}
            useNewPreview={useNewPreview}
            settings={currentSettings}
          />
        );
      default:
        return null;
    }
  };

  if (settingsLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (settingsError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load system settings. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Create New Batch
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={getCurrentStepIndex()}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {renderStep()}
      </Paper>
    </Container>
  );
}
