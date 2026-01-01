import React, { createContext, useContext, useState, type ReactNode, useCallback, useMemo } from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';

// Maximum number of notifications to display at once
const MAX_NOTIFICATIONS = 3;

interface NotificationMessage {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (message: string, severity: AlertColor = 'info', duration: number = 5000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notification: NotificationMessage = {
        id,
        message,
        severity,
        duration,
      };
      setNotifications((prev) => {
        // Keep only the most recent notifications up to MAX_NOTIFICATIONS
        const newNotifications = [...prev, notification];
        if (newNotifications.length > MAX_NOTIFICATIONS) {
          return newNotifications.slice(-MAX_NOTIFICATIONS);
        }
        return newNotifications;
      });
    },
    []
  );

  const showSuccess = useCallback(
    (message: string) => showNotification(message, 'success'),
    [showNotification]
  );

  const showError = useCallback(
    (message: string) => showNotification(message, 'error', 7000),
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string) => showNotification(message, 'warning'),
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string) => showNotification(message, 'info'),
    [showNotification]
  );

  const value: NotificationContextType = useMemo(() => ({
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }), [showNotification, showSuccess, showError, showWarning, showInfo]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          style={{ bottom: 24 + index * 60 }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
