import React, { useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel, GridRowSelectionModel } from '@mui/x-data-grid';
import { Alert, Box, Button, LinearProgress } from '@mui/material';
import { Customer } from '@/types/customer';
import { CustomerTableToolbar } from './CustomerTableToolbar';
import { Filter, FilterGroup, SavedFilter } from '../filters/types';
import { getErrorMessage } from '@/utils/errorHandling';

interface CustomerDataGridProps {
  customers: Customer[];
  columns: GridColDef[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  selectedCustomers: string[];
  searchText: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSelectionChange: (selectedIds: string[], selectedCustomers: Customer[]) => void;
  onColumnSelectorOpen: () => void;
  activeFilters: FilterGroup[];
  onFiltersChange: (filter: Filter) => void;
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string, filter: Filter) => void;
  onDeleteFilter: (filterId: string) => void;
  onSelectAllFiltered?: () => void;
  error?: string;
  onRetry?: () => void;
}

export const CustomerDataGrid: React.FC<CustomerDataGridProps> = ({
  customers,
  columns,
  loading,
  total,
  page,
  pageSize,
  selectedCustomers,
  searchText,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onSelectionChange,
  onColumnSelectorOpen,
  activeFilters,
  onFiltersChange,
  savedFilters,
  onSaveFilter,
  onDeleteFilter,
  onSelectAllFiltered,
  error,
  onRetry,
}) => {
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    try {
      if (model.page !== page) {
        onPageChange(model.page);
      }
      if (model.pageSize !== pageSize) {
        onPageSizeChange(model.pageSize);
      }
    } catch (err) {
      console.error('Pagination error:', getErrorMessage(err));
    }
  }, [page, pageSize, onPageChange, onPageSizeChange]);

  const handleSelectionChange = useCallback((newSelection: GridRowSelectionModel) => {
    try {
      const selectedIds = newSelection.map(String);
      const selectedCustomerData = customers.filter(customer => 
        selectedIds.includes(customer.id)
      );
      onSelectionChange(selectedIds, selectedCustomerData);
    } catch (err) {
      console.error('Selection error:', getErrorMessage(err));
    }
  }, [customers, onSelectionChange]);

  const toolbarProps = {
    onColumnSelectorOpen,
    searchText,
    onSearchChange,
    activeFilters,
    onFiltersChange,
    savedFilters,
    onSaveFilter,
    onDeleteFilter,
    onSelectAllFiltered,
    totalFilteredCount: total,
    loading,
    error,
    onRetry,
  };

  if (error) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Alert 
          severity="error"
          action={
            onRetry && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={onRetry}
                disabled={loading}
              >
                RETRY
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {loading && (
        <Box sx={{ width: '100%', position: 'relative' }}>
          <LinearProgress />
        </Box>
      )}
      <DataGrid
        rows={customers}
        columns={columns}
        loading={loading}
        rowCount={total}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={handlePaginationModelChange}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectedCustomers}
        onRowSelectionModelChange={handleSelectionChange}
        slots={{
          toolbar: CustomerTableToolbar,
          loadingOverlay: LinearProgress,
        }}
        slotProps={{
          toolbar: toolbarProps,
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            whiteSpace: 'normal',
            lineHeight: 'normal',
            padding: '8px',
          },
        }}
        getRowId={(row: Customer) => row.id}
      />
    </Box>
  );
};

export default CustomerDataGrid;
