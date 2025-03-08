# Template System

## Overview

The template system manages SMS message templates with variable substitution, preview capabilities, and validation. It integrates with both the customer management and batch operations systems.

## Features

### Variable Management
- Dynamic variable substitution
- Variable validation
- Customer field mapping
- Preview functionality

### Template Operations
- Create/Edit templates
- Template categories
- Usage tracking
- Version history

### Variable Handling
- Automatic variable extraction
- Type validation
- Default values
- Required/optional flags

### User Interface
- Mobile-first responsive design
- Grid and table view options
- Card-based template display
- Advanced search capabilities

## Implementation

### Template Structure

```typescript
interface Template {
  id: string;
  name: string;
  content: string;
  variables: VariableDefinition[];
  category?: string;
  isPrivate: boolean;
  author?: string;
  metadata: {
    created: string;
    modified: string;
    usageCount: number;
  };
}

interface VariableDefinition {
  name: string;
  type: 'string' | 'number' | 'date';
  required: boolean;
  defaultValue?: string;
  description?: string;
}
```

### UI Components

#### Template List Views
- Grid View (Mobile-First)
  - Card-based layout
  - Content preview
  - Variable chips
  - Touch-friendly actions
  - Responsive grid columns

- Table View (Desktop)
  - Full content display
  - Sortable columns
  - Bulk actions
  - Advanced filtering

#### Template Card
```typescript
interface TemplateCard {
  template: Template;
  onPreviewClick: (template: Template) => void;
  onEditClick: (template: Template) => void;
  onDeleteClick: (template: Template) => void;
  onTemplateSelect: (template: Template) => void;
}
```

#### Template Actions
- Preview template
- Edit template
- Delete template
- View template details

### Variable Extraction

```typescript
// Extract variables from template content
const extractVariables = (content: string): string[] => {
  const variableRegex = /{{([^{}]+)}}/g;
  const matches = content.match(variableRegex) || [];
  return [...new Set(matches.map(match => 
    match.slice(2, -2).trim()
  ))];
};

// Extract only required variables for a customer
const extractRequiredVariables = (
  customer: Record<string, any>,
  usedVariables: string[]
): Record<string, any> => {
  const variables: Record<string, any> = {};
  usedVariables.forEach(variable => {
    if (variable in customer) {
      variables[variable] = customer[variable];
    }
  });
  return variables;
};
```

## Best Practices

1. Template Creation
   - Use clear variable names
   - Include variable descriptions
   - Test with sample data
   - Validate all variables

2. Variable Usage
   - Only store used variables
   - Validate before sending
   - Handle missing values
   - Use consistent naming

3. Performance
   - Cache template parsing
   - Optimize variable extraction
   - Batch variable validation
   - Efficient storage

4. UI/UX Guidelines
   - Use grid view for mobile
   - Show content previews
   - Provide clear actions
   - Support touch interactions
   - Maintain responsive layout

## API Endpoints

### Create Template
```
POST /api/templates
Body: {
  name: string;
  content: string;
  category?: string;
  isPrivate: boolean;
  author?: string;
}
```

### Get Template
```
GET /api/templates/:id
```

### Update Template
```
PUT /api/templates/:id
Body: {
  name?: string;
  content?: string;
  category?: string;
  isPrivate?: boolean;
}
```

### List Templates
```
GET /api/templates
Query Parameters:
- category: string
- search: string
- page: number
- pageSize: number
```

### Preview Template
```
POST /api/templates/preview
Body: {
  content: string;
  variables: Record<string, any>;
}
```

## Error Handling

1. Variable Errors
   - Missing required variables
   - Invalid variable types
   - Unknown variables
   - Malformed variables

2. Template Errors
   - Invalid template syntax
   - Missing content
   - Duplicate templates
   - Version conflicts

## Security Considerations

1. Access Control
   - Template permissions
   - Private templates
   - Author tracking
   - Usage auditing

2. Data Protection
   - Variable sanitization
   - Content validation
   - Secure storage
   - Access logging
