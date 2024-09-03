import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import type {} from "@mui/x-data-grid/themeAugmentation";
import { CssBaseline } from "@mui/material";

const darkTheme = createTheme({
  typography:{
    fontFamily:"Noto Sans JP",
    fontWeightLight:100
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
        },
        cell: {
          color: '#fff',
        },
        columnHeaders: {
          backgroundColor: '#333',
        },
        row: {
          '&:nth-of-type(even)': {
            backgroundColor: '#444',
          },
          '&:hover': {
            backgroundColor: '#555',
          },
        },
        footerContainer: {
          backgroundColor: '#333',
        },
      },
    },
  },
  palette: {
    mode: 'dark',
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <App />
    </ ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
