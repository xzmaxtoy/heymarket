import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

export interface NotificationFilters {
  search: string;
  severity: string[];
  channels: string[];
  status: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

interface NotificationFiltersProps {
  filters: NotificationFilters;
  onFiltersChange: (filters: NotificationFilters) => void;
}

const SEVERITY_OPTIONS = ['error', 'warning'];
const CHANNEL_OPTIONS = ['email', 'slack', 'push'];
const STATUS_OPTIONS = ['read', 'unread'];

export default function NotificationFilters({ filters, onFiltersChange }: NotificationFiltersProps) {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: event.target.value,
    });
  };

  const handleMultiSelectChange = (field: keyof NotificationFilters) => (
    event: SelectChangeEvent<string[]>
  ) => {
    onFiltersChange({
      ...filters,
      [field]: event.target.value,
    });
  };

  const handleDateChange = (field: 'start' | 'end') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: event.target.value,
      },
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      severity: [],
      channels: [],
      status: [],
      dateRange: {
        start: '',
        end: '',
      },
    });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={filters.search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
          sx={{ flexGrow: 1 }}
        />
        <IconButton onClick={handleClearFilters} size="small">
          <ClearIcon />
        </IconButton>
      </Box>

      <Box display="flex" gap={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            multiple
            value={filters.severity}
            onChange={handleMultiSelectChange('severity')}
            label="Severity"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {SEVERITY_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Channels</InputLabel>
          <Select
            multiple
            value={filters.channels}
            onChange={handleMultiSelectChange('channels')}
            label="Channels"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {CHANNEL_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            multiple
            value={filters.status}
            onChange={handleMultiSelectChange('status')}
            label="Status"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="From"
          type="date"
          size="small"
          value={filters.dateRange.start}
          onChange={handleDateChange('start')}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="To"
          type="date"
          size="small"
          value={filters.dateRange.end}
          onChange={handleDateChange('end')}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Box>
  );
}
