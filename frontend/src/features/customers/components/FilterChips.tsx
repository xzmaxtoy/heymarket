import React from 'react';
import { Box, Chip, Button } from '@mui/material';
import { SavedFilter } from '../filters/types';
import { Filter } from '../filters/types';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

interface FilterChipsProps {
  savedFilters: SavedFilter[];
  activeFilter: Filter | null;
  onApplyFilter: (filter: Filter) => void;
  onClearFilter: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  savedFilters,
  activeFilter,
  onApplyFilter,
  onClearFilter,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
      {savedFilters.map((filter) => (
        <Chip
          key={filter.id}
          label={filter.name}
          onClick={() => onApplyFilter(filter.filter)}
          color={activeFilter && JSON.stringify(activeFilter) === JSON.stringify(filter.filter) ? 'primary' : 'default'}
          variant={activeFilter && JSON.stringify(activeFilter) === JSON.stringify(filter.filter) ? 'filled' : 'outlined'}
          sx={{ borderRadius: 2 }}
        />
      ))}
      {activeFilter && activeFilter.conditions.length > 0 && (
        <Button
          startIcon={<FilterAltOffIcon />}
          onClick={onClearFilter}
          size="small"
          color="error"
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Clear Filter
        </Button>
      )}
    </Box>
  );
};
