import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { GridLogicOperator } from '@mui/x-data-grid';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterBuilder from './FilterBuilder';
import { Filter, FilterOperator } from './types';
import { useAppDispatch } from '@/store';
import { loadSavedFilters } from '@/store/thunks/settingsThunks';
import { saveFilter, deleteFilter } from '@/store/slices/customersSlice';

import { SavedFilter } from './types';

export interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (filter: Filter) => void;
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string, filter: Filter) => void;
  onDeleteFilter: (id: string) => void;
}

const convertOperator = (operator: string): FilterOperator => {
  switch (operator) {
    case 'greater_than': return 'greaterThan';
    case 'less_than': return 'lessThan';
    case 'starts_with': return 'startsWith';
    case 'ends_with': return 'endsWith';
    case 'equals': return 'equals';
    case 'contains': return 'contains';
    case 'in_list': return 'in_list';
    case 'is_empty': return 'is_empty';
    case 'is_not_empty': return 'is_not_empty';
    case 'between': return 'between';
    default: return 'equals';
  }
};

const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onClose,
  onApply,
  savedFilters,
  onSaveFilter,
  onDeleteFilter,
}) => {
  const dispatch = useAppDispatch();
  const [currentFilter, setCurrentFilter] = useState<Filter>({
    conditions: [],
    operator: GridLogicOperator.And,
  });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<SavedFilter | null>(null);

  // Load saved filters when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(loadSavedFilters());
    }
  }, [open, dispatch]);

  const handleFilterChange = (filter: Filter) => {
    setCurrentFilter(filter);
  };

  const handleApply = () => {
    onApply(currentFilter);
    onClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, filter: SavedFilter) => {
    setMenuAnchor(event.currentTarget);
    setSelectedFilter(filter);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedFilter(null);
  };

  const handleSaveFilter = async () => {
    const name = prompt('Enter a name for this filter:');
    if (name) {
      const newFilter: SavedFilter = {
        id: crypto.randomUUID(),
        name,
        filter: currentFilter,
      };
      await dispatch(saveFilter(newFilter));
    }
  };

  const handleDeleteFilter = async () => {
    if (selectedFilter) {
      await dispatch(deleteFilter(selectedFilter.id));
      handleMenuClose();
    }
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    const newFilter: Filter = {
      conditions: savedFilter.filter.conditions.map(c => ({
        ...c,
        value2: c.value2 || null // Ensure value2 is handled
      })),
      operator: savedFilter.filter.operator,
    };
    setCurrentFilter(newFilter);
    onApply(newFilter); // Apply filter immediately when loaded
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Filter Customers</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Saved Filters
          </Typography>
          {savedFilters.map((filter) => (
            <Box
              key={filter.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Button
                variant="text"
                onClick={() => handleLoadFilter(filter)}
              >
                {filter.name}
              </Button>
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, filter)}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          ))}
        </Box>

        <FilterBuilder
          filter={currentFilter}
          onChange={handleFilterChange}
        />

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleDeleteFilter}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Filter
          </MenuItem>
        </Menu>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          startIcon={<SaveIcon />}
          onClick={handleSaveFilter}
        >
          Save Filter
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          color="primary"
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterDialog;
