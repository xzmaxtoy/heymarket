import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';
import { BatchAlert } from '@/types/alerts';
import { useNotificationArchive } from '../hooks/useNotificationArchive';

interface ArchiveDialogProps {
  open: boolean;
  onClose: () => void;
  notifications: BatchAlert[];
  selectedIds?: string[];
  onArchiveComplete: () => void;
}

type ReadStatus = 'read' | 'unread';
type SeverityType = 'error' | 'warning';

export default function ArchiveDialog({
  open,
  onClose,
  notifications,
  selectedIds,
  onArchiveComplete,
}: ArchiveDialogProps) {
  const {
    archiving,
    progress,
    error,
    archiveNotifications,
    archiveSelectedNotifications,
    cancelArchiving,
  } = useNotificationArchive();

  const [archiveBefore, setArchiveBefore] = useState<Dayjs | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityType[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ReadStatus[]>([]);

  const availableChannels = useMemo(() => {
    const channels = new Set<string>();
    notifications.forEach(notification => {
      notification.channels.forEach(channel => channels.add(channel));
    });
    return Array.from(channels);
  }, [notifications]);

  const handleArchive = async () => {
    if (selectedIds?.length) {
      await archiveSelectedNotifications(notifications, selectedIds);
    } else {
      await archiveNotifications(notifications, {
        before: archiveBefore?.toDate() || undefined,
        severity: selectedSeverity.length ? selectedSeverity : undefined,
        channels: selectedChannels.length ? selectedChannels : undefined,
        status: selectedStatus.length ? selectedStatus : undefined,
      });
    }
    onArchiveComplete();
    onClose();
  };

  const handleSeverityToggle = (severity: SeverityType) => {
    setSelectedSeverity(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  const handleStatusToggle = (status: ReadStatus) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleChannelToggle = (channel: string) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const affectedCount = useMemo(() => {
    if (selectedIds?.length) return selectedIds.length;

    return notifications.filter(notification => {
      if (archiveBefore && new Date(notification.delivered_at) > archiveBefore.toDate()) {
        return false;
      }

      if (selectedSeverity.length && !selectedSeverity.includes(notification.severity)) {
        return false;
      }

      if (selectedChannels.length && !notification.channels.some(channel => selectedChannels.includes(channel))) {
        return false;
      }

      if (selectedStatus.length) {
        const isRead = !!notification.read_at;
        const wantsRead = selectedStatus.includes('read');
        const wantsUnread = selectedStatus.includes('unread');
        if ((wantsRead && !isRead) || (wantsUnread && isRead)) {
          return false;
        }
      }

      return true;
    }).length;
  }, [notifications, selectedIds, archiveBefore, selectedSeverity, selectedChannels, selectedStatus]);

  return (
    <Dialog open={open} onClose={archiving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Archive Notifications
        {selectedIds?.length ? ` (${selectedIds.length} selected)` : ''}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {archiving ? (
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Archiving notifications... {Math.round(progress)}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
            <Button onClick={cancelArchiving}>Cancel</Button>
          </Box>
        ) : (
          <Box>
            {!selectedIds?.length && (
              <>
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Archive Date
                  </Typography>
                  <DatePicker
                    label="Archive notifications before"
                    value={archiveBefore}
                    onChange={setArchiveBefore}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Severity
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label="Error"
                      color={selectedSeverity.includes('error') ? 'primary' : 'default'}
                      onClick={() => handleSeverityToggle('error')}
                      variant={selectedSeverity.includes('error') ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="Warning"
                      color={selectedSeverity.includes('warning') ? 'primary' : 'default'}
                      onClick={() => handleSeverityToggle('warning')}
                      variant={selectedSeverity.includes('warning') ? 'filled' : 'outlined'}
                    />
                  </Stack>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label="Read"
                      color={selectedStatus.includes('read') ? 'primary' : 'default'}
                      onClick={() => handleStatusToggle('read')}
                      variant={selectedStatus.includes('read') ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label="Unread"
                      color={selectedStatus.includes('unread') ? 'primary' : 'default'}
                      onClick={() => handleStatusToggle('unread')}
                      variant={selectedStatus.includes('unread') ? 'filled' : 'outlined'}
                    />
                  </Stack>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Channels
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {availableChannels.map(channel => (
                      <Chip
                        key={channel}
                        label={channel}
                        color={selectedChannels.includes(channel) ? 'primary' : 'default'}
                        onClick={() => handleChannelToggle(channel)}
                        variant={selectedChannels.includes(channel) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Stack>
                </Box>
              </>
            )}

            <Typography variant="body2" color="textSecondary">
              {affectedCount} notification{affectedCount !== 1 ? 's' : ''} will be archived
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={archiving}>
          Cancel
        </Button>
        <Button
          onClick={handleArchive}
          variant="contained"
          disabled={archiving || (!selectedIds?.length && affectedCount === 0)}
        >
          Archive
        </Button>
      </DialogActions>
    </Dialog>
  );
}
