import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  Chip,
  Divider,
  Icon,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { BatchAlert } from '@/types/alerts';
import { getGroupIcon, getGroupLabel } from '../hooks/useNotificationGroups';

interface NotificationGroupProps {
  groupName: string;
  notifications: BatchAlert[];
  groupBy: 'severity' | 'channel' | 'date' | 'status';
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  selectedIds: string[];
}

export default function NotificationGroup({
  groupName,
  notifications,
  groupBy,
  onDelete,
  onSelect,
  selectedIds,
}: NotificationGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleClick = (id: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(id);
  };

  const handleDelete = (id: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete(id);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <CheckCircleIcon color="success" />;
    }
  };

  return (
    <Paper sx={{ mb: 2 }}>
      <ListItem
        button
        onClick={handleToggle}
        sx={{
          backgroundColor: 'background.default',
          borderRadius: 1,
        }}
      >
        <ListItemIcon>
          <Icon>{getGroupIcon(groupName, groupBy)}</Icon>
        </ListItemIcon>
        <ListItemText
          primary={getGroupLabel(groupName, notifications.length, groupBy)}
          secondary={`${notifications.filter(n => !n.read_at).length} unread`}
        />
        <Box display="flex" alignItems="center" gap={1}>
          {groupBy === 'severity' && getSeverityIcon(groupName)}
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </ListItem>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <List disablePadding>
          {notifications.map((notification) => (
            <ListItem
              key={notification.id}
              selected={selectedIds.includes(notification.id)}
              onClick={handleClick(notification.id)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                {getSeverityIcon(notification.severity)}
              </ListItemIcon>
              <ListItemText
                primary={notification.message}
                secondary={
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Typography variant="body2" component="span">
                      {new Date(notification.delivered_at).toLocaleString()}
                    </Typography>
                    {notification.channels.map((channel) => (
                      <Chip
                        key={channel}
                        label={channel}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    ))}
                    {notification.read_at && (
                      <Chip
                        label="Read"
                        size="small"
                        color="default"
                      />
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={handleDelete(notification.id)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Paper>
  );
}
