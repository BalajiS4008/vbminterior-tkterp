import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AuthLayout: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Logo / Brand */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.5rem',
                mb: 2,
              }}
            >
              CT
            </Box>
            <Typography variant="h5" fontWeight={600} textAlign="center">
              {t('common.appName')}
            </Typography>
          </Box>

          {/* Auth Content */}
          <Outlet />
        </Paper>

        {/* Footer */}
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 3 }}
        >
          © {new Date().getFullYear()} {t('common.appName')}
        </Typography>
      </Container>
    </Box>
  );
};

export default AuthLayout;
