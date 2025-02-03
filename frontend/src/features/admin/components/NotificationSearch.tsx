import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Collapse,
  Typography,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Code as CodeIcon,
  TextFields as CaseSensitiveIcon,
  TextFormat as TextFormatIcon,
} from '@mui/icons-material';

interface NotificationSearchProps {
  onSearch: (config: {
    query: string;
    fields: ('message' | 'severity' | 'channel' | 'status')[];
    matchCase: boolean;
    matchWholeWord: boolean;
    useRegex: boolean;
  }) => void;
  resultCount?: number;
}

export default function NotificationSearch({ onSearch, resultCount }: NotificationSearchProps) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState<('message' | 'severity' | 'channel' | 'status')[]>([
    'message',
    'severity',
    'channel',
    'status',
  ]);
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const handleSearch = useCallback(() => {
    onSearch({
      query,
      fields,
      matchCase,
      matchWholeWord,
      useRegex,
    });
  }, [query, fields, matchCase, matchWholeWord, useRegex, onSearch]);

  const handleClear = () => {
    setQuery('');
    setFields(['message', 'severity', 'channel', 'status']);
    setMatchCase(false);
    setMatchWholeWord(false);
    setUseRegex(false);
    onSearch({
      query: '',
      fields: ['message', 'severity', 'channel', 'status'],
      matchCase: false,
      matchWholeWord: false,
      useRegex: false,
    });
  };

  const handleFieldToggle = (field: 'message' | 'severity' | 'channel' | 'status') => {
    setFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      }
      return [...prev, field];
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search notifications..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClear}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {resultCount !== undefined && (
          <Typography variant="body2" color="textSecondary">
            {resultCount} {resultCount === 1 ? 'result' : 'results'} found
          </Typography>
        )}

        <Collapse in={expanded}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Search Fields
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fields.includes('message')}
                      onChange={() => handleFieldToggle('message')}
                      size="small"
                    />
                  }
                  label="Message"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fields.includes('severity')}
                      onChange={() => handleFieldToggle('severity')}
                      size="small"
                    />
                  }
                  label="Severity"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fields.includes('channel')}
                      onChange={() => handleFieldToggle('channel')}
                      size="small"
                    />
                  }
                  label="Channel"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fields.includes('status')}
                      onChange={() => handleFieldToggle('status')}
                      size="small"
                    />
                  }
                  label="Status"
                />
              </FormGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Search Options
              </Typography>
              <Box display="flex" gap={1}>
                <Tooltip title="Match Case">
                  <Chip
                    icon={<CaseSensitiveIcon />}
                    label="Match Case"
                    onClick={() => setMatchCase(!matchCase)}
                    color={matchCase ? 'primary' : 'default'}
                    variant={matchCase ? 'filled' : 'outlined'}
                    size="small"
                  />
                </Tooltip>
                <Tooltip title="Match Whole Word">
                  <Chip
                    icon={<TextFormatIcon />}
                    label="Whole Word"
                    onClick={() => setMatchWholeWord(!matchWholeWord)}
                    color={matchWholeWord ? 'primary' : 'default'}
                    variant={matchWholeWord ? 'filled' : 'outlined'}
                    size="small"
                  />
                </Tooltip>
                <Tooltip title="Use Regular Expression">
                  <Chip
                    icon={<CodeIcon />}
                    label="Regex"
                    onClick={() => setUseRegex(!useRegex)}
                    color={useRegex ? 'primary' : 'default'}
                    variant={useRegex ? 'filled' : 'outlined'}
                    size="small"
                  />
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
}
