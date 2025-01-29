import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Paper,
  Alert,
  Grid,
  IconButton,
  useTheme,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Smartphone as SmartphoneIcon,
  Computer as ComputerIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { Template } from '../types';
import { Customer } from '@/types/customer';
import { useTemplatePreview } from '../hooks/useTemplatePreview';
import { FIELD_LABELS } from '@/features/customers/filters/types';

interface TemplatePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  template: Template;
  customer?: Customer;
}

export const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  open,
  onClose,
  template,
  customer,
}) => {
  const theme = useTheme();
  const [mobileView, setMobileView] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  
  const {
    previewCustomer,
    customVariables,
    previewContent,
    missingVariables,
    setPreviewCustomer,
    setVariableValue,
    resetPreview,
  } = useTemplatePreview(template);

  // Set initial customer when dialog opens
  React.useEffect(() => {
    if (open && customer) {
      setPreviewCustomer(customer);
    }
    return () => resetPreview();
  }, [open, customer, setPreviewCustomer, resetPreview]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Preview Template: {template.name}
          </Typography>
          <IconButton
            color={mobileView ? 'primary' : 'default'}
            onClick={() => setMobileView(true)}
          >
            <SmartphoneIcon />
          </IconButton>
          <IconButton
            color={!mobileView ? 'primary' : 'default'}
            onClick={() => setMobileView(false)}
          >
            <ComputerIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2}>
          {/* Preview Panel */}
          <Grid item xs={mobileView ? 6 : 8}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Preview Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  Message Preview
                </Typography>
                <IconButton onClick={handleCopy} size="small">
                  {copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
                </IconButton>
              </Box>

              {/* Preview Content */}
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 2,
                  ...(mobileView && {
                    maxWidth: 375,
                    mx: 'auto',
                    borderRadius: '20px',
                  }),
                }}
              >
                <Typography
                  variant="body1"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: mobileView ? theme.typography.body1.fontFamily : 'monospace',
                  }}
                >
                  {previewContent || 'No preview available'}
                </Typography>
              </Paper>
            </Box>
          </Grid>

          {/* Variables Panel */}
          <Grid item xs={mobileView ? 6 : 4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1">
                Variable Values
              </Typography>

              {missingVariables.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Missing values for: {missingVariables.map(v => FIELD_LABELS[v] || v).join(', ')}
                </Alert>
              )}

              {template.variables.map((variable) => (
                <TextField
                  key={variable}
                  label={FIELD_LABELS[variable] || variable}
                  value={
                    customVariables[variable] ||
                    (previewCustomer && String(previewCustomer[variable as keyof Customer])) ||
                    ''
                  }
                  onChange={(e) => setVariableValue(variable, e.target.value)}
                  size="small"
                  fullWidth
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplatePreviewDialog;