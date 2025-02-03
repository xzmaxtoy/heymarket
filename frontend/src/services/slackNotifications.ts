import { BatchAlert } from '@/types/alerts';

interface SlackMessage {
  text: string;
  blocks?: any[];
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: {
    type: string;
    text: string;
  }[];
  accessory?: {
    type: string;
    text: {
      type: string;
      text: string;
    };
    value: string;
  };
}

export async function sendSlackNotification(webhookUrl: string, message: SlackMessage) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to send Slack notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    throw error;
  }
}

export function formatAlertSlackMessage(alert: BatchAlert): SlackMessage {
  const severity = alert.severity === 'error' ? ':red_circle:' : ':warning:';
  const timestamp = new Date(alert.timestamp).toLocaleString();

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${severity} Batch Alert: ${alert.message}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Metric:*\n${alert.metric}`,
        },
        {
          type: 'mrkdwn',
          text: `*Current Value:*\n${alert.value}`,
        },
        {
          type: 'mrkdwn',
          text: `*Threshold:*\n${alert.threshold}`,
        },
        {
          type: 'mrkdwn',
          text: `*Time:*\n${timestamp}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'View details in the admin dashboard:',
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Open Dashboard',
        },
        value: 'open_dashboard',
      },
    },
  ];

  return {
    text: `${severity} Batch Alert: ${alert.message}`,
    blocks,
  };
}

export async function notifySlackChannel(alert: BatchAlert, webhookUrl: string) {
  const message = formatAlertSlackMessage(alert);
  return sendSlackNotification(webhookUrl, message);
}

export async function notifyAllChannels(alert: BatchAlert, webhookUrls: string[]) {
  return Promise.all(
    webhookUrls.map(webhookUrl => notifySlackChannel(alert, webhookUrl))
  );
}
