import { useMemo } from 'react';
import { BatchAlert } from '@/types/alerts';

interface SearchConfig {
  query: string;
  fields: ('message' | 'severity' | 'channel' | 'status')[];
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
}

interface SearchResult {
  notification: BatchAlert;
  matches: {
    field: string;
    value: string;
    indices: [number, number][];
  }[];
}

export function useNotificationSearch(
  notifications: BatchAlert[],
  config: SearchConfig
): SearchResult[] {
  return useMemo(() => {
    if (!config.query) return [];

    const searchResults: SearchResult[] = [];
    const searchTerms = config.useRegex
      ? [new RegExp(config.query, config.matchCase ? '' : 'i')]
      : config.matchWholeWord
      ? [new RegExp(`\\b${config.query}\\b`, config.matchCase ? '' : 'i')]
      : config.query
          .split(' ')
          .filter(Boolean)
          .map(term => new RegExp(term, config.matchCase ? '' : 'i'));

    for (const notification of notifications) {
      const matches: SearchResult['matches'] = [];

      // Search in message
      if (config.fields.includes('message')) {
        const messageMatches = findMatches(notification.message, searchTerms);
        if (messageMatches.length > 0) {
          matches.push({
            field: 'message',
            value: notification.message,
            indices: messageMatches,
          });
        }
      }

      // Search in severity
      if (config.fields.includes('severity')) {
        const severityMatches = findMatches(notification.severity, searchTerms);
        if (severityMatches.length > 0) {
          matches.push({
            field: 'severity',
            value: notification.severity,
            indices: severityMatches,
          });
        }
      }

      // Search in channels
      if (config.fields.includes('channel')) {
        notification.channels.forEach(channel => {
          const channelMatches = findMatches(channel, searchTerms);
          if (channelMatches.length > 0) {
            matches.push({
              field: 'channel',
              value: channel,
              indices: channelMatches,
            });
          }
        });
      }

      // Search in status
      if (config.fields.includes('status')) {
        const status = notification.read_at ? 'read' : 'unread';
        const statusMatches = findMatches(status, searchTerms);
        if (statusMatches.length > 0) {
          matches.push({
            field: 'status',
            value: status,
            indices: statusMatches,
          });
        }
      }

      if (matches.length > 0) {
        searchResults.push({
          notification,
          matches,
        });
      }
    }

    return searchResults;
  }, [notifications, config]);
}

function findMatches(text: string, patterns: RegExp[]): [number, number][] {
  const matches: [number, number][] = [];

  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags + (pattern.flags.includes('g') ? '' : 'g'));
    while ((match = regex.exec(text)) !== null) {
      matches.push([match.index, match.index + match[0].length]);
    }
  }

  // Merge overlapping matches
  return mergeRanges(matches);
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length <= 1) return ranges;

  const sorted = ranges.sort(([a], [b]) => a - b);
  const merged: [number, number][] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = merged[merged.length - 1];

    if (current[0] <= previous[1]) {
      previous[1] = Math.max(previous[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}
