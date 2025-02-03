import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportableNotification {
  severity: string;
  message: string;
  channels: string[];
  delivered_at: string;
  read_at?: string;
  metric: string;
  value: number;
  threshold: number;
}

export function exportToCSV(data: ExportableNotification[], filename: string) {
  const headers = [
    'Severity',
    'Message',
    'Channels',
    'Delivered At',
    'Read At',
    'Metric',
    'Value',
    'Threshold',
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(notification => [
      notification.severity,
      `"${notification.message.replace(/"/g, '""')}"`,
      `"${notification.channels.join(', ')}"`,
      new Date(notification.delivered_at).toLocaleString(),
      notification.read_at ? new Date(notification.read_at).toLocaleString() : '',
      notification.metric,
      notification.value,
      notification.threshold,
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

export function exportToExcel(data: ExportableNotification[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(notification => ({
      Severity: notification.severity,
      Message: notification.message,
      Channels: notification.channels.join(', '),
      'Delivered At': new Date(notification.delivered_at).toLocaleString(),
      'Read At': notification.read_at ? new Date(notification.read_at).toLocaleString() : '',
      Metric: notification.metric,
      Value: notification.value,
      Threshold: notification.threshold,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Notifications');

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

export function formatDateForFilename(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function generateExportFilename(prefix: string): string {
  return `${prefix}_${formatDateForFilename()}`;
}
