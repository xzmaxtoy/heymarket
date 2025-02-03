import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  ErrorOutline as ErrorIcon,
  Send as SendIcon,
  MarkEmailRead as StatusIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { BatchAlert } from '@/types/alerts';
import NotificationFilters, { NotificationFilters as Filters } from './NotificationFilters';
import NotificationActions from './NotificationActions';
import NotificationGroup from './NotificationGroup';
import NotificationTrends from './NotificationTrends';
import NotificationStats from './NotificationStats';
import NotificationPerformance from './NotificationPerformance';
import NotificationSearch from './NotificationSearch';
import ArchiveDialog from './ArchiveDialog';
import ExportDialog from './ExportDialog';
import { useNotificationGroups } from '../hooks/useNotificationGroups';
import { useNotificationSort, SortField, SortOrder } from '../hooks/useNotificationSort';
import { useNotificationSearch } from '../hooks/useNotificationSearch';

type GroupBy = 'severity' | 'channel' | 'date' | 'status';
type ViewMode = 'list' | 'grid';
type SearchField = 'message' | 'severity' | 'channel' | 'status';

interface SearchConfig {
  query: string;
  fields: SearchField[];
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
}

interface NotificationHistoryProps {
  notifications: BatchAlert[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
}

export default function NotificationHistory({
  notifications,
  loading,
  error,
  onDelete,
  onRefresh,
  selectedIds,
  onSelect,
}: NotificationHistoryProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: 'date',
    order: 'desc',
  });
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    query: '',
    fields: ['message', 'severity', 'channel', 'status'],
    matchCase: false,
    matchWholeWord: false,
    useRegex: false,
  });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    severity: [],
    channels: [],
    status: [],
    dateRange: {
      start: '',
      end: '',
    },
  });

  const searchResults = useNotificationSearch(notifications, searchConfig);
  const filteredNotifications = searchConfig.query
    ? searchResults.map(result => result.notification)
    : notifications.filter(notification => {
        // Apply filters
        if (filters.severity.length > 0 && !filters.severity.includes(notification.severity)) {
          return false;
        }

        if (filters.channels.length > 0 && !notification.channels.some(channel => filters.channels.includes(channel))) {
          return false;
        }

        if (filters.status.length > 0) {
          const isRead = !!notification.read_at;
          const wantsRead = filters.status.includes('read');
          const wantsUnread = filters.status.includes('unread');
          if ((wantsRead && !isRead) || (wantsUnread && isRead)) {
            return false;
          }
        }

        if (filters.dateRange.start || filters.dateRange.end) {
          const notificationDate = new Date(notification.delivered_at);
          if (filters.dateRange.start && notificationDate < new Date(filters.dateRange.start)) {
            return false;
          }
          if (filters.dateRange.end && notificationDate > new Date(filters.dateRange.end)) {
            return false;
          }
        }

        return true;
      });

  const sortedNotifications = useNotificationSort(filteredNotifications, sortConfig);

  const handleArchiveComplete = () => {
    onRefresh();
  };

  const groups = useNotificationGroups(sortedNotifications, groupBy);

  const handleGroupByChange = (_: React.MouseEvent<HTMLElement>, newGroupBy: GroupBy | null) => {
    if (newGroupBy) {
      setGroupBy(newGroupBy);
    }
  };

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
    if (newViewMode) {
      setViewMode(newViewMode);
    }
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortChange = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field ? (prev.order === 'asc' ? 'desc' : 'asc') : 'desc',
    }));
    handleSortClose();
  };

  const handleSearch = (config: SearchConfig) => {
    setSearchConfig(config);
  };

  const groupByButtons = [
    { value: 'date', icon: <DateRangeIcon />, label: 'Date' },
    { value: 'severity', icon: <ErrorIcon />, label: 'Severity' },
    { value: 'channel', icon: <SendIcon />, label: 'Channel' },
    { value: 'status', icon: <StatusIcon />, label: 'Status' },
  ];

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'date', label: 'Date' },
    { field: 'severity', label: 'Severity' },
    { field: 'channel', label: 'Channel' },
    { field: 'status', label: 'Status' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Notification History</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <NotificationActions
            selectedIds={selectedIds}
            onMarkAsRead={() => {}} // Placeholder - implement in parent
            onDelete={() => onDelete(selectedIds[0])}
            onExport={() => setExportDialogOpen(true)}
            onArchive={() => setArchiveDialogOpen(true)}
            disabled={loading}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box mb={3}>
        <NotificationSearch
          onSearch={handleSearch}
          resultCount={searchConfig.query ? searchResults.length : undefined}
        />
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={groupBy}
            exclusive
            onChange={handleGroupByChange}
            size="small"
          >
            {groupByButtons.map((button) => (
              <ToggleButton key={button.value} value={button.value}>
                <Tooltip title={button.label}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {button.icon}
                    <Typography variant="body2">{button.label}</Typography>
                  </Box>
                </Tooltip>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Tooltip title="Sort notifications">
            <IconButton onClick={handleSortClick} size="small">
              <SortIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={sortMenuAnchor}
            open={Boolean(sortMenuAnchor)}
            onClose={handleSortClose}
          >
            {sortOptions.map((option) => (
              <MenuItem
                key={option.field}
                onClick={() => handleSortChange(option.field)}
                selected={sortConfig.field === option.field}
              >
                <ListItemIcon>
                  {sortConfig.field === option.field ? (
                    sortConfig.order === 'asc' ? (
                      <ArrowUpwardIcon fontSize="small" />
                    ) : (
                      <ArrowDownwardIcon fontSize="small" />
                    )
                  ) : (
                    <SortIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText>{option.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="list">
            <Tooltip title="List View">
              <ViewListIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="grid">
            <Tooltip title="Grid View">
              <ViewModuleIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box mb={4}>
        <NotificationStats notifications={notifications} />
      </Box>

      <Box mb={4}>
        <NotificationPerformance notifications={notifications} />
      </Box>

      <Box mb={4}>
        <NotificationTrends notifications={notifications} />
      </Box>

      <NotificationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {viewMode === 'list' ? (
        <Box>
          {Object.entries(groups).map(([groupName, groupNotifications]) => (
            <NotificationGroup
              key={groupName}
              groupName={groupName}
              notifications={groupNotifications}
              groupBy={groupBy}
              onDelete={onDelete}
              onSelect={onSelect}
              selectedIds={selectedIds}
            />
          ))}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {Object.entries(groups).map(([groupName, groupNotifications]) => (
            <Grid item xs={12} md={6} key={groupName}>
              <NotificationGroup
                groupName={groupName}
                notifications={groupNotifications}
                groupBy={groupBy}
                onDelete={onDelete}
                onSelect={onSelect}
                selectedIds={selectedIds}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <ArchiveDialog
        open={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        notifications={notifications}
        selectedIds={selectedIds}
        onArchiveComplete={handleArchiveComplete}
      />

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        notifications={notifications}
        selectedIds={selectedIds}
      />
    </Box>
  );
}
