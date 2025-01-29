import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import { Template } from '../types';
import { useTemplateForm } from '../hooks/useTemplateForm';

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  template?: Template;
  title?: string;
}

export const TemplateFormDialog: React.FC<TemplateFormDialogProps> = ({
  open,
  onClose,
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
    onSuccess: onClose,
  });

  const handleSave = async () => {
    const success = await handleSubmit();
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {errors.submit && (
            <Alert severity="error" onClose={() => clearError('submit')}>
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
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={!!errors.content}
            helperText={errors.content || 'Use {{variable}} syntax for dynamic content'}
            onFocus={() => clearError('content')}
            multiline
            rows={6}
            required
            fullWidth
          />

          {variables.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Detected Variables:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {variables.map((variable) => (
                  <Chip
                    key={variable}
                    label={variable}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
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