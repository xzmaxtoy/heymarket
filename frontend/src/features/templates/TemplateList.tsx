import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { Template } from './types';
import { Customer } from '@/types/customer';
import { useTemplateList } from './hooks/useTemplateList';
import TemplateListToolbar from './components/TemplateListToolbar';
import TemplateDataGrid from './components/TemplateDataGrid';
import TemplateFormDialog from './components/TemplateFormDialog';
import TemplatePreviewDialog from './components/TemplatePreviewDialog';

interface TemplateListProps {
  selectedCustomer?: Customer;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  selectedCustomer,
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
    reloadTemplates,
  } = useTemplateList();

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>();

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | undefined>();

  const handleCreateClick = () => {
    setEditingTemplate(undefined);
    setFormOpen(true);
  };

  const handleEditClick = (template: Template) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handlePreviewClick = (template: Template) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTemplate(undefined);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewTemplate(undefined);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    reloadTemplates();
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
          onPreviewClick={handlePreviewClick}
          onEditClick={handleEditClick}
          onDeleteClick={onDeleteTemplate}
        />
      </Paper>

      <TemplateFormDialog
        open={formOpen}
        onClose={handleFormClose}
        template={editingTemplate}
        onSuccess={handleFormSuccess}
      />

      {previewTemplate && (
        <TemplatePreviewDialog
          open={previewOpen}
          onClose={handlePreviewClose}
          template={previewTemplate}
          customer={selectedCustomer}
        />
      )}
    </Box>
  );
};

export default TemplateList;