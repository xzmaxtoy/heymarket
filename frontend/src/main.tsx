import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, GlobalStyles } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { store } from './store';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const globalStyles = {
  '.MuiDataGrid-root': {
    border: 'none',
  },
  '.MuiDataGrid-cell:focus': {
    outline: 'none',
  },
  'html, body, #root': {
    height: '100%',
    margin: 0,
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <GlobalStyles styles={globalStyles} />
          <App />
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
