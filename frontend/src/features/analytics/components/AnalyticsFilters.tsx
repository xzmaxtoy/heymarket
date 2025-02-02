import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { DateValidationError } from '@mui/x-date-pickers';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { AnalyticsFilters as AnalyticsFiltersType } from '../types';

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersType;
  onFiltersChange: (filters: AnalyticsFiltersType) => void;
  onRefresh: () => void;
  onExport: () => void;
  loading?: boolean;
}

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  loading = false
}) => {
  const handleDateChange = (field: 'start' | 'end') => (value: Dayjs | null) => {
    if (value && value.isValid()) {
      onFiltersChange({
        ...filters,
        dateRange: {
          ...filters.dateRange,
          [field]: value.toISOString()
        }
      });
    }
  };

  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    onFiltersChange({
      ...filters,
      status: event.target.value as string[]
    });
  };

  const handleErrorTypesChange = (event: SelectChangeEvent<string[]>) => {
    onFiltersChange({
      ...filters,
      errorTypes: event.target.value as string[]
    });
  };

  const statusOptions = [
    'completed',
    'failed',
    'processing',
    'pending',
    'paused'
  ];

  const errorTypeOptions = [
    'rate_limit',
    'invalid_request',
    'timeout',
    'network_error',
    'unknown'
  ];

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          {/* Date Range */}
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Start Date"
              value={dayjs(filters.dateRange.start)}
              onChange={handleDateChange('start')}
              disabled={loading}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small"
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="End Date"
              value={dayjs(filters.dateRange.end)}
              onChange={handleDateChange('end')}
              disabled={loading}
              minDate={dayjs(filters.dateRange.start)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small"
                }
              }}
            />
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={filters.status || []}
                onChange={handleStatusChange}
                disabled={loading}
                label="Status"
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Error Types Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Error Types</InputLabel>
              <Select
                multiple
                value={filters.errorTypes || []}
                onChange={handleErrorTypesChange}
                disabled={loading}
                label="Error Types"
              >
                {errorTypeOptions.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <span>
                  <IconButton
                    onClick={onRefresh}
                    disabled={loading}
                    color="primary"
                  >
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Export Data">
                <span>
                  <IconButton
                    onClick={onExport}
                    disabled={loading}
                    color="primary"
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AnalyticsFilters;
