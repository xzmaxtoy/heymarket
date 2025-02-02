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

  const renderColumnGroup = (title: string, fields: string[]) => (
    <Box key={title} sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <FormGroup>
        {fields.map((field) => {
          const column = ALL_COLUMNS.find(col => col.field === field);
          if (!column) return null;
          
          return (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedColumns.has(field)}
                  onChange={() => onColumnToggle(field)}
                  disabled={selectedColumns.size === 1 && selectedColumns.has(field)}
                />
              }
              label={column.headerName}
            />
          );
        })}
      </FormGroup>
      <Divider sx={{ mt: 1 }} />
    </Box>
  );

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
        
        {renderColumnGroup('Identification', columnGroups.identification)}
        {renderColumnGroup('Contact Information', columnGroups.contact)}
        {renderColumnGroup('Important Dates', columnGroups.dates)}
        {renderColumnGroup('Birthday', columnGroups.birthday)}
        {renderColumnGroup('Options', columnGroups.options)}
        {renderColumnGroup('Metrics', columnGroups.metrics)}
        {renderColumnGroup('Other Information', columnGroups.other)}
      </Box>
    </Drawer>
  );
};

export default ColumnSelector;