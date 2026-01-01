import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth, useNotification } from '../../contexts';
import { ROUTES } from '../../config/constants';
import { isValidEmail } from '../../utils';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) {
      setError(t('validation.required'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('validation.invalidEmail'));
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      showSuccess(t('auth.resetEmailSent'));
    } catch (err) {
      console.error('Reset password error:', err);
      setError(t('common.error'));
      showError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box textAlign="center">
        <Typography variant="h5" gutterBottom>
          {t('auth.resetPassword')}
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          {t('auth.resetEmailSent')}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('auth.enterEmail')}
        </Typography>
        <Link
          component={RouterLink}
          to={ROUTES.LOGIN}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <ArrowBackIcon fontSize="small" />
          {t('auth.login')}
        </Link>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h5" textAlign="center" gutterBottom>
        {t('auth.resetPassword')}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        sx={{ mb: 3 }}
      >
        {t('auth.enterEmail')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label={t('auth.email')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        required
        autoComplete="email"
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        sx={{ mt: 3, mb: 2 }}
      >
        {loading ? t('common.loading') : t('auth.resetPassword')}
      </Button>

      <Box textAlign="center">
        <Link
          component={RouterLink}
          to={ROUTES.LOGIN}
          variant="body2"
          underline="hover"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <ArrowBackIcon fontSize="small" />
          {t('auth.login')}
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
