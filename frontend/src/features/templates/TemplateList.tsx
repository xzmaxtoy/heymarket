import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { Template } from './types';
import { useTemplateList } from './hooks/useTemplateList';
import TemplateListToolbar from './components/TemplateListToolbar';
import TemplateDataGrid from './components/TemplateDataGrid';
import TemplateFormDialog from './components/TemplateFormDialog';

interface TemplateListProps {
  onPreviewClick: (template: Template) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
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

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>();

  const handleCreateClick = () => {
    setEditingTemplate(undefined);
    setFormOpen(true);
  };

  const handleEditClick = (template: Template) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTemplate(undefined);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TemplateListToolbar
        filter={filter}
        onFilterChange={onFilterChange}
        onCreateClick={handleCreateClick}
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
          onEditClick={handleEditClick}
          onDeleteClick={onDeleteTemplate}
        />
      </Paper>

      <TemplateFormDialog
        open={formOpen}
        onClose={handleFormClose}
        template={editingTemplate}
      />
    </Box>
  );
};

export default TemplateList;