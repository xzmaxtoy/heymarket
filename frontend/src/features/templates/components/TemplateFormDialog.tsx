import React, { useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid,
} from '@mui/material';
import { Template } from '../types';
import { getErrorMessage, withRetry } from '@/utils/errorHandling';
import { useTemplateForm } from '../hooks/useTemplateForm';
import VariableSelector from './VariableSelector';

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  template?: Template;
  title?: string;
}

export const TemplateFormDialog: React.FC<TemplateFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  template,
  title = template ? 'Edit Template' : 'Create Template',
}) => {
  const {
    name,
    content,
    description,
    variables,
    errors,
    saving,
    setName,
    setContent,
    setDescription,
    clearError,
    handleSubmit,
  } = useTemplateForm({
    template,
    onSuccess,
  });

  // Validate variable syntax
  const validateVariables = useCallback((content: string) => {
    const variableRegex = /{{([^{}]+)}}/g;
    const matches = content.match(variableRegex) || [];
    const uniqueVariables = new Set(matches.map(match => match.slice(2, -2).trim()));
    
    // Check for malformed variables
    const malformedRegex = /{{[^}]*}(?!})|(?<!{){[^}]*}}|{[^{]|[^}]}/g;
    const validVariableRegex = /^[a-zA-Z0-9_]+$/;
    
    // Check each variable name is valid
    for (const variable of uniqueVariables) {
      if (!validVariableRegex.test(variable)) {
        errors.content = `Invalid variable name: ${variable}. Use only letters, numbers, and underscores.`;
        return false;
      }
      if (!variables.includes(variable)) {
        errors.content = `Unknown variable: ${variable}`;
        return false;
      }
    }

    return true;
  }, [variables, errors]);

  const handleSave = useCallback(async () => {
    try {
      if (!validateVariables(content)) {
        return;
      }

      const success = await withRetry(async () => {
        return await handleSubmit();
      });

      if (success) {
        onClose();
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      
      // Show more specific error messages based on error type
      if (errorMessage.includes('variable')) {
        errors.content = 'Invalid variable syntax. Please check your template variables.';
      } else if (errorMessage.includes('duplicate')) {
        errors.name = 'A template with this name already exists.';
      } else if (errorMessage.includes('network')) {
        errors.submit = 'Network error occurred. Please check your connection and try again.';
      } else {
        errors.submit = errorMessage;
      }
    }
  }, [handleSubmit, onClose, content, validateVariables, errors]);

  const handleVariableSelect = useCallback((variable: string) => {
    const textArea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textArea) {
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const newContent = 
        content.substring(0, start) + 
        `{{${variable}}}` + 
        content.substring(end);
      setContent(newContent);
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textArea.focus();
        const newPosition = start + variable.length + 4; // 4 for {{}}
        textArea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      setContent(content + `{{${variable}}}`);
    }
  }, [content, setContent]);

  const handleVariableRemove = useCallback((variable: string) => {
    setContent(content.replace(new RegExp(`{{${variable}}}`, 'g'), ''));
  }, [content, setContent]);

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
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Form Fields */}
          <Grid item xs={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {errors.submit && (
                <Alert 
                  severity="error" 
                  onClose={() => clearError('submit')}
                  action={
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={handleSave}
                      disabled={saving}
                    >
                      RETRY
                    </Button>
                  }
                >
                  {errors.submit}
                </Alert>
              )}

              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                onFocus={() => clearError('name')}
                required
                fullWidth
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                onFocus={() => clearError('description')}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                id="template-content"
                label="Content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  validateVariables(e.target.value);
                }}
                error={!!errors.content}
                helperText={errors.content || 'Use customer fields from the right panel as variables'}
                onFocus={() => clearError('content')}
                multiline
                rows={12}
                required
                fullWidth
              />
            </Box>
          </Grid>

          {/* Variable Selector */}
          <Grid item xs={4}>
            <Box sx={{ mt: 1 }}>
              <VariableSelector
                selectedVariables={variables}
                onVariableSelect={handleVariableSelect}
                onVariableRemove={handleVariableRemove}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateFormDialog;
