import React from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Typography } from '@mui/material';
import { Template } from '../types';
import TemplateActions from './TemplateActions';

interface TemplateDataGridProps {
  templates: Template[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onTemplateSelect: (template: Template) => void;
  onPreviewClick: (template: Template) => void;
  onEditClick: (template: Template) => void;
  onDeleteClick: (template: Template) => void;
}

export const TemplateDataGrid: React.FC<TemplateDataGridProps> = ({
  templates,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onTemplateSelect,
  onPreviewClick,
  onEditClick,
  onDeleteClick,
}) => {
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 300,
    },
    {
      field: 'variables',
      headerName: 'Variables',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Template>) => (
        <Typography variant="body2">
          {params.row.variables.join(', ')}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Template>) => (
        <TemplateActions
          template={params.row}
          onPreviewClick={onPreviewClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ),
    },
  ];

  return (
    <DataGrid
      rows={templates}
      columns={columns}
      loading={loading}
      rowCount={total}
      pageSizeOptions={[5, 10, 25, 50]}
      paginationMode="server"
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={({ page: newPage, pageSize: newPageSize }) => {
        onPageChange(newPage);
        onPageSizeChange(newPageSize);
      }}
      onRowClick={(params) => onTemplateSelect(params.row)}
      disableRowSelectionOnClick
      getRowId={(row: Template) => row.id}
      sx={{
        '& .MuiDataGrid-cell': {
          whiteSpace: 'normal',
          lineHeight: 'normal',
          padding: '8px',
        },
      }}
    />
  );
};

export default TemplateDataGrid;