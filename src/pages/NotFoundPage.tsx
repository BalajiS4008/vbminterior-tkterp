import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Container } from '@mui/material';
import { Home as HomeIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { ROUTES } from '../config/constants';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '6rem', sm: '8rem' },
            fontWeight: 700,
            color: 'primary.main',
            mb: 2,
          }}
        >
          404
        </Typography>

        <Typography variant="h4" gutterBottom>
          {t('errors.pageNotFound') || 'Page Not Found'}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
          {t('errors.pageNotFoundDescription') || "The page you're looking for doesn't exist or has been moved."}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
          >
            {t('common.goBack') || 'Go Back'}
          </Button>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate(ROUTES.DASHBOARD)}
          >
            {t('common.goHome') || 'Go to Dashboard'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
