import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBatchesFilter, setFilter } from '@/store/slices/batchesSlice';
import { BatchStatus, BATCH_STATUS_LABELS } from '../types';
import BatchStatusChip from './BatchStatusChip';

export const BatchListToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const filter = useAppSelector(selectBatchesFilter);
  const [searchInput, setSearchInput] = React.useState(filter.search || '');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handleSearchSubmit = () => {
    dispatch(setFilter({
      ...filter,
      search: searchInput.trim(),
    }));
  };

  const handleSearchClear = () => {
    setSearchInput('');
    dispatch(setFilter({
      ...filter,
      search: '',
    }));
  };

  const handleStatusChange = (event: SelectChangeEvent<BatchStatus[]>) => {
    const value = event.target.value as BatchStatus[];
    dispatch(setFilter({
      ...filter,
      status: value,
    }));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <Box sx={{ 
      p: 2, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      flexWrap: 'wrap',
    }}>
      {/* Search Field */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        flex: 1,
        minWidth: 200,
      }}>
        <TextField
          placeholder="Search batches..."
          value={searchInput}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: searchInput && (
              <IconButton size="small" onClick={handleSearchClear}>
                <ClearIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      {/* Status Filter */}
      <FormControl sx={{ minWidth: 200 }} size="small">
        <InputLabel id="status-filter-label">Status</InputLabel>
        <Select
          labelId="status-filter-label"
          multiple
          value={filter.status || []}
          onChange={handleStatusChange}
          input={<OutlinedInput label="Status" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((status) => (
                <BatchStatusChip key={status} status={status} />
              ))}
            </Box>
          )}
        >
          {Object.entries(BATCH_STATUS_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              <BatchStatusChip status={value as BatchStatus} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Additional Filters Button */}
      <Tooltip title="More filters">
        <IconButton>
          <FilterListIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default BatchListToolbar;