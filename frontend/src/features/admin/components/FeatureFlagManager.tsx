import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Slider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store';
import { FEATURE_FLAGS } from '@/hooks/useFeatureFlag';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  percentage: number;
  users: string[];
  conditions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  flag: FeatureFlag;
  onSave: (flag: FeatureFlag) => Promise<void>;
}

const EditDialog: React.FC<EditDialogProps> = ({ open, onClose, flag, onSave }) => {
  const [editedFlag, setEditedFlag] = useState<FeatureFlag>(flag);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditedFlag(flag);
  }, [flag]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSave(editedFlag);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Feature Flag</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          
          <TextField
            label="Name"
            value={editedFlag.name}
            onChange={(e) => setEditedFlag(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
          />

          <TextField
            label="Description"
            value={editedFlag.description}
            onChange={(e) => setEditedFlag(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            fullWidth
          />

          <Box>
            <Typography gutterBottom>Rollout Percentage</Typography>
            <Slider
              value={editedFlag.percentage}
              onChange={(_, value) => setEditedFlag(prev => ({ ...prev, percentage: value as number }))}
              valueLabelDisplay="auto"
              step={1}
              marks
              min={0}
              max={100}
            />
          </Box>

          <TextField
            label="Allowed Users (comma-separated)"
            value={editedFlag.users.join(', ')}
            onChange={(e) => setEditedFlag(prev => ({
              ...prev,
              users: e.target.value.split(',').map(u => u.trim()).filter(Boolean)
            }))}
            fullWidth
            helperText="Enter user IDs separated by commas"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const FeatureFlagManager: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editFlag, setEditFlag] = useState<FeatureFlag | null>(null);
  const userId = useAppSelector(state => state.auth.user?.id);

  const loadFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: flagError } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (flagError) throw flagError;
      setFlags(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ enabled: !flag.enabled })
        .eq('id', flag.id);

      if (updateError) throw updateError;
      await loadFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update flag');
    }
  };

  const handleSave = async (updatedFlag: FeatureFlag) => {
    const { error: updateError } = await supabase
      .from('feature_flags')
      .update({
        name: updatedFlag.name,
        description: updatedFlag.description,
        percentage: updatedFlag.percentage,
        users: updatedFlag.users,
        updated_at: new Date().toISOString()
      })
      .eq('id', updatedFlag.id);

    if (updateError) throw updateError;
    await loadFlags();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Feature Flags</Typography>
        <IconButton onClick={loadFlags} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Rollout %</TableCell>
              <TableCell align="center">Users</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flags.map((flag) => (
              <TableRow key={flag.id}>
                <TableCell>
                  <Typography variant="subtitle2">{flag.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {flag.key}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{flag.description}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={flag.enabled}
                    onChange={() => handleToggle(flag)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{flag.percentage}%</Typography>
                </TableCell>
                <TableCell align="center">
                  {flag.users.length > 0 ? (
                    <Chip
                      label={`${flag.users.length} users`}
                      size="small"
                      color="primary"
                    />
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      No users
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => setEditFlag(flag)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Details">
                    <IconButton size="small">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editFlag && (
        <EditDialog
          open={true}
          onClose={() => setEditFlag(null)}
          flag={editFlag}
          onSave={handleSave}
        />
      )}
    </Paper>
  );
};
