import React, { useState, useEffect } from 'react';
import { Box, Container, CssBaseline, Tab, Tabs } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import CustomerSelection from './features/customers/CustomerSelection';
import TemplateList from './features/templates/TemplateList';
import BatchList from './features/batches/BatchList';
import AnalyticsDashboard from './features/analytics/components/AnalyticsDashboard';
import { initializeWebSocket, closeWebSocket } from './services/websocket';
import { subscribeToTemplates } from './services/supabase';
import { templatesSlice } from './store/slices/templatesSlice';
import { Template } from './features/templates/types';

interface TemplatePayload {
  new: Partial<Template> | null;
  old: Partial<Template> | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  // Initialize WebSocket and template subscription
  useEffect(() => {
    initializeWebSocket();
    const unsubscribe = subscribeToTemplates((payload) => {
      store.dispatch(templatesSlice.actions.handleTemplateChange({
        template: {
          id: payload.new?.id || payload.old?.id,
          name: payload.new?.name || payload.old?.name,
          content: payload.new?.content || payload.old?.content,
          description: payload.new?.description,
          variables: payload.new?.variables || payload.old?.variables || [],
          created_at: payload.new?.created_at || payload.old?.created_at,
          updated_at: payload.new?.updated_at || payload.old?.updated_at,
        },
        eventType: payload.eventType,
      }));
    });

    return () => {
      closeWebSocket();
      unsubscribe();
    };
  }, []);

  return (
    <Provider store={store}>
      <CssBaseline />
      <Container maxWidth={false} sx={{ height: '100vh', py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Customers" />
            <Tab label="Templates" />
            <Tab label="Batches" />
            <Tab label="Analytics" />
          </Tabs>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <TabPanel value={currentTab} index={0}>
              <CustomerSelection />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <TemplateList />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <BatchList />
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              <AnalyticsDashboard />
            </TabPanel>
          </Box>
        </Box>
      </Container>
    </Provider>
  );
};

export default App;
