import React from 'react';
import { Grid, Box, useTheme, useMediaQuery } from '@mui/material';
import { Template } from '../types';
import TemplateCard from './TemplateCard';

interface TemplateCardGridProps {
  templates: Template[];
  onTemplateSelect: (template: Template) => void;
  onPreviewClick: (template: Template) => void;
  onEditClick: (template: Template) => void;
  onDeleteClick: (template: Template) => void;
}

export default function TemplateCardGrid({
  templates,
  onTemplateSelect,
  onPreviewClick,
  onEditClick,
  onDeleteClick,
}: TemplateCardGridProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const getColumnCount = () => {
    if (isMobile) return 12; // 1 column
    if (isTablet) return 6;  // 2 columns
    if (isDesktop) return 4; // 3 columns
    return 3;                // 4 columns on large screens
  };

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Grid container spacing={2}>
        {templates.map(template => (
          <Grid 
            key={template.id} 
            item 
            xs={getColumnCount()}
            sx={{
              display: 'flex',
              [theme.breakpoints.down('sm')]: {
                px: 1 // Smaller padding on mobile
              }
            }}
          >
            <TemplateCard
              template={template}
              onTemplateSelect={onTemplateSelect}
              onPreviewClick={onPreviewClick}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
