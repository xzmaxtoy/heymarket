import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
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
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filter,
      search: event.target.value,
    });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      width: '100%'
    }}>
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
        fullWidth
      />
    </Box>
  );
};

export default TemplateListToolbar;
