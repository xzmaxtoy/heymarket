import React, { useState } from 'react';
import { Box, Paper, Button, useTheme, useMediaQuery } from '@mui/material';
import { Template } from './types';
import { Customer } from '@/types/customer';
import { useTemplateList } from './hooks/useTemplateList';
import TemplateListToolbar from './components/TemplateListToolbar';
import TemplateDataGrid from './components/TemplateDataGrid';
import TemplateCardGrid from './components/TemplateCardGrid';
import TemplateFormDialog from './components/TemplateFormDialog';
import TemplatePreviewDialog from './components/TemplatePreviewDialog';
import ViewToggle from '@/components/ViewToggle';
import { Add as AddIcon } from '@mui/icons-material';

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(isMobile ? 'grid' : 'table');

  // Update view mode when screen size changes
  React.useEffect(() => {
    setViewMode(isMobile ? 'grid' : viewMode);
  }, [isMobile]);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      p: { xs: 1, sm: 2 } // Responsive padding
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 2 
      }}>
        <TemplateListToolbar
          filter={filter}
          onFilterChange={onFilterChange}
          onCreateClick={handleCreateClick}
        />
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          justifyContent: { xs: 'space-between', sm: 'flex-end' },
          alignItems: 'center'
        }}>
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            fullWidth={isMobile}
          >
            Create Template
          </Button>
        </Box>
      </Box>

      {viewMode === 'grid' ? (
        <TemplateCardGrid
          templates={templates}
          onTemplateSelect={onTemplateSelect}
          onPreviewClick={handlePreviewClick}
          onEditClick={handleEditClick}
          onDeleteClick={onDeleteTemplate}
        />
      ) : (
        <Paper sx={{ flex: 1 }}>
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
      )}

      {/* Dialogs */}
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
