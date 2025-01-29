import React, { useState } from 'react';
import { Box, Container, CssBaseline, Tab, Tabs } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import CustomerSelection from './features/customers/CustomerSelection';
import TemplateList from './features/templates/TemplateList';
import { Customer } from './types/customer';

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>();

  const handleCustomerSelectionChange = (selectedIds: string[], customer?: Customer) => {
    setSelectedCustomerIds(selectedIds);
    // If a single customer is selected, use it for template preview
    setSelectedCustomer(selectedIds.length === 1 ? customer : undefined);
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
              <TemplateList selectedCustomer={selectedCustomer} />
            </TabPanel>
          </Box>
        </Box>
      </Container>
    </Provider>
  );
};

export default App;