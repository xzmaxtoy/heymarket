import { GridFilterModel, GridFilterItem, GridLogicOperator } from '@mui/x-data-grid';

export type FilterOperator = 
  | 'equals' 
  | 'contains'
  | 'not_contains'
  | 'startsWith' 
  | 'endsWith' 
  | 'greaterThan' 
  | 'lessThan'
  | 'between'
  | 'in_list'
  | 'is_empty'
  | 'is_not_empty';

export type LogicalOperator = GridLogicOperator;

export type FieldType = 'string' | 'number' | 'date' | 'boolean';

export interface FilterCondition {
  id?: string;
  field: string;
  operator: FilterOperator;
  value: string | number | Date | null;
  value2?: string | number | Date | null; // For between operator
}

export interface FilterGroup {
  id?: string;
  conditions: FilterCondition[];
  operator: LogicalOperator;
}

export interface Filter {
  conditions: FilterCondition[];
  operator: LogicalOperator;
}

export interface SavedFilter {
  id: string;
  name: string;
  filter: Filter;
}

export interface FilterBuilderProps {
  value: FilterGroup[];
  onChange: (groups: FilterGroup[]) => void;
}

export const FIELD_TYPES: Record<string, FieldType> = {
  name: 'string',
  phone: 'string',
  email: 'string',
  address: 'string',
  postcode: 'string',
  city: 'string',
  date_active: 'date',
  date_create: 'date',
  last_sms_date: 'date',
  credit: 'number',
  point: 'number',
  fashion_percentage: 'number',
  shaper_percentage: 'number',
  bra_percentage: 'number',
  other_percentage: 'number',
  remarks: 'string',
  ref_cus_id: 'string',
  staff_id: 'string',
  card_store_id: 'string',
  store_active: 'boolean'
};

export const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
  postcode: 'Postcode',
  city: 'City',
  date_active: 'Active Date',
  date_create: 'Created Date',
  last_sms_date: 'Last SMS',
  credit: 'Credit',
  point: 'Points',
  fashion_percentage: 'Fashion %',
  shaper_percentage: 'Shaper %',
  bra_percentage: 'Bra %',
  other_percentage: 'Other %',
  remarks: 'Remarks',
  ref_cus_id: 'Ref Customer',
  staff_id: 'Staff ID',
  card_store_id: 'Store ID',
  store_active: 'Store Active'
};

export const OPERATORS_BY_TYPE: Record<FieldType, FilterOperator[]> = {
  string: ['equals', 'contains', 'not_contains', 'startsWith', 'endsWith', 'is_empty', 'is_not_empty', 'in_list'],
  number: ['equals', 'greaterThan', 'lessThan', 'between', 'is_empty', 'is_not_empty'],
  date: ['equals', 'greaterThan', 'lessThan', 'between', 'is_empty', 'is_not_empty'],
  boolean: ['equals', 'is_empty', 'is_not_empty'],
};

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals',
  contains: 'Contains',
  not_contains: 'Does not contain',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  greaterThan: 'Greater than',
  lessThan: 'Less than',
  between: 'Between',
  in_list: 'In list',
  is_empty: 'Is empty',
  is_not_empty: 'Is not empty',
};

// Convert filter groups to MUI DataGrid filter model
export const convertToGridFilterModel = (groups: FilterGroup[]): GridFilterModel => {
  return {
    items: groups.flatMap(group => 
      group.conditions.map(condition => {
        const item: GridFilterItem = {
          field: condition.field,
          operator: condition.operator,
          value: condition.operator === 'between' ? [condition.value, condition.value2] : condition.value,
        };
        return item;
      })
    ),
    logicOperator: groups[0]?.operator || GridLogicOperator.And,
  };
};

// Convert MUI DataGrid filter model to filter groups
export const convertFromGridFilterModel = (filterModel: GridFilterModel): FilterGroup[] => {
  return [{
    id: crypto.randomUUID(),
    conditions: filterModel.items.map(item => {
      const condition: FilterCondition = {
        id: crypto.randomUUID(),
        field: item.field,
        operator: item.operator as FilterOperator,
        value: Array.isArray(item.value) ? item.value[0] : item.value,
        value2: Array.isArray(item.value) ? item.value[1] : undefined,
      };
      return condition;
    }),
    operator: filterModel.logicOperator || GridLogicOperator.And,
  }];
};
