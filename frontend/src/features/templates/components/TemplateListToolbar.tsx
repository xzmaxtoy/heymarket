import React from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { TemplateFilter } from '../types';

interface TemplateListToolbarProps {
  filter: TemplateFilter;
  onFilterChange: (filter: TemplateFilter) => void;
  onCreateClick: () => void;
}

export const TemplateListToolbar: React.FC<TemplateListToolbarProps> = ({
  filter,
  onFilterChange,
  onCreateClick,
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filter,
      search: event.target.value,
    });
  };

  return (
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        size="small"
        placeholder="Search templates..."
        value={filter.search || ''}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ width: 300 }}
      />
      <Box sx={{ flex: 1 }} />
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
      >
        Create Template
      </Button>
    </Box>
  );
};

export default TemplateListToolbar;