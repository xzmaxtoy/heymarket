import React from 'react';
import { ToggleButtonGroup, ToggleButton, useTheme, useMediaQuery } from '@mui/material';
import { GridView as GridViewIcon, ViewList as ViewListIcon } from '@mui/icons-material';

interface ViewToggleProps {
  view: 'grid' | 'table';
  onChange: (view: 'grid' | 'table') => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Don't show toggle on mobile - always use grid view
  if (isMobile) {
    return null;
  }

  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      onChange={(_, newView) => {
        if (newView !== null) {
          onChange(newView);
        }
      }}
      size="small"
      sx={{ mb: 2 }}
    >
      <ToggleButton value="grid" aria-label="grid view">
        <GridViewIcon />
      </ToggleButton>
      <ToggleButton value="table" aria-label="table view">
        <ViewListIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
