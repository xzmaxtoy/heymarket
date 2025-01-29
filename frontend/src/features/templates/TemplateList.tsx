import React from 'react';
import { Box, Paper } from '@mui/material';
import { Template } from './types';
import { useTemplateList } from './hooks/useTemplateList';
import TemplateListToolbar from './components/TemplateListToolbar';
import TemplateDataGrid from './components/TemplateDataGrid';

interface TemplateListProps {
  onCreateClick: () => void;
  onEditClick: (template: Template) => void;
  onPreviewClick: (template: Template) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  onCreateClick,
  onEditClick,
  onPreviewClick,
}) => {
  const {
    templates,
    loading,
    total,
    currentPage,
    pageSize,
    filter,
    onFilterChange,
    onDeleteTemplate,
    onPageChange,
    onPageSizeChange,
    onTemplateSelect,
  } = useTemplateList();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TemplateListToolbar
        filter={filter}
        onFilterChange={onFilterChange}
        onCreateClick={onCreateClick}
      />

      <Paper sx={{ flex: 1, m: 2 }}>
        <TemplateDataGrid
          templates={templates}
          loading={loading}
          total={total}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onTemplateSelect={onTemplateSelect}
          onPreviewClick={onPreviewClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteTemplate}
        />
      </Paper>
    </Box>
  );
};

export default TemplateList;