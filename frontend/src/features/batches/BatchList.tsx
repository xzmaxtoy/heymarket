import React from 'react';
import { Box, Paper } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectBatches,
  selectBatchesLoading,
  selectBatchesPagination,
  selectBatchesFilter,
  setCurrentPage,
  setPageSize,
} from '@/store/slices/batchesSlice';
import { fetchBatches, cancelBatch } from '@/store/thunks/batchThunks';
import { Batch } from './types';
import BatchListToolbar from './components/BatchListToolbar';
import BatchStatusChip from './components/BatchStatusChip';
import BatchProgress from './components/BatchProgress';
import BatchActions from './components/BatchActions';

export const BatchList: React.FC = () => {
  const dispatch = useAppDispatch();
  const batches = useAppSelector(selectBatches);
  const loading = useAppSelector(selectBatchesLoading);
  const { pageSize, currentPage, total } = useAppSelector(selectBatchesPagination);
  const filter = useAppSelector(selectBatchesFilter);

  // Load batches on mount and when filter/pagination changes
  React.useEffect(() => {
    dispatch(fetchBatches({ page: currentPage + 1, pageSize, filter }));
  }, [dispatch, currentPage, pageSize, filter]);

  const handleCancelBatch = async (batchId: string) => {
    try {
      await dispatch(cancelBatch(batchId)).unwrap();
      // Refresh list after cancellation
      dispatch(fetchBatches({ page: currentPage + 1, pageSize, filter }));
    } catch (error) {
      console.error('Failed to cancel batch:', error);
    }
  };

  const handleRefreshBatch = (batchId: string) => {
    dispatch(fetchBatches({ page: currentPage + 1, pageSize, filter }));
  };

  const handlePaginationChange = (page: number, newPageSize: number) => {
    if (newPageSize !== pageSize) {
      dispatch(setPageSize(newPageSize));
    }
    if (page !== currentPage) {
      dispatch(setCurrentPage(page));
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <BatchStatusChip status={params.value} />
      ),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 200,
      renderCell: (params) => (
        <BatchProgress batch={params.row as Batch} />
      ),
    },
    {
      field: 'failed_count',
      headerName: 'Failed',
      width: 100,
      align: 'center',
    },
    {
      field: 'scheduled_for',
      headerName: 'Scheduled',
      width: 170,
      valueFormatter: (params) => 
        params.value ? new Date(params.value).toLocaleString() : '-',
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 170,
      valueFormatter: (params) => 
        new Date(params.value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <BatchActions
          batch={params.row as Batch}
          onCancel={handleCancelBatch}
          onRefresh={() => handleRefreshBatch(params.row.id)}
        />
      ),
    },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BatchListToolbar />

      <Paper sx={{ flex: 1, m: 2 }}>
        <DataGrid
          rows={batches}
          columns={columns}
          loading={loading}
          rowCount={total}
          pageSizeOptions={[10, 25, 50]}
          paginationMode="server"
          paginationModel={{ page: currentPage, pageSize }}
          onPaginationModelChange={(model) => 
            handlePaginationChange(model.page, model.pageSize)
          }
          disableRowSelectionOnClick
          getRowId={(row: Batch) => row.id}
        />
      </Paper>
    </Box>
  );
};

export default BatchList;