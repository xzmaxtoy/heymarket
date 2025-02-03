import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  TextField,
  LinearProgress,
  Alert,
  Stack,
  Chip,
  InputLabel,
} from '@mui/material';
import { BatchAlert } from '@/types/alerts';
import { useNotificationExport } from '../hooks/useNotificationExport';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  notifications: BatchAlert[];
  selectedIds?: string[];
}

const availableFields: (keyof BatchAlert)[] = [
  'id',
  'message',
  'severity',
  'channels',
  'delivered_at',
  'read_at',
];

const formatOptions = {
  date: ['YYYY-MM-DD HH:mm:ss', 'MM/DD/YYYY', 'DD/MM/YYYY', 'ISO'],
  number: ['0', '0.0', '0.00', '0.000'],
  boolean: ['yes/no', 'true/false', '1/0'] as const,
};

export default function ExportDialog({
  open,
  onClose,
  notifications,
  selectedIds,
}: ExportDialogProps) {
  const {
    exporting,
    progress,
    error,
    exportNotifications,
    cancelExport,
  } = useNotificationExport(notifications);

  const [format, setFormat] = useState<'csv' | 'excel' | 'json'>('csv');
  const [selectedFields, setSelectedFields] = useState<(keyof BatchAlert)[]>(availableFields);
  const [filename, setFilename] = useState('notifications-export');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [dateFormat, setDateFormat] = useState(formatOptions.date[0]);
  const [numberFormat, setNumberFormat] = useState(formatOptions.number[2]);
  const [booleanFormat, setBooleanFormat] = useState<typeof formatOptions.boolean[number]>('yes/no');

  const handleExport = async () => {
    await exportNotifications(notifications, {
      format,
      fields: selectedFields,
      filename,
      includeMetadata,
      customFormatting: {
        dateFormat,
        numberFormat,
        booleanFormat,
      },
    });
    onClose();
  };

  const handleFieldToggle = (field: keyof BatchAlert) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  return (
    <Dialog open={open} onClose={exporting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Export Notifications
        {selectedIds?.length ? ` (${selectedIds.length} selected)` : ''}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {exporting ? (
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Exporting notifications... {Math.round(progress)}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
            <Button onClick={cancelExport}>Cancel</Button>
          </Box>
        ) : (
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value as typeof format)}
                size="small"
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              size="small"
              fullWidth
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Fields to Export
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {availableFields.map(field => (
                  <Chip
                    key={field}
                    label={field}
                    color={selectedFields.includes(field) ? 'primary' : 'default'}
                    onClick={() => handleFieldToggle(field)}
                    variant={selectedFields.includes(field) ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                />
              }
              label="Include Metadata"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Formatting Options
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  >
                    {formatOptions.date.map(format => (
                      <MenuItem key={format} value={format}>
                        {format}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Number Format</InputLabel>
                  <Select
                    value={numberFormat}
                    onChange={(e) => setNumberFormat(e.target.value)}
                  >
                    {formatOptions.number.map(format => (
                      <MenuItem key={format} value={format}>
                        {format}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Boolean Format</InputLabel>
                  <Select
                    value={booleanFormat}
                    onChange={(e) => setBooleanFormat(e.target.value as typeof booleanFormat)}
                  >
                    {formatOptions.boolean.map(format => (
                      <MenuItem key={format} value={format}>
                        {format}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={exporting || selectedFields.length === 0}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}
