import React from 'react';
import {
  Snackbar,
  Button,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  GetApp as InstallIcon,
  CloudDone as OfflineIcon,
} from '@mui/icons-material';
import { usePWA } from '../../hooks/usePWA';

const PWAPrompt: React.FC = () => {
  const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
    isInstallable,
    installPrompt,
  } = usePWA();

  const [showOfflineReady, setShowOfflineReady] = React.useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);

  React.useEffect(() => {
    if (offlineReady) {
      setShowOfflineReady(true);
    }
  }, [offlineReady]);

  React.useEffect(() => {
    if (isInstallable) {
      // Show install prompt after a delay (not immediately)
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    if (installPrompt) {
      const installed = await installPrompt();
      if (installed) {
        setShowInstallPrompt(false);
      }
    }
  };

  return (
    <>
      {/* Update Available */}
      <Snackbar
        open={needRefresh}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => updateServiceWorker(true)}
            >
              Refresh
            </Button>
          }
        >
          <AlertTitle>Update Available</AlertTitle>
          A new version of the app is available. Refresh to update.
        </Alert>
      </Snackbar>

      {/* Offline Ready */}
      <Snackbar
        open={showOfflineReady}
        autoHideDuration={6000}
        onClose={() => setShowOfflineReady(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          icon={<OfflineIcon />}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setShowOfflineReady(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          App is ready for offline use!
        </Alert>
      </Snackbar>

      {/* Install Prompt */}
      <Snackbar
        open={showInstallPrompt && isInstallable}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          variant="filled"
          sx={{ alignItems: 'center' }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                startIcon={<InstallIcon />}
                onClick={handleInstall}
              >
                Install
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setShowInstallPrompt(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              Install App
            </Typography>
            <Typography variant="body2">
              Add to home screen for a better experience
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAPrompt;
