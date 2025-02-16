import React from 'react';
import { Stack, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { FilterOperator } from './types';

interface DateFilterInputProps {
  value: string | number | Date | null;
  value2: string | number | Date | null;
  operator: FilterOperator;
  onChange: (value: string | null, value2: string | null) => void;
}

export const DateFilterInput: React.FC<DateFilterInputProps> = ({
  value,
  value2 = null,
  operator,
  onChange,
}) => {
  const formatDate = (val: string | number | Date | Dayjs | null): string | null => {
    if (!val) return null;
    const date = dayjs(val);
    if (!date.isValid()) return null;
    // Format as YYYY-MM-DD to avoid timezone issues
    return date.format('YYYY-MM-DD');
  };

  const handleDateChange = (newDate: Dayjs | null, isSecondDate = false) => {
    try {
      if (isSecondDate) {
        // For second date in range
        const formattedValue = formatDate(value);
        const formattedDate = formatDate(newDate);
        
        // Ensure second date is not before first date
        if (formattedValue && formattedDate && dayjs(formattedDate).isBefore(dayjs(formattedValue))) {
          return; // Silently ignore invalid range
        }
        
        onChange(formattedValue, formattedDate);
      } else {
        // For first date or single date
        const formattedDate = formatDate(newDate);
        const formattedValue2 = formatDate(value2);
        
        // Ensure first date is not after second date
        if (formattedDate && formattedValue2 && dayjs(formattedDate).isAfter(dayjs(formattedValue2))) {
          onChange(formattedDate, formattedDate); // Reset second date to match first
        } else {
          onChange(formattedDate, formattedValue2);
        }
      }
    } catch (error) {
      console.error('Error handling date change:', error);
      // Keep existing values on error
      onChange(
        formatDate(value),
        formatDate(value2)
      );
    }
  };

  if (operator === 'is_empty' || operator === 'is_not_empty') {
    return null;
  }

  const parseValue = (val: string | number | Date | null): Dayjs | null => {
    if (!val) return null;
    const date = dayjs(val);
    return date.isValid() ? date : null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
        <DatePicker
          value={parseValue(value)}
          onChange={(date) => handleDateChange(date)}
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: operator !== 'between',
              error: value !== null && !parseValue(value),
              helperText: value !== null && !parseValue(value) ? 'Invalid date' : undefined,
            },
          }}
        />
        {operator === 'between' && (
          <DatePicker
            value={parseValue(value2)}
            onChange={(date) => handleDateChange(date, true)}
            minDate={value ? dayjs(value) : undefined}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                error: value2 !== null && !parseValue(value2),
                helperText: value2 !== null && !parseValue(value2) ? 'Invalid date' : undefined,
              },
            }}
          />
        )}
      </Stack>
    </LocalizationProvider>
  );
};

export default DateFilterInput;
