import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Color palette for the construction/interior app
const primaryColor = '#1976D2'; // Professional blue
const secondaryColor = '#FF6F00'; // Construction orange
const successColor = '#4CAF50';
const warningColor = '#FF9800';
const errorColor = '#F44336';
const infoColor = '#2196F3';

// Common theme options
const commonThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Noto Sans Tamil"', // Tamil font support
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
      },
    },
  },
};

// Light theme
export const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: primaryColor,
      light: '#42A5F5',
      dark: '#1565C0',
      contrastText: '#fff',
    },
    secondary: {
      main: secondaryColor,
      light: '#FF8F00',
      dark: '#E65100',
      contrastText: '#fff',
    },
    success: {
      main: successColor,
      light: '#66BB6A',
      dark: '#388E3C',
    },
    warning: {
      main: warningColor,
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: errorColor,
      light: '#EF5350',
      dark: '#C62828',
    },
    info: {
      main: infoColor,
      light: '#64B5F6',
      dark: '#1976D2',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#666687',
    },
    divider: '#E0E0E0',
  },
});

// Dark theme
export const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#42A5F5',
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF8F00',
      light: '#FFAB40',
      dark: '#FF6F00',
      contrastText: '#fff',
    },
    success: {
      main: '#66BB6A',
      light: '#81C784',
      dark: '#4CAF50',
    },
    warning: {
      main: '#FFB74D',
      light: '#FFCC80',
      dark: '#FF9800',
    },
    error: {
      main: '#EF5350',
      light: '#E57373',
      dark: '#F44336',
    },
    info: {
      main: '#64B5F6',
      light: '#90CAF9',
      dark: '#2196F3',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
    divider: '#333333',
  },
});

export default lightTheme;
