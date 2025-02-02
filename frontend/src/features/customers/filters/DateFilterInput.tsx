import React from 'react';
import { Stack } from '@mui/material';
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
  const handleDateChange = (date: Dayjs | null, isSecondDate = false) => {
    if (isSecondDate) {
      onChange(
        value ? (value instanceof Date ? value.toISOString() : String(value)) : null,
        date?.toISOString() || null
      );
    } else {
      onChange(
        date?.toISOString() || null,
        value2 ? (value2 instanceof Date ? value2.toISOString() : String(value2)) : null
      );
    }
  };

  if (operator === 'is_empty' || operator === 'is_not_empty') {
    return null;
  }

  const parseValue = (val: string | number | Date | null): Dayjs | null => {
    if (!val) return null;
    if (val instanceof Date) return dayjs(val);
    return dayjs(val);
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
            },
          }}
        />
        {operator === 'between' && (
          <DatePicker
            value={parseValue(value2)}
            onChange={(date) => handleDateChange(date, true)}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
              },
            }}
          />
        )}
      </Stack>
    </LocalizationProvider>
  );
};

export default DateFilterInput;
