import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Alert,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Template } from '@/types/template';
import { Customer } from '@/types/customer';
import { useCustomers } from '../../hooks/useCustomers';

interface CustomerConfigurationStepProps {
  onConfigure: (customers: Customer[]) => void;
  onBack: () => void;
  selectedCustomers: Customer[];
  template: Template;
}

export default function CustomerConfigurationStep({
  onConfigure,
  onBack,
  selectedCustomers,
  template,
}: CustomerConfigurationStepProps) {
  const [selected, setSelected] = useState<Customer[]>(selectedCustomers);
  const { customers, loading, error, totalCount, page, setPage, pageSize, search, setSearch } = useCustomers({
    pageSize: 10,
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = [...selected];
      customers.forEach(customer => {
        if (!selected.find(s => s.id === customer.id)) {
          newSelected.push(customer);
        }
      });
      setSelected(newSelected);
    } else {
      const customerIds = customers.map(c => c.id);
      setSelected(selected.filter(s => !customerIds.includes(s.id)));
    }
  };

  const handleSelect = (customer: Customer) => {
    const selectedIndex = selected.findIndex(s => s.id === customer.id);
    let newSelected: Customer[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, customer];
    } else {
      newSelected = selected.filter(s => s.id !== customer.id);
    }

    setSelected(newSelected);
  };

  const handleContinue = () => {
    onConfigure(selected);
  };

  const isSelected = (customer: Customer) => selected.some(s => s.id === customer.id);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search customers..."
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
          <Chip
            label={`${selected.length} selected`}
            color="primary"
            onDelete={selected.length > 0 ? () => setSelected([]) : undefined}
          />
        </Stack>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < customers.length}
                  checked={customers.length > 0 && selected.length === customers.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Active Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Loading...</TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No customers found</TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                const isItemSelected = isSelected(customer);
                return (
                  <TableRow
                    hover
                    onClick={() => handleSelect(customer)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={customer.id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={isItemSelected} />
                    </TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{new Date(customer.date_active).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[pageSize]}
        />
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={handleContinue}
          disabled={selected.length === 0}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}
