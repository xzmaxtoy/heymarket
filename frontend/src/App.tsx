import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Container } from '@mui/material';
import BatchWorkspaceRoutes from './features/batches/workspace/routes/BatchWorkspaceRoutes';
import { useFeatureFlag } from './hooks/useFeatureFlag';

// Import existing components
import BatchList from './features/batches/BatchList';
import TemplateList from './features/templates/TemplateList';
import CustomerSelection from './features/customers/CustomerSelection';
import AnalyticsDashboard from './features/analytics/components/AnalyticsDashboard';
import Navigation from './components/Navigation';

export default function App() {
  const { isEnabled: useNewBatchSystem } = useFeatureFlag('NEW_BATCH_SYSTEM');

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* App Bar */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              SMS Management System
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Container maxWidth="xl">
            <Routes>
              {/* Redirect root to batches */}
              <Route path="/" element={<Navigate to="/batches" replace />} />

              {/* Main routes */}
              <Route path="/batches/*" element={
                useNewBatchSystem ? <BatchWorkspaceRoutes /> : <BatchList />
              } />
              <Route path="/templates" element={<TemplateList />} />
              <Route path="/customers" element={<CustomerSelection />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />

              {/* Fallback route */}
              <Route path="*" element={
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h5">404: Page Not Found</Typography>
                </Box>
              } />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Router>
  );
}
