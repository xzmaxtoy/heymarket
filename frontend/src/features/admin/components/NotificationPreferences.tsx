import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { useAppSelector } from '@/store';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/services/settings';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '@/services/pushNotifications';
import { DEFAULT_ALERT_THRESHOLDS } from '@/types/alerts';

export default function NotificationPreferences() {
  const userId = useAppSelector(state => state.auth.user?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    email: true,
    slack: false,
    pushNotifications: false,
    thresholds: {
      success_rate: 95,
      error_rate: 5,
      credits_used: 1000,
    },
  });
  const [pushSupported, setPushSupported] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkPushSupport();
  }, [userId]);

  const loadPreferences = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const prefs = await getNotificationPreferences(userId);
      setPreferences(prefs);
    } catch (err) {
      setError('Failed to load notification preferences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkPushSupport = async () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSupported(supported);

    if (supported) {
      try {
        await registerServiceWorker();
      } catch (err) {
        console.error('Failed to register service worker:', err);
      }
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
          await subscribeToPushNotifications();
          handleChange('pushNotifications', true);
        }
      } else {
        await unsubscribeFromPushNotifications();
        handleChange('pushNotifications', false);
      }
    } catch (err) {
      setError('Failed to update push notification settings');
      console.error(err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleThresholdChange = (metric: string, value: number) => {
    setPreferences(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [metric]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);
      await updateNotificationPreferences(userId, preferences);
    } catch (err) {
      setError('Failed to save notification preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
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
      <Typography variant="h6" gutterBottom>
        Notification Preferences
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Notification Channels
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.email}
                onChange={(e) => handleChange('email', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon />
                <span>Email Notifications</span>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.slack}
                onChange={(e) => handleChange('slack', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <MessageIcon />
                <span>Slack Notifications</span>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.pushNotifications}
                onChange={(e) => handlePushToggle(e.target.checked)}
                color="primary"
                disabled={!pushSupported}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <NotificationsIcon />
                <span>
                  Push Notifications
                  {!pushSupported && ' (Not supported in this browser)'}
                </span>
              </Box>
            }
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Alert Thresholds
        </Typography>
        <Box sx={{ px: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Success Rate (below {preferences.thresholds.success_rate}%)
            </Typography>
            <Slider
              value={preferences.thresholds.success_rate}
              onChange={(_, value) => handleThresholdChange('success_rate', value as number)}
              min={80}
              max={100}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Error Rate (above {preferences.thresholds.error_rate}%)
            </Typography>
            <Slider
              value={preferences.thresholds.error_rate}
              onChange={(_, value) => handleThresholdChange('error_rate', value as number)}
              min={1}
              max={20}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Credits Used (above {preferences.thresholds.credits_used})
            </Typography>
            <Slider
              value={preferences.thresholds.credits_used}
              onChange={(_, value) => handleThresholdChange('credits_used', value as number)}
              min={100}
              max={5000}
              step={100}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Box>

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          onClick={() => setPreferences({
            ...preferences,
            thresholds: {
              success_rate: DEFAULT_ALERT_THRESHOLDS.find(t => t.metric === 'success_rate')?.value || 95,
              error_rate: DEFAULT_ALERT_THRESHOLDS.find(t => t.metric === 'error_rate')?.value || 5,
              credits_used: DEFAULT_ALERT_THRESHOLDS.find(t => t.metric === 'credits_used')?.value || 1000,
            },
          })}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Paper>
  );
}
