import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService, type PushNotificationStatus } from '../services/pushNotificationService';
import { useAuth } from '../contexts/AuthContext';

export interface UsePushNotificationsReturn {
  status: PushNotificationStatus;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<PushNotificationStatus>({
    isSupported: false,
    permission: 'default',
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check initial status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const currentStatus = await pushNotificationService.getStatus();
        setStatus(currentStatus);
      } catch (err) {
        console.error('Error checking push notification status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  // Set up foreground message handler when user is authenticated
  useEffect(() => {
    if (!currentUser || !status.isSupported || status.permission !== 'granted') {
      return;
    }

    const unsubscribe = pushNotificationService.onForegroundMessage((payload) => {
      // Show local notification for foreground messages
      const { title, body, icon } = payload.notification || {};
      if (title) {
        pushNotificationService.showLocalNotification(title, {
          body,
          icon: icon || '/pwa-192x192.png',
          data: payload.data,
        });
      }
    });

    return unsubscribe;
  }, [currentUser, status.isSupported, status.permission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!currentUser) {
      setError('User must be logged in to enable notifications');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await pushNotificationService.requestPermission();

      // Save token to user document
      await pushNotificationService.saveToken(currentUser.uid, token!);

      // Update status
      const newStatus = await pushNotificationService.getStatus();
      setStatus(newStatus);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable notifications';
      setError(message);
      console.error('Error requesting push notification permission:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!currentUser || !status.token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationService.removeToken(currentUser.uid, status.token);
      setStatus((prev) => ({ ...prev, token: null }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error unsubscribing from push notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, status.token]);

  return {
    status,
    isLoading,
    error,
    requestPermission,
    unsubscribe,
  };
};

export default usePushNotifications;
