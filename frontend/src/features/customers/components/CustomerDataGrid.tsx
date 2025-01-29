import React from 'react';
import { DataGrid, GridColDef, GridPaginationModel, GridRowSelectionModel } from '@mui/x-data-grid';
import { Customer } from '@/types/customer';
import { CustomerTableToolbar } from './CustomerTableToolbar';
import { FilterGroup, SavedFilter } from '../filters/types';

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
  onFiltersChange: (filters: FilterGroup[]) => void;
  savedFilters: SavedFilter[];
  onSaveFilter: (filter: SavedFilter) => void;
  onDeleteFilter: (filterId: string) => void;
  onSelectAllFiltered?: () => void;
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
}) => {
  const handlePaginationModelChange = (model: GridPaginationModel) => {
    if (model.page !== page) {
      onPageChange(model.page);
    }
    if (model.pageSize !== pageSize) {
      onPageSizeChange(model.pageSize);
    }
  };

  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    const selectedIds = newSelection.map(String);
    const selectedCustomerData = customers.filter(customer => 
      selectedIds.includes(customer.id)
    );
    onSelectionChange(selectedIds, selectedCustomerData);
  };

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
  };

  return (
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
  );
};

export default CustomerDataGrid;