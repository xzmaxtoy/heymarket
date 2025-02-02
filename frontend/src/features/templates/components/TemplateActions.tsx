import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { Template } from '../types';

interface TemplateActionsProps {
  template: Template;
  onPreviewClick: (template: Template) => void;
  onEditClick: (template: Template) => void;
  onDeleteClick: (template: Template) => void;
}

export const TemplateActions: React.FC<TemplateActionsProps> = ({
  template,
  onPreviewClick,
  onEditClick,
  onDeleteClick,
}) => {
  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDeleteClick(template);
  };

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onEditClick(template);
  };

  const handlePreviewClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onPreviewClick(template);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Preview">
        <IconButton
          size="small"
          onClick={handlePreviewClick}
        >
          <PreviewIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          onClick={handleEditClick}
        >
          <EditIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={handleDeleteClick}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default TemplateActions;