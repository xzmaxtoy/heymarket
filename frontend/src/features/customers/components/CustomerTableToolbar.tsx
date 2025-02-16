import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Stack,
  Menu,
  MenuItem,
  LinearProgress,
  Typography,
} from '@mui/material';
import {
  ViewColumn as ViewColumnIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  SelectAll as SelectAllIcon,
} from '@mui/icons-material';
import { GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid';
import { Filter, FilterGroup, SavedFilter } from '../filters/types';
import FilterDialog from '../filters/FilterDialog';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectSelectionProgress } from '@/store/slices/customersSlice';
import { loadSavedFilters } from '@/store/thunks/settingsThunks';

interface CustomerTableToolbarProps {
  onColumnSelectorOpen: () => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  activeFilters: FilterGroup[];
  onFiltersChange: (filter: Filter) => void;
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string, filter: Filter) => void;
  onDeleteFilter: (filterId: string) => void;
  onSelectAllFiltered?: () => void;
  totalFilteredCount?: number;
  loading?: boolean;
}

export const CustomerTableToolbar: React.FC<CustomerTableToolbarProps> = ({
  onColumnSelectorOpen,
  searchText,
  onSearchChange,
  activeFilters,
  onFiltersChange,
  savedFilters,
  onSaveFilter,
  onDeleteFilter,
  onSelectAllFiltered,
  totalFilteredCount = 0,
  loading = false,
}) => {
  const selectionProgress = useAppSelector(selectSelectionProgress);
  const dispatch = useAppDispatch();
  const [selectionMenuAnchor, setSelectionMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const handleSelectionMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectionMenuAnchor(event.currentTarget);
  };

  const handleSelectionMenuClose = () => {
    setSelectionMenuAnchor(null);
  };

  const handleSelectAllFiltered = () => {
    handleSelectionMenuClose();
    onSelectAllFiltered?.();
  };

  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true);
  };

  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false);
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  return (
    <GridToolbarContainer>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', p: 1 }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search customers..."
          value={searchText}
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

        <Box sx={{ flexGrow: 1 }}>
          {selectionProgress && (
            <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
              <Typography variant="caption" color="text.secondary" align="center" display="block">
                Selecting customers: {selectionProgress.loaded} of {selectionProgress.total}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(selectionProgress.loaded / selectionProgress.total) * 100}
                sx={{ mt: 0.5 }}
              />
            </Box>
          )}
        </Box>

        <Button
          startIcon={<SelectAllIcon />}
          onClick={handleSelectionMenuOpen}
          variant="outlined"
          size="small"
          disabled={loading || totalFilteredCount === 0 || !!selectionProgress}
        >
          Select
        </Button>

        <Menu
          anchorEl={selectionMenuAnchor}
          open={Boolean(selectionMenuAnchor)}
          onClose={handleSelectionMenuClose}
        >
          <MenuItem onClick={handleSelectAllFiltered}>
            Select All Filtered ({totalFilteredCount} customers)
          </MenuItem>
        </Menu>

        <Tooltip title="Advanced Filter">
          <Button
            startIcon={<FilterListIcon />}
            onClick={handleOpenFilterDialog}
            variant="outlined"
            size="small"
            color={activeFilters.length > 0 ? 'primary' : 'inherit'}
          >
            Filter
            {activeFilters.length > 0 && ` (${activeFilters.length})`}
          </Button>
        </Tooltip>

        <Tooltip title="Column Selection">
          <Button
            startIcon={<ViewColumnIcon />}
            onClick={onColumnSelectorOpen}
            variant="outlined"
            size="small"
          >
            Columns
          </Button>
        </Tooltip>

        <GridToolbarExport />
      </Box>

      <FilterDialog
        open={filterDialogOpen}
        onClose={handleCloseFilterDialog}
        onApply={onFiltersChange}
        savedFilters={savedFilters}
        onSaveFilter={onSaveFilter}
        onDeleteFilter={onDeleteFilter}
      />
    </GridToolbarContainer>
  );
};

export default CustomerTableToolbar;
