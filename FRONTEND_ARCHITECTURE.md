# Batch SMS Frontend Architecture

## Overview

A React-based frontend application for managing batch SMS operations, integrating with the existing backend API and Supabase database. The application enables users to select customers, choose message templates, and monitor batch sending operations.

## Core Components

### 1. Layout Components
```
src/
  components/
    layout/
      Header.tsx
      Sidebar.tsx
      MainContent.tsx
      Footer.tsx
```

### 2. Feature Components
```
src/
  features/
    customers/
      CustomerSelection.tsx     # Customer selection with filtering
      CustomerList.tsx         # Display selected customers
      CustomerFilters.tsx      # Filter controls
    
    templates/
      TemplateSelection.tsx    # Template browsing and selection
      TemplatePreview.tsx      # Preview with variable substitution
      VariableMapping.tsx      # Map template variables to customer fields
    
    batches/
      BatchCreation.tsx        # New batch setup
      BatchMonitor.tsx         # Active batch monitoring
      BatchHistory.tsx         # Historical batch listing
      BatchDetails.tsx         # Detailed batch view
      BatchAnalytics.tsx       # Analytics and metrics display
```

### 3. State Management
```
src/
  store/
    slices/
      customersSlice.ts        # Customer selection state
      templatesSlice.ts        # Template management
      batchesSlice.ts          # Batch operations
    hooks/
      useCustomers.ts          # Customer-related operations
      useTemplates.ts          # Template-related operations
      useBatches.ts           # Batch-related operations
```

## Data Flow

1. Customer Selection Flow:
   ```mermaid
   graph LR
     A[Customer List] --> B[Selection]
     B --> C[Variable Mapping]
     C --> D[Batch Creation]
   ```

2. Template Selection Flow:
   ```mermaid
   graph LR
     A[Template List] --> B[Selection]
     B --> C[Preview]
     C --> D[Variable Mapping]
   ```

3. Batch Creation Flow:
   ```mermaid
   graph LR
     A[Create Batch] --> B[Validation]
     B --> C[Schedule/Send]
     C --> D[Monitor Progress]
   ```

## Key Features

### 1. Customer Selection and Advanced Filtering
- Integration with Supabase for customer data
- Comprehensive filtering system:
  ```typescript
  interface FilterCriteria {
    column: string;
    operator: 'equals' | 'contains' | 'not_contains' | 'starts_with' |
              'ends_with' | 'greater_than' | 'less_than' | 'between' |
              'in_list' | 'is_null' | 'is_not_null';
    value: string;
    value2?: string; // For 'between' operator
  }
  ```

- Advanced Filter Components:
  ```typescript
  // src/features/customers/filters/
  - FilterBuilder.tsx       // Main filter construction UI
  - FilterRow.tsx          // Individual filter criteria
  - DateFilter.tsx         // Specialized date field handling
  - ListFilter.tsx         // Multi-value list filtering
  - SavedFilters.tsx       // Save/load filter combinations
  ```

- Filter Operations:
  - Save and reuse filter combinations
  - Export filtered customer lists
  - Create batch directly from filter results
  - Preview filtered customer count
  - Bulk select all filtered customers

- Filter to Batch Integration:
  ```typescript
  // src/features/customers/hooks/useFilteredBatch.ts
  const useFilteredBatch = () => {
    const createBatchFromFilter = async (templateId: string) => {
      const filters = useSelector(state => state.filters.activeFilters);
      
      // Get all customers matching the filter
      const recipients = await fetchFilteredCustomers(filters);
      
      // Create batch with filtered customers
      return createBatch({
        templateId,
        recipients: recipients.map(customer => ({
          phoneNumber: customer.phone,
          variables: mapCustomerToTemplateVars(customer, template)
        }))
      });
    };
    
    return { createBatchFromFilter };
  };
  ```

- Filter Performance Optimizations:
  - Debounced filter updates
  - Cached filter results
  - Progressive loading for large datasets
  - Server-side filtering via Supabase

- Special Filter Features:
  - Date range filtering with timezone support
  - List-based filtering (multiple values)
  - Null/not null checks
  - Complex filter combinations (AND/OR logic)
  - Filter validation and error handling

### 2. Template Management
- Template browsing and selection
- Dynamic preview with variable substitution
- Variable mapping interface
- Template metadata display (usage stats, etc.)

### 3. Batch Operations
- Batch Creation Methods:
  ```typescript
  interface BatchSource {
    type: 'filter' | 'selection' | 'import';
    data: {
      filterCriteria?: FilterCriteria[];    // For filter-based batches
      selectedCustomerIds?: string[];       // For selection-based batches
      importedCustomers?: CustomerData[];   // For imported lists
    };
  }
  ```

