import React from 'react';
import {
  Box,
  Chip,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Tooltip,
} from '@mui/material';
import { FIELD_LABELS } from '@/features/customers/filters/types';

interface VariableSelectorProps {
  selectedVariables: string[];
  onVariableSelect: (variable: string) => void;
  onVariableRemove: (variable: string) => void;
}

// Group customer fields by category
const FIELD_GROUPS = {
  'Basic Information': [
    'name',
    'phone',
    'email',
    'address',
    'postcode',
    'city',
  ],
  'Dates': [
    'date_active',
    'date_create',
    'last_sms_date',
    'bir_dd',
    'bir_mm',
    'bir_yy',
  ],
  'Metrics': [
    'credit',
    'point',
    'fashion_percentage',
    'shaper_percentage',
    'bra_percentage',
    'other_percentage',
  ],
  'Other': [
    'remarks',
    'ref_cus_id',
    'staff_id',
    'card_store_id',
    'store_active',
  ],
};

export const VariableSelector: React.FC<VariableSelectorProps> = ({
  selectedVariables,
  onVariableSelect,
  onVariableRemove,
}) => {
  return (
    <Box>
      {/* Selected Variables */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Selected Variables:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedVariables.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No variables selected
            </Typography>
          ) : (
            selectedVariables.map((variable) => (
              <Chip
                key={variable}
                label={FIELD_LABELS[variable] || variable}
                onDelete={() => onVariableRemove(variable)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Available Variables */}
      <Typography variant="subtitle2" gutterBottom>
        Available Customer Fields:
      </Typography>
      <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
        <List dense disablePadding>
          {Object.entries(FIELD_GROUPS).map(([group, fields]) => (
            <React.Fragment key={group}>
              <ListItem>
                <ListItemText
                  primary={group}
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    color: 'text.secondary',
                  }}
                />
              </ListItem>
              {fields.map((field) => (
                <ListItem key={field} disablePadding>
                  <ListItemButton
                    onClick={() => onVariableSelect(field)}
                    disabled={selectedVariables.includes(field)}
                    dense
                  >
                    <Tooltip title={`Insert as {{${field}}}`}>
                      <ListItemText
                        primary={FIELD_LABELS[field] || field}
                        secondary={field}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          color: 'text.secondary',
                        }}
                      />
                    </Tooltip>
                  </ListItemButton>
                </ListItem>
              ))}
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default VariableSelector;