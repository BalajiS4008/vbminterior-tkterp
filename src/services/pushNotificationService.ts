import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteField, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// VAPID key should be from Firebase console
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export interface PushNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  token: string | null;
}

export const pushNotificationService = {
  // Check if push notifications are supported
  async isSupported(): Promise<boolean> {
    try {
      return await isSupported();
    } catch {
      return false;
    }
  },

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },

  // Request permission and get token
  async requestPermission(): Promise<string | null> {
    try {
      // Check if VAPID key is configured
      if (!VAPID_KEY) {
        throw new Error('Push notifications are not configured. VAPID key is missing.');
      }

      const supported = await this.isSupported();
      if (!supported) {
        throw new Error('Push notifications are not supported on this browser.');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission was denied. Please enable it in your browser settings.');
      }

      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (!token) {
        throw new Error('Failed to get notification token. Please try again.');
      }

      return token;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  },

  // Save FCM token to user document
  async saveToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(
        userRef,
        {
          fcmTokens: {
            [token]: {
              createdAt: new Date(),
              userAgent: navigator.userAgent,
            },
          },
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving FCM token:', error);
      throw error;
    }
  },

  // Remove FCM token from user document
  async removeToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`fcmTokens.${token}`]: deleteField(),
      });
    } catch (error) {
      console.error('Error removing FCM token:', error);
      throw error;
    }
  },

  // Subscribe to foreground messages
  onForegroundMessage(callback: (payload: any) => void): () => void {
    try {
      const messaging = getMessaging();
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up foreground message handler:', error);
      return () => {};
    }
  },

  // Show a local notification
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    };

    new Notification(title, defaultOptions);
  },

  // Get current status
  async getStatus(): Promise<PushNotificationStatus> {
    const supported = await this.isSupported();
    const permission = this.getPermissionStatus();
    let token: string | null = null;

    // Only try to get token if supported, permission granted, and VAPID key exists
    if (supported && permission === 'granted' && VAPID_KEY) {
      try {
        const messaging = getMessaging();
        token = await getToken(messaging, { vapidKey: VAPID_KEY });
      } catch (error) {
        // Token retrieval failed - this is expected if Firebase messaging isn't fully configured
        console.warn('FCM token retrieval failed:', error);
      }
    }

    return {
      isSupported: supported && !!VAPID_KEY,
      permission,
      token,
    };
  },
};

export default pushNotificationService;
