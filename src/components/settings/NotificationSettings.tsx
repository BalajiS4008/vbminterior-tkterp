import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  PhoneAndroid as MobileIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const NotificationSettings: React.FC = () => {
  const { status, isLoading, error, requestPermission, unsubscribe } =
    usePushNotifications();

  const handleToggleNotifications = async () => {
    if (status.token) {
      await unsubscribe();
    } else {
      await requestPermission();
    }
  };

  const getStatusChip = () => {
    if (isLoading) {
      return <Chip label="Loading..." size="small" color="default" />;
    }
    if (!status.isSupported) {
      return <Chip label="Not Configured" size="small" color="default" />;
    }
    if (status.permission === 'denied') {
      return <Chip label="Blocked" size="small" color="error" />;
    }
    if (status.token) {
      return <Chip label="Enabled" size="small" color="success" />;
    }
    return <Chip label="Disabled" size="small" color="default" />;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6">Push Notifications</Typography>
          {getStatusChip()}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!status.isSupported && !isLoading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Push notifications are not configured. Contact your administrator to enable this feature.
          </Alert>
        )}

        {status.permission === 'denied' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Push notifications are blocked. Please enable them in your browser
            settings to receive notifications.
          </Alert>
        )}

        <List disablePadding>
          <ListItem>
            <ListItemIcon>
              {status.token ? (
                <NotificationsActiveIcon color="success" />
              ) : (
                <NotificationsOffIcon color="disabled" />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Enable Push Notifications"
              secondary="Receive notifications about ticket updates, new assignments, and more"
            />
            <ListItemSecondaryAction>
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Switch
                  edge="end"
                  checked={!!status.token}
                  onChange={handleToggleNotifications}
                  disabled={
                    !status.isSupported || status.permission === 'denied'
                  }
                />
              )}
            </ListItemSecondaryAction>
          </ListItem>

          <Divider component="li" />

          <ListItem>
            <ListItemIcon>
              <MobileIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="This Device"
              secondary={
                status.token
                  ? 'Notifications are enabled for this device'
                  : 'No active subscription'
              }
            />
          </ListItem>
        </List>

        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <InfoIcon color="info" fontSize="small" sx={{ mt: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            Push notifications allow you to receive real-time updates even when
            the app is not open. You can manage notification permissions in your
            browser or device settings.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
