import React, { useState, useEffect } from 'react';
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
import { FilterGroup } from '@/features/customers/filters/types';

interface CustomerConfigurationStepProps {
  onConfigure: (customers: Customer[]) => void;
  onBack: () => void;
  selectedCustomers: Customer[];
  template: Template;
  filterMode?: 'direct' | 'filtered';
  activeFilters?: FilterGroup[];
  searchText?: string;
}

export default function CustomerConfigurationStep({
  onConfigure,
  onBack,
  selectedCustomers,
  template,
  filterMode = 'direct',
  activeFilters,
  searchText,
}: CustomerConfigurationStepProps) {
  const [selected, setSelected] = useState<Customer[]>(selectedCustomers);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const { customers, loading, error, totalCount, page, setPage, pageSize, search, setSearch } = useCustomers({
    pageSize: 10,
    activeFilters,
    searchText,
    filterMode
  });

  // Track which pages have been loaded and selected
  useEffect(() => {
    if (!loading && customers.length > 0) {
      setSelectedPages(prev => new Set(prev).add(page));
    }
  }, [loading, customers, page]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setSelectedPages(new Set()); // Reset selected pages on new search
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  // Handle select all for current page
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

  // Handle select all filtered customers
  const handleSelectAllFiltered = () => {
    if (filterMode === 'filtered' && customers.length > 0) {
      setSelected(customers);
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

  const isAllSelected = customers.length > 0 && 
    customers.every(customer => selected.some(s => s.id === customer.id));

  const isIndeterminate = selected.length > 0 && 
    customers.some(customer => selected.some(s => s.id === customer.id)) &&
    !isAllSelected;

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
        <Stack spacing={2}>
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
          
          {filterMode === 'filtered' && activeFilters && activeFilters.length > 0 && (
            <>
              <Alert 
                severity="info"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleSelectAllFiltered}
                    disabled={loading || customers.length === 0}
                  >
                    Select All Filtered
                  </Button>
                }
              >
                Using filters from customer tab. {totalCount} customers match the current filters.
              </Alert>
              {selectedPages.size > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Selected customers from {selectedPages.size} page(s). Navigate through pages to select more customers.
                </Typography>
              )}
            </>
          )}
        </Stack>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
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
