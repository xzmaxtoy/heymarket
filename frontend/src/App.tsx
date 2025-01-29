import React, { useState } from 'react';
import { Box, Container, CssBaseline, Tab, Tabs } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import CustomerSelection from './features/customers/CustomerSelection';
import TemplateList from './features/templates/TemplateList';

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
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  const handleCustomerSelectionChange = (selectedIds: string[]) => {
    setSelectedCustomerIds(selectedIds);
  };

  const handleCreateTemplate = () => {
    // TODO: Implement template creation
    console.log('Create template');
  };

  const handleEditTemplate = (template: any) => {
    // TODO: Implement template editing
    console.log('Edit template', template);
  };

  const handlePreviewTemplate = (template: any) => {
    // TODO: Implement template preview
    console.log('Preview template', template);
  };

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
          </Tabs>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <TabPanel value={currentTab} index={0}>
              <CustomerSelection onSelectionChange={handleCustomerSelectionChange} />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <TemplateList
                onCreateClick={handleCreateTemplate}
                onEditClick={handleEditTemplate}
                onPreviewClick={handlePreviewTemplate}
              />
            </TabPanel>
          </Box>
        </Box>
      </Container>
    </Provider>
  );
};

export default App;