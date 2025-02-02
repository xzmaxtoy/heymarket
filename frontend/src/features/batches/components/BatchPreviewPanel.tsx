import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ContentCopy as ContentCopyIcon, Check as CheckIcon } from '@mui/icons-material';
import { Template } from '@/features/templates/types';
import { Customer } from '@/types/customer';

interface BatchPreviewPanelProps {
  template: Template | null;
  previewCustomer: Customer | null;
  previewContent: string;
  customVariables: Record<string, string>;
  onVariableChange: (variable: string, value: string) => void;
}

export const BatchPreviewPanel: React.FC<BatchPreviewPanelProps> = ({
  template,
  previewCustomer,
  previewContent,
  customVariables,
  onVariableChange,
}) => {
  const [copied, setCopied] = React.useState(false);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Message Preview */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            Message Preview
            {previewCustomer && ` (${previewCustomer.name})`}
          </Typography>
          <Tooltip title="Copy message">
            <IconButton onClick={handleCopy} size="small">
              {copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'inherit',
            mt: 1,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1,
          }}
        >
          {previewContent || 'Select a template to see preview'}
        </Typography>
      </Paper>

      {/* Variable Configuration */}
      {template && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Variable Values
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {Object.entries(customVariables).map(([variable, value]) => (
              <TextField
                key={variable}
                label={variable}
                value={value}
                onChange={(e) => onVariableChange(variable, e.target.value)}
                size="small"
                fullWidth
                helperText={`Use as: {{${variable}}}`}
              />
            ))}
            {Object.keys(customVariables).length === 0 && (
              <Typography color="text.secondary">
                No variables found in template
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default BatchPreviewPanel;