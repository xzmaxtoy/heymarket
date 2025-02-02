# Customer Management

## Overview

The customer management system provides advanced filtering, selection, and data management capabilities for SMS batch operations. It integrates with Supabase for data storage and includes comprehensive filtering options.

## Features

### Advanced Filtering
- Multiple filter operators:
  * Contains/Does Not Contain
  * Starts With/Ends With
  * Is Null/Is Not Null
  * Equals/Greater Than/Less Than
  * Between/In List
- Filter combinations (AND/OR logic)
- Saved filters
- Eastern Time date handling

### Column Management
- Customizable column visibility
- Column settings persistence
- Responsive column layout
- Column-specific filtering

### Data Operations
- Bulk selection
- Export functionality
- Server-side pagination
- Search capabilities
- Settings persistence

## Implementation

### Filter System

```typescript
interface FilterCriteria {
  column: string;
  operator: FilterOperator;
  value: string | number | null;
  value2?: string | number; // For 'between' operator
}

type FilterOperator =
  | 'equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in_list'
  | 'is_null'
  | 'is_not_null';
```

### Column Configuration

```typescript
interface ColumnConfig {
  field: string;
  headerName: string;
  visible: boolean;
  width?: number;
  filterOperators?: FilterOperator[];
  valueFormatter?: (value: any) => string;
}
```

## Performance Optimizations

1. Data Loading
   - Server-side pagination
   - Optimized SQL queries
   - Caching strategies
   - Progressive loading

2. Filter Operations
   - Debounced updates
   - Cached filter results
   - Optimized filter combinations
   - Background processing

3. UI Performance
   - Virtual scrolling
   - Lazy loading
   - Optimized re-renders
   - Efficient state updates

## Best Practices

1. Filter Usage
   - Use appropriate operators
   - Combine filters effectively
   - Save common filters
   - Monitor filter performance

2. Data Management
   - Regular data cleanup
   - Efficient bulk operations
   - Proper error handling
   - Data validation

3. UI/UX
   - Clear filter indicators
   - Responsive design
   - Loading states
   - Error feedback

## API Endpoints

### Get Customers
```
GET /api/customers
Query Parameters:
- filters: JSON array of filter objects
- page: Page number
- pageSize: Results per page
```

### Save Filter
```
POST /api/customers/filters
Body: {
  name: string;
  filters: FilterCriteria[];
}
```

### Get Saved Filters
```
GET /api/customers/filters
```

### Export Customers
```
GET /api/customers/export
Query Parameters:
- format: 'csv' | 'json'
- filters: JSON array of filter objects
