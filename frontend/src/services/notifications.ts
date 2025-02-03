import { BatchAlert } from '@/types/alerts';

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmailNotification(notification: EmailNotification) {
  try {
    const response = await fetch('/api/v2/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error('Failed to send email notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}

export function formatAlertEmail(alert: BatchAlert) {
  const severity = alert.severity === 'error' ? 'ERROR' : 'WARNING';
  const timestamp = new Date(alert.timestamp).toLocaleString();

  return {
    subject: `[${severity}] Batch Alert: ${alert.message}`,
    body: `
Alert Details:
-------------
Severity: ${severity}
Message: ${alert.message}
Metric: ${alert.metric}
Current Value: ${alert.value}
Threshold: ${alert.threshold}
Time: ${timestamp}

Please check the admin dashboard for more details.
    `.trim(),
  };
}

export async function notifyAdminsOfAlert(alert: BatchAlert, adminEmails: string[]) {
  const { subject, body } = formatAlertEmail(alert);

  const notifications = adminEmails.map(email => ({
    to: email,
    subject,
    body,
  }));

  return Promise.all(
    notifications.map(notification => sendEmailNotification(notification))
  );
}
