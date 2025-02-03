import { useState, useCallback } from 'react';
import { BatchAlert } from '@/types/alerts';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportConfig {
  format: 'csv' | 'excel' | 'json';
  fields?: (keyof BatchAlert)[];
  filename?: string;
  includeMetadata?: boolean;
  customFormatting?: {
    dateFormat?: string;
    numberFormat?: string;
    booleanFormat?: 'yes/no' | 'true/false' | '1/0';
  };
}

interface UseNotificationExportResult {
  exporting: boolean;
  progress: number;
  error: string | null;
  exportNotifications: (notifications: BatchAlert[], config: ExportConfig) => Promise<void>;
  exportSelected: (notifications: BatchAlert[], selectedIds: string[], config: ExportConfig) => Promise<void>;
  cancelExport: () => void;
  exportToFile: (format: 'csv' | 'excel' | 'json', selectedIds?: string[]) => Promise<void>;
}

const defaultConfig: Required<ExportConfig> = {
  format: 'csv',
  fields: ['id', 'message', 'severity', 'channels', 'delivered_at', 'read_at'],
  filename: 'notifications-export',
  includeMetadata: true,
  customFormatting: {
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    numberFormat: '0.00',
    booleanFormat: 'yes/no',
  },
};

export function useNotificationExport(notifications: BatchAlert[] = []): UseNotificationExportResult {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cancelToken, setCancelToken] = useState(false);

  const formatValue = (value: any, type: string, formatting = defaultConfig.customFormatting) => {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
        return new Date(value).toLocaleString();
      case 'boolean':
        switch (formatting?.booleanFormat) {
          case 'yes/no':
            return value ? 'Yes' : 'No';
          case '1/0':
            return value ? '1' : '0';
          default:
            return value.toString();
        }
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'number':
        return typeof value === 'number'
          ? value.toFixed(parseInt(formatting?.numberFormat?.split('.')[1] || '2'))
          : value;
      default:
        return value.toString();
    }
  };

  const prepareData = (notifs: BatchAlert[], config: Required<ExportConfig>) => {
    const data = notifs.map(notification => {
      const row: Record<string, any> = {};
      config.fields.forEach(field => {
        const value = notification[field];
        const type = typeof value;
        row[field] = formatValue(
          value,
          Array.isArray(value) ? 'array' : type,
          config.customFormatting
        );
      });
      return row;
    });

    if (config.includeMetadata) {
      const metadata = {
        exportDate: new Date().toISOString(),
        totalCount: notifs.length,
        errorCount: notifs.filter(n => n.severity === 'error').length,
        warningCount: notifs.filter(n => n.severity === 'warning').length,
        readCount: notifs.filter(n => n.read_at).length,
      };
      return { data, metadata };
    }

    return { data };
  };

  const exportToCSV = async (data: any[], filename: string) => {
    const csv = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(csv);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  const exportToExcel = async (data: any[], metadata: any, filename: string) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Notifications');

    if (metadata) {
      const metadataWs = XLSX.utils.json_to_sheet([metadata]);
      XLSX.utils.book_append_sheet(wb, metadataWs, 'Metadata');
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  };

  const exportToJSON = async (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `${filename}.json`);
  };

  const exportNotifications = useCallback(async (
    notifs: BatchAlert[],
    config: ExportConfig
  ) => {
    setExporting(true);
    setProgress(0);
    setError(null);
    setCancelToken(false);

    try {
      const fullConfig = { ...defaultConfig, ...config };
      const { data, metadata } = prepareData(notifs, fullConfig);

      const total = data.length;
      let completed = 0;

      // Simulate processing chunks
      const chunkSize = 100;
      for (let i = 0; i < total; i += chunkSize) {
        if (cancelToken) break;

        const chunk = data.slice(i, i + chunkSize);
        completed = Math.min(i + chunkSize, total);
        setProgress((completed / total) * 100);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      if (!cancelToken) {
        switch (fullConfig.format) {
          case 'csv':
            await exportToCSV(data, fullConfig.filename);
            break;
          case 'excel':
            await exportToExcel(data, metadata, fullConfig.filename);
            break;
          case 'json':
            await exportToJSON({ data, metadata }, fullConfig.filename);
            break;
        }
        setProgress(100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export notifications');
    } finally {
      setExporting(false);
      setCancelToken(false);
    }
  }, []);

  const exportSelected = useCallback(async (
    notifs: BatchAlert[],
    selectedIds: string[],
    config: ExportConfig
  ) => {
    const selectedNotifications = notifs.filter(n => selectedIds.includes(n.id));
    await exportNotifications(selectedNotifications, config);
  }, [exportNotifications]);

  const exportToFile = useCallback(async (format: 'csv' | 'excel' | 'json', selectedIds?: string[]) => {
    const config: ExportConfig = { ...defaultConfig, format };
    if (selectedIds?.length) {
      await exportSelected(notifications, selectedIds, config);
    } else {
      await exportNotifications(notifications, config);
    }
  }, [notifications, exportNotifications, exportSelected]);

  const cancelExport = useCallback(() => {
    setCancelToken(true);
  }, []);

  return {
    exporting,
    progress,
    error,
    exportNotifications,
    exportSelected,
    cancelExport,
    exportToFile,
  };
}
