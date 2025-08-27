'use client';

import { useState, useEffect, useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
  vibrate?: number[];
  silent?: boolean;
  timestamp?: number;
  renotify?: boolean;
  sticky?: boolean;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
}

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscription: PushSubscription | null;
  subscriptionId: string | null;
  permission: NotificationPermission;
  error: string | null;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    subscription: null,
    subscriptionId: null,
    permission: 'default',
    error: null
  });

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const isSupported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied',
        isLoading: false
      }));
    };

    checkSupport();
  }, []);

  // Check existing subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!state.isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          const subscriptionId = btoa(subscription.endpoint);
          setState(prev => ({
            ...prev,
            isSubscribed: true,
            subscription,
            subscriptionId
          }));
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to check subscription status'
        }));
      }
    };

    if (state.isSupported && !state.isLoading) {
      checkSubscription();
    }
  }, [state.isSupported, state.isLoading]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission, error: null }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      setState(prev => ({ ...prev, error: 'Failed to request permission' }));
      return false;
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !VAPID_PUBLIC_KEY) {
      setState(prev => ({ ...prev, error: 'Push notifications not configured' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission if not granted
      if (state.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setState(prev => ({ ...prev, isLoading: false }));
          return false;
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to server
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'subscribe',
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      const result = await response.json();
      const subscriptionId = result.subscriptionId;

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        subscriptionId,
        isLoading: false
      }));

      return true;
    } catch (error) {
      console.error('Error subscribing:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to subscribe to notifications',
        isLoading: false
      }));
      return false;
    }
  }, [state.isSupported, state.permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription || !state.subscriptionId) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Unsubscribe from push manager
      await state.subscription.unsubscribe();

      // Remove subscription from server
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'unsubscribe',
          subscriptionId: state.subscriptionId
        })
      });

      if (!response.ok) {
        console.warn('Failed to remove subscription from server');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        subscriptionId: null,
        isLoading: false
      }));

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to unsubscribe from notifications',
        isLoading: false
      }));
      return false;
    }
  }, [state.subscription, state.subscriptionId]);

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!state.isSubscribed || !state.subscriptionId) {
      setState(prev => ({ ...prev, error: 'Not subscribed to notifications' }));
      return false;
    }

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send-to-user',
          subscriptionId: state.subscriptionId,
          notification: {
            title: '🎉 ทดสอบการแจ้งเตือน',
            body: 'การแจ้งเตือนทำงานได้ปกติ! ยินดีต้อนรับสู่ 3D-SCO Portfolio',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [100, 50, 100],
            actions: [
              {
                action: 'view',
                title: 'ดูเว็บไซต์'
              },
              {
                action: 'close',
                title: 'ปิด'
              }
            ],
            data: {
              url: '/',
              timestamp: Date.now()
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      setState(prev => ({ ...prev, error: 'Failed to send test notification' }));
      return false;
    }
  }, [state.isSubscribed, state.subscriptionId]);

  // Send notification to all subscribers (admin only)
  const sendNotificationToAll = useCallback(async (notification: NotificationOptions): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send',
          notification
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return true;
    } catch (error) {
      console.error('Error sending notification to all:', error);
      setState(prev => ({ ...prev, error: 'Failed to send notification' }));
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    sendNotificationToAll,
    clearError
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}