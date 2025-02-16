import React, { useEffect } from 'react';
import { Box, Paper, Button } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectSelectedCustomers,
  selectActiveFilters,
  selectSavedFilters,
  selectVisibleColumns,
  selectCustomersLoading,
  selectCustomersError,
  selectCustomersPagination,
  selectCustomersData,
  selectSelectedCustomersData,
  setSelectedCustomers,
  setActiveFilters,
  addSavedFilter,
  removeSavedFilter,
  clearSavedFilters,
  setVisibleColumns,
  setPageSize,
  setCurrentPage,
} from '@/store/slices/customersSlice';
import { fetchCustomers, selectAllFilteredCustomers } from '@/store/thunks/customerThunks';
import { loadColumnVisibility, loadSavedFilters } from '@/store/thunks/settingsThunks';
import { ALL_COLUMNS, DEFAULT_COLUMNS, Customer } from '@/types/customer';
import { Filter, FilterGroup, SavedFilter } from './filters/types';
import CustomerDataGrid from './components/CustomerDataGrid';
import ColumnSelector from './components/ColumnSelector';
import FilterDialog from './filters/FilterDialog';
import BatchWorkspaceDialog from '../batches/workspace/components/BatchWorkspaceDialog';
import { GridLogicOperator } from '@mui/x-data-grid';

export const CustomerSelection: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const selectedCustomers = useAppSelector(selectSelectedCustomers);
  const selectedCustomersData = useAppSelector(selectSelectedCustomersData);
  const activeFilters = useAppSelector(selectActiveFilters);
  const savedFilters = useAppSelector(selectSavedFilters);
  const visibleColumns = useAppSelector(selectVisibleColumns);
  const loading = useAppSelector(selectCustomersLoading);
  const error = useAppSelector(selectCustomersError);
  const { pageSize, currentPage, total } = useAppSelector(selectCustomersPagination);
  const customers = useAppSelector(selectCustomersData);

  // Local state
  const [columnSelectorOpen, setColumnSelectorOpen] = React.useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  const [batchWorkspaceOpen, setBatchWorkspaceOpen] = React.useState(false);

  // Load saved settings and filters
  useEffect(() => {
    const loadSettings = async () => {
      // Clear existing filters
      dispatch(clearSavedFilters());
      
      // Load column visibility settings and saved filters
      await Promise.all([
        dispatch(loadColumnVisibility()),
        dispatch(loadSavedFilters())
      ]);
    };

    loadSettings();
  }, [dispatch]);

  // Load customers when filters, search, or pagination changes
  useEffect(() => {
    dispatch(fetchCustomers({
      page: currentPage + 1,
      pageSize,
      filters: activeFilters,
      searchText
    }));
  }, [dispatch, currentPage, pageSize, activeFilters, searchText]);

  // Get visible columns configuration
  const columns = ALL_COLUMNS
    .filter(col => visibleColumns.has(col.field))
    .map(col => ({
      ...col,
      type: col.type === 'number' ? 'number' : undefined,
      valueFormatter: (params: { value: any }) => {
        if (col.type === 'date' && params.value) {
          return new Date(params.value).toLocaleDateString();
        }
        return params.value;
      },
    }));

  // Handlers
  const handleSelectionChange = (selectedIds: string[], selectedCustomers: Customer[]) => {
    dispatch(setSelectedCustomers(selectedIds));
  };

  const handleFiltersChange = (filter: Filter) => {
    dispatch(setActiveFilters([{
      id: crypto.randomUUID(),
      conditions: filter.conditions.map(condition => ({
        ...condition,
        id: condition.id || crypto.randomUUID()
      })),
      operator: filter.operator || GridLogicOperator.And,
    }]));
  };

  const handleSaveFilter = (name: string, filter: Filter) => {
    const savedFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      filter,
    };
    dispatch(addSavedFilter(savedFilter));
  };

  const handleDeleteFilter = (filterId: string) => {
    dispatch(removeSavedFilter(filterId));
  };

  const handleColumnToggle = (field: string) => {
    const newSelected = new Set(visibleColumns);
    if (newSelected.has(field)) {
      if (newSelected.size > 1) { // Prevent removing all columns
        newSelected.delete(field);
        dispatch(setVisibleColumns(Array.from(newSelected)));
      }
    } else {
      newSelected.add(field);
      dispatch(setVisibleColumns(Array.from(newSelected)));
    }
  };

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    dispatch(setPageSize(newPageSize));
  };

  const handleSelectAllFiltered = () => {
    dispatch(selectAllFilteredCustomers({
      filters: activeFilters,
      searchText
    }));
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => setBatchWorkspaceOpen(true)}
          disabled={selectedCustomers.length === 0}
        >
          Create Batch Message
        </Button>
      </Box>

      <Paper sx={{ height: 'calc(100% - 20px)', width: '100%', p: 2 }}>
        <CustomerDataGrid
          customers={customers}
          columns={columns}
          loading={loading}
          total={total}
          page={currentPage}
          pageSize={pageSize}
          selectedCustomers={selectedCustomers}
          searchText={searchText}
          onSearchChange={setSearchText}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSelectionChange={handleSelectionChange}
          onColumnSelectorOpen={() => setColumnSelectorOpen(true)}
          activeFilters={activeFilters}
          onFiltersChange={handleFiltersChange}
          savedFilters={savedFilters}
          onSaveFilter={handleSaveFilter}
          onDeleteFilter={handleDeleteFilter}
          onSelectAllFiltered={handleSelectAllFiltered}
        />
      </Paper>

      <ColumnSelector
        open={columnSelectorOpen}
        onClose={() => setColumnSelectorOpen(false)}
        selectedColumns={visibleColumns}
        onColumnToggle={handleColumnToggle}
      />

      <FilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={handleFiltersChange}
        savedFilters={savedFilters}
        onSaveFilter={handleSaveFilter}
        onDeleteFilter={handleDeleteFilter}
      />

      <BatchWorkspaceDialog
        open={batchWorkspaceOpen}
        onClose={() => setBatchWorkspaceOpen(false)}
        initialState={{
          selectedCustomers: selectedCustomersData,
          filterMode: selectedCustomers.length > 0 ? 'direct' : 'filtered',
          activeFilters: activeFilters,
          searchText: searchText,
          selectedTemplate: null,
          batchName: '',
          priority: 'normal',
          step: 'template'
        }}
      />
    </Box>
  );
};

export default CustomerSelection;
