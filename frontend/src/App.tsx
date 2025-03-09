import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Container, Typography, useTheme, useMediaQuery } from '@mui/material';
import BatchWorkspaceRoutes from './features/batches/workspace/routes/BatchWorkspaceRoutes';
import { useFeatureFlag } from './hooks/useFeatureFlag';

// Import components
import BatchList from './features/batches/BatchList';
import TemplateList from './features/templates/TemplateList';
import CustomerSelection from './features/customers/CustomerSelection';
import AnalyticsDashboard from './features/analytics/components/AnalyticsDashboard';
import AppHeader from './components/AppHeader';

export default function App() {
  const { isEnabled: useNewBatchSystem } = useFeatureFlag('NEW_BATCH_SYSTEM');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Router>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default
      }}>
        <CssBaseline />
        
        {/* Header */}
        <AppHeader />

        {/* Main Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            width: '100%',
            mt: { xs: 7, sm: 8 }, // Adjust margin based on screen size
            pb: { xs: 2, sm: 3 }  // Add bottom padding for mobile
          }}
        >
          <Container 
            maxWidth="xl"
            sx={{
              px: { xs: 1, sm: 2, md: 3 } // Responsive padding
            }}
          >
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