- Batch Configuration:
  ```typescript
  interface BatchConfig {
    name: string;
    templateId: string;
    source: BatchSource;
    options: {
      scheduleTime?: string;
      priority: 'high' | 'normal' | 'low';
      autoStart: boolean;
      retryStrategy: {
        maxAttempts: number;
        backoffMinutes: number;
      };
    };
  }
  ```

- Processing Features:
  - Real-time progress monitoring
  - Pause/Resume capability
  - Rate limit handling
  - Automatic retries with backoff
  - Detailed error tracking
  - Scheduled sending

- Monitoring and Analytics:
  - Progress tracking with ETA
  - Success/failure rates
  - Error categorization
  - Performance metrics
  - Delivery time analysis
  - Template performance stats

- Batch Management:
  - Historical batch listing
  - Status filtering and search
  - Batch templates
  - Audit logging
  - Export capabilities

## Technical Implementation

### 1. API Integration
```typescript
// src/api/types.ts
interface BatchCreate {
  text: string;
  recipients: Array<{
    phoneNumber: string;
    variables: Record<string, string>;
  }>;
  options?: {
    scheduleTime?: string;
    priority?: 'high' | 'normal' | 'low';
    autoStart?: boolean;
  };
}

// src/api/batchApi.ts
const batchApi = {
  create: (data: BatchCreate) => axios.post('/batch', data),
  getStatus: (id: string) => axios.get(`/batch/${id}`),
  getResults: (id: string) => axios.get(`/batch/${id}/results`),
  getAnalytics: (id: string) => axios.get(`/batch/${id}/analytics`),
  getErrors: (id: string) => axios.get(`/batch/${id}/errors`),
  resume: (id: string) => axios.post(`/batch/${id}/resume`),
  pause: (id: string) => axios.post(`/batch/${id}/pause`),
};
```

### 2. State Management
```typescript
// src/store/slices/batchesSlice.ts
interface BatchState {
  activeBatches: Record<string, BatchStatus>;
  selectedBatch: string | null;
  batchHistory: BatchHistoryItem[];
  loading: boolean;
  error: string | null;
}

const batchesSlice = createSlice({
  name: 'batches',
  initialState,
  reducers: {
    setBatchStatus: (state, action) => {
      state.activeBatches[action.payload.id] = action.payload.status;
    },
    // ... other reducers
  },
});
```

### 3. Real-time Updates
```typescript
// src/hooks/useBatchMonitor.ts
const useBatchMonitor = (batchId: string) => {
  const [status, setStatus] = useState<BatchStatus>();
  
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const status = await batchApi.getStatus(batchId);
      setStatus(status);
      
      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(pollInterval);
      }
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [batchId]);
  
  return status;
};
```

## Error Handling

1. Input Validation
- Template variable validation
- Phone number format validation
- Scheduling time validation

2. API Error Handling
- Retry mechanisms for failed requests
- User-friendly error messages
- Error boundary implementation

3. Batch Error Management
- Error categorization and display
- Retry options for failed messages
- Error analytics and reporting

## Performance Considerations

1. Customer Selection
- Pagination for large customer lists
- Debounced search
- Virtual scrolling for large datasets

2. Batch Monitoring
- Optimized polling intervals
- Batch status caching
- Progressive loading of historical data

3. Template Management
- Template caching
- Optimistic updates
- Lazy loading of template content

## Security Considerations

1. Authentication
- Integration with existing auth system
- Role-based access control
- Session management

2. Data Protection
- Secure handling of customer data
- Encryption of sensitive information
- Audit logging of operations

## Testing Strategy

1. Unit Tests
- Component testing
- State management testing
- Utility function testing

2. Integration Tests
- API integration testing
- Flow testing
- Error handling testing

3. End-to-End Tests
- Critical path testing
- Batch operation testing
- Real-time update testing

## Deployment Considerations

1. Build Configuration
- Environment-specific settings
- API endpoint configuration
- Feature flags

2. Monitoring
- Error tracking
- Performance monitoring
- Usage analytics

3. CI/CD
- Automated testing
- Build optimization
- Deployment automation

## Future Enhancements

1. Features
- Advanced scheduling options
- Template categories and tags
- Custom variable validation rules
- Batch templates and saved configurations

2. Performance
- WebSocket integration for real-time updates
- Advanced caching strategies
- Offline support

3. Analytics
- Advanced reporting
- Custom dashboards
- Export capabilities