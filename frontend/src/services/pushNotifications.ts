import { BatchAlert } from '@/types/alerts';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Push notifications are not supported');
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export async function subscribeToPushNotifications(): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;
  
  // Get the server's public key from your backend
  const response = await fetch('/api/v2/notifications/push/public-key');
  const { publicKey } = await response.json();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey
  });

  // Send the subscription to your backend
  await fetch('/api/v2/notifications/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscription),
  });

  return subscription;
}

export async function unsubscribeFromPushNotifications(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    await subscription.unsubscribe();
    
    // Notify backend about unsubscription
    await fetch('/api/v2/notifications/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  }
}

export function formatAlertPushNotification(alert: BatchAlert): PushNotificationPayload {
  const severity = alert.severity === 'error' ? '🔴' : '⚠️';
  
  return {
    title: `${severity} Batch Alert`,
    body: alert.message,
    icon: '/icons/notification-icon.png',
    badge: '/icons/notification-badge.png',
    tag: `batch-alert-${alert.metric}`,
    data: {
      url: '/admin/monitoring',
      alert,
    },
  };
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<void> {
  await fetch('/api/v2/notifications/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription,
      payload,
    }),
  });
}

// Service Worker message handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'NOTIFICATION_CLICK') {
      const url = event.data.url;
      if (url) {
        window.focus();
        window.location.href = url;
      }
    }
  });
}
