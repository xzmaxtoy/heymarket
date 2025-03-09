import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  useTheme,
  Tooltip,
} from '@mui/material';
import { Template } from '../types';
import TemplateActions from './TemplateActions';

interface TemplateCardProps {
  template: Template;
  onPreviewClick: (template: Template) => void;
  onEditClick: (template: Template) => void;
  onDeleteClick: (template: Template) => void;
  onTemplateSelect: (template: Template) => void;
}

export default function TemplateCard({
  template,
  onPreviewClick,
  onEditClick,
  onDeleteClick,
  onTemplateSelect,
}: TemplateCardProps) {
  const theme = useTheme();

  const handleCardClick = () => {
    onTemplateSelect(template);
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={handleCardClick}
    >
      <CardHeader
        title={template.name}
        titleTypographyProps={{ 
          variant: 'h6', 
          noWrap: true,
          sx: { lineHeight: 1.4 }
        }}
        sx={{
          pb: 1,
          '& .MuiCardHeader-content': {
            overflow: 'hidden'
          }
        }}
      />
      
      <CardContent sx={{ flex: 1, pt: 0 }}>
        {/* Content Preview */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {template.content}
        </Typography>

        {/* Variables */}
        {template.variables.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Variables
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {template.variables.map((variable) => (
                <Tooltip key={variable} title={variable}>
                  <Chip
                    label={variable}
                    size="small"
                    sx={{ 
                      maxWidth: 120,
                      '.MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        )}

        {/* Created Date */}
        <Typography variant="body2" color="text.secondary">
          Created: {new Date(template.created_at).toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions 
        sx={{ 
          pt: 0, 
          px: 2, 
          pb: 2
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <TemplateActions
          template={template}
          onPreviewClick={onPreviewClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      </CardActions>
    </Card>
  );
}
