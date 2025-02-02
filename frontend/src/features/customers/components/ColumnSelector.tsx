import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { ALL_COLUMNS } from '@/types/customer';
import { useAppDispatch } from '@/store/hooks';
import { updateColumnVisibility } from '@/store/slices/customersSlice';

interface ColumnSelectorProps {
  open: boolean;
  onClose: () => void;
  selectedColumns: Set<string>;
  onColumnToggle: (field: string) => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  open,
  onClose,
  selectedColumns,
  onColumnToggle,
}) => {
  const dispatch = useAppDispatch();

  const handleColumnToggle = (field: string) => {
    const newColumns = new Set(selectedColumns);
    if (newColumns.has(field)) {
      if (newColumns.size > 1) {
        newColumns.delete(field);
      }
    } else {
      newColumns.add(field);
    }
    dispatch(updateColumnVisibility(Array.from(newColumns)));
  };
  // Group columns by type for better organization
  const columnGroups = {
    identification: ['id', 'cus_id', 'code', 'name'],
    contact: ['phone', 'email', 'address', 'postcode', 'city'],
    dates: ['date_active', 'date_create', 'last_sms_date'],
    birthday: ['bir_dd', 'bir_mm', 'bir_yy'],
    options: ['option1', 'option2', 'option3'],
    metrics: ['credit', 'point', 'fashion_percentage', 'shaper_percentage', 'bra_percentage', 'other_percentage'],
    other: ['remarks', 'ref_cus_id', 'staff_id', 'card_store_id', 'store_active']
  };

  // Ensure all columns in groups exist in ALL_COLUMNS
  const validColumnGroups = Object.entries(columnGroups).reduce((acc, [key, fields]) => {
    const validFields = fields.filter(field => 
      ALL_COLUMNS.some(col => col.field === field)
    );
    if (validFields.length > 0) {
      acc[key] = validFields;
    }
    return acc;
  }, {} as Record<string, string[]>);

  // Group titles for display
  const groupTitles: Record<string, string> = {
    identification: 'Identification',
    contact: 'Contact Information',
    dates: 'Important Dates',
    birthday: 'Birthday',
    options: 'Options',
    metrics: 'Metrics',
    other: 'Other Information'
  };

  const renderColumnGroup = (groupKey: string, fields: string[]) => {
    const title = groupTitles[groupKey] || groupKey;
    return (
      <Box key={groupKey} sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <FormGroup>
          {fields.map((field) => {
            const column = ALL_COLUMNS.find(col => col.field === field);
            if (!column) return null;
            
            const isDisabled = selectedColumns.size === 1 && selectedColumns.has(field);
            
            return (
              <FormControlLabel
                key={field}
                control={
                  <Checkbox
                    checked={selectedColumns.has(field)}
                    onChange={() => handleColumnToggle(field)}
                    disabled={isDisabled}
                  />
                }
                label={column.headerName}
                sx={{
                  opacity: isDisabled ? 0.7 : 1,
                  '& .MuiFormControlLabel-label': {
                    color: isDisabled ? 'text.disabled' : 'text.primary'
                  }
                }}
              />
            );
          })}
        </FormGroup>
        <Divider sx={{ mt: 1 }} />
      </Box>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 300 }
      }}
    >
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Column Selection
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {Object.entries(validColumnGroups).map(([key, fields]) => 
          renderColumnGroup(key, fields)
        )}
      </Box>
    </Drawer>
  );
};

export default ColumnSelector;
