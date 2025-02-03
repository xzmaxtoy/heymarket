import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Template } from '@/types/template';

export interface TemplateSelectionStepProps {
  onSelect: (template: Template) => void;
  onCancel: () => void;
}

export default function TemplateSelectionStep({
  onSelect,
  onCancel,
}: TemplateSelectionStepProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v2/templates');
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'content', headerName: 'Content', flex: 2 },
    {
      field: 'variables',
      headerName: 'Variables',
      flex: 1,
      valueGetter: (params) => params.row.variables.join(', '),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      flex: 1,
      valueGetter: (params) => new Date(params.row.created_at).toLocaleDateString(),
    },
  ];

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Template
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search templates..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Paper sx={{ height: 400, mb: 2 }}>
        <DataGrid
          rows={filteredTemplates}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          pageSizeOptions={[5]}
          onRowClick={(params) => onSelect(params.row as Template)}
          disableRowSelectionOnClick
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
