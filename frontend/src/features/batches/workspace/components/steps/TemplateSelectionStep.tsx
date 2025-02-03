import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Template } from '@/types/template';
import { useTemplates } from '../../hooks/useTemplates';

interface TemplateSelectionStepProps {
  onSelect: (template: Template) => void;
  selectedTemplate: Template | null;
}

export default function TemplateSelectionStep({
  onSelect,
  selectedTemplate,
}: TemplateSelectionStepProps) {
  const { templates, search, setSearch, loading, error } = useTemplates();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search templates..."
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={2}>
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))
        ) : templates.length === 0 ? (
          // No templates found
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                {search ? 'No templates found matching your search' : 'No templates available'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={() => {/* TODO: Add new template */}}
              >
                Create Template
              </Button>
            </Box>
          </Grid>
        ) : (
          // Template cards
          templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card 
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: selectedTemplate?.id === template.id ? 'primary.main' : undefined,
                  bgcolor: selectedTemplate?.id === template.id ? 'action.selected' : undefined,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                    {selectedTemplate?.id === template.id && (
                      <CheckCircleIcon 
                        color="primary" 
                        sx={{ ml: 1, verticalAlign: 'middle' }}
                      />
                    )}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="textSecondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1,
                    }}
                  >
                    {template.content}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Variables: {template.variables.length}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={() => {/* TODO: Preview template */}}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    variant={selectedTemplate?.id === template.id ? 'contained' : 'text'}
                    onClick={() => onSelect(template)}
                    sx={{ ml: 'auto' }}
                  >
                    {selectedTemplate?.id === template.id ? 'Selected' : 'Select'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
