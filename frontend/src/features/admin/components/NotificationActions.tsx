import React from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';

interface NotificationActionsProps {
  selectedIds: string[];
  onMarkAsRead: () => void;
  onDelete: () => void;
  onExport: (format: 'csv' | 'excel') => void;
  onArchive: () => void;
  disabled?: boolean;
}

export default function NotificationActions({
  selectedIds,
  onMarkAsRead,
  onDelete,
  onExport,
  onArchive,
  disabled = false,
}: NotificationActionsProps) {
  const [exportAnchorEl, setExportAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportFormat = (format: 'csv' | 'excel') => {
    onExport(format);
    handleExportClose();
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <Box display="flex" gap={1} alignItems="center">
      <Tooltip title={hasSelection ? 'Mark as Read' : 'Select notifications to mark as read'}>
        <span>
          <IconButton
            onClick={onMarkAsRead}
            disabled={disabled || !hasSelection}
            size="small"
          >
            <MarkReadIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title={hasSelection ? 'Archive Selected' : 'Select notifications to archive'}>
        <span>
          <IconButton
            onClick={onArchive}
            disabled={disabled || !hasSelection}
            size="small"
          >
            <ArchiveIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title={hasSelection ? 'Delete Selected' : 'Select notifications to delete'}>
        <span>
          <IconButton
            onClick={onDelete}
            disabled={disabled || !hasSelection}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Export">
        <IconButton
          onClick={handleExportClick}
          disabled={disabled}
          size="small"
        >
          <ExportIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
      >
        <MenuItem onClick={() => handleExportFormat('csv')}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExportFormat('excel')}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as Excel</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
