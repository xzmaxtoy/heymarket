import React from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { Box, Container, Paper, Tabs, Tab } from '@mui/material';
import { FeatureFlagManager } from '../components/FeatureFlagManager';
import { SystemMonitor } from '../components/SystemMonitor';
import NotificationPreferences from '../components/NotificationPreferences';
import { useAppSelector } from '@/store';

const AdminLayout: React.FC = () => {
  const [tab, setTab] = React.useState(0);
  const navigate = useNavigate();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    switch (newValue) {
      case 0:
        navigate('/admin/feature-flags');
        break;
      case 1:
        navigate('/admin/monitoring');
        break;
      case 2:
        navigate('/admin/notifications');
        break;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ borderRadius: '4px 4px 0 0' }}>
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="Feature Flags" />
            <Tab label="System Monitor" />
            <Tab label="Notifications" />
          </Tabs>
        </Paper>
      </Box>
      <Outlet />
    </Container>
  );
};

const AdminRoutes: React.FC = () => {
  const user = useAppSelector(state => state.auth.user);
  const isAdmin = user?.user_metadata?.isAdmin;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="feature-flags" element={<FeatureFlagManager />} />
        <Route path="monitoring" element={<SystemMonitor />} />
        <Route path="notifications" element={<NotificationPreferences />} />
        <Route path="*" element={<Navigate to="feature-flags" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
