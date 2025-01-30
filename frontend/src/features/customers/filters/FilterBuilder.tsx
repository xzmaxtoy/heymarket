import React from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  TextField,
  FormControl,
  InputLabel,
  Stack,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  FilterCondition,
  FilterGroup,
  Filter,
  LogicalOperator,
  FIELD_TYPES,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
  FIELD_LABELS,
} from './types';
import { DateFilterInput } from './DateFilterInput';
import { v4 as uuidv4 } from 'uuid';
import { GridLogicOperator } from '@mui/x-data-grid';

interface FilterBuilderProps {
  filter?: Filter;
  onChange: (filter: Filter) => void;
}

interface ConditionWithId extends FilterCondition {
  id: string;
}

interface GroupWithId extends FilterGroup {
  id: string;
  conditions: ConditionWithId[];
}

const defaultFilter: Filter = {
  conditions: [],
  operator: GridLogicOperator.And,
};

export const FilterBuilder: React.FC<FilterBuilderProps> = ({ filter = defaultFilter, onChange }) => {
  // Convert Filter to FilterGroup array and ensure all conditions have IDs
  const [groups, setGroups] = React.useState<GroupWithId[]>([{
    id: uuidv4(),
    conditions: (filter?.conditions || []).map(condition => ({
      ...condition,
      id: condition.id || uuidv4()
    })),
    operator: filter?.operator || GridLogicOperator.And
  }]);

  // Update parent when groups change
  React.useEffect(() => {
    if (groups.length > 0) {
      onChange({
        conditions: groups[0].conditions,
        operator: groups[0].operator
      });
    }
  }, [groups, onChange]);

  const addGroup = () => {
    setGroups([
      ...groups,
      {
        id: uuidv4(),
        operator: GridLogicOperator.And,
        conditions: [],
      },
    ]);
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
  };

  const addCondition = (groupId: string) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: [
                ...group.conditions,
                {
                  id: uuidv4(),
                  field: 'name',
                  operator: 'equals',
                  value: null,
                },
              ],
            }
          : group
      )
    );
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.filter((c) => c.id !== conditionId),
            }
          : group
      )
    );
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    updates: Partial<FilterCondition>
  ) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map((condition) =>
                condition.id === conditionId
                  ? { ...condition, ...updates }
                  : condition
              ),
            }
          : group
      )
    );
  };

  const updateGroupLogic = (groupId: string, operator: LogicalOperator) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId ? { ...group, operator } : group
      )
    );
  };

  const renderValueInput = (groupId: string, condition: ConditionWithId) => {
    const fieldType = FIELD_TYPES[condition.field];

    if (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') {
      return null;
    }

    if (fieldType === 'date') {
      return (
        <DateFilterInput
          value={condition.value}
          value2={condition.value2 || null}
          operator={condition.operator}
          onChange={(value, value2) => {
            updateCondition(groupId, condition.id, { 
              value: value || null,
              value2: value2 || null 
            });
          }}
        />
      );
    }

    if (condition.operator === 'in_list') {
      return (
        <TextField
          multiline
          rows={4}
          value={String(condition.value || '')}
          onChange={(e) => updateCondition(groupId, condition.id, { 
            value: e.target.value || null 
          })}
          placeholder="Enter values, one per line"
          fullWidth
          size="small"
        />
      );
    }

    if (condition.operator === 'between') {
      return (
        <Stack direction="row" spacing={1}>
          <TextField
            type={fieldType === 'number' ? 'number' : 'text'}
            value={String(condition.value || '')}
            onChange={(e) =>
              updateCondition(groupId, condition.id, { 
                value: e.target.value || null 
              })
            }
            placeholder="From"
            size="small"
          />
          <TextField
            type={fieldType === 'number' ? 'number' : 'text'}
            value={String(condition.value2 || '')}
            onChange={(e) =>
              updateCondition(groupId, condition.id, { 
                value2: e.target.value || null 
              })
            }
            placeholder="To"
            size="small"
          />
        </Stack>
      );
    }

    return (
      <TextField
        type={fieldType === 'number' ? 'number' : 'text'}
        value={String(condition.value || '')}
        onChange={(e) => updateCondition(groupId, condition.id, { 
          value: e.target.value || null 
        })}
        size="small"
        fullWidth
      />
    );
  };

  return (
    <Box>
      <Stack spacing={2}>
        {groups.map((group) => (
          <Paper key={group.id} sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small">
                  <Select
                    value={group.operator}
                    onChange={(e) =>
                      updateGroupLogic(group.id, e.target.value as LogicalOperator)
                    }
                  >
                    <MenuItem value={GridLogicOperator.And}>AND</MenuItem>
                    <MenuItem value={GridLogicOperator.Or}>OR</MenuItem>
                  </Select>
                </FormControl>
                <IconButton
                  onClick={() => removeGroup(group.id)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Stack spacing={2}>
                {group.conditions.map((condition) => (
                  <Box
                    key={condition.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Field</InputLabel>
                      <Select
                        value={condition.field}
                        onChange={(e) =>
                          updateCondition(group.id, condition.id, {
                            field: e.target.value,
                            value: null,
                            value2: null,
                          })
                        }
                        label="Field"
                      >
                        {Object.entries(FIELD_LABELS).map(([field, label]) => (
                          <MenuItem key={field} value={field}>
                            {label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Operator</InputLabel>
                      <Select
                        value={condition.operator}
                        onChange={(e) =>
                          updateCondition(group.id, condition.id, {
                            operator: e.target.value as FilterCondition['operator'],
                            value: null,
                            value2: null,
                          })
                        }
                        label="Operator"
                      >
                        {OPERATORS_BY_TYPE[FIELD_TYPES[condition.field]].map(
                          (operator) => (
                            <MenuItem key={operator} value={operator}>
                              {OPERATOR_LABELS[operator]}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    </FormControl>

                    <Box sx={{ flexGrow: 1 }}>
                      {renderValueInput(group.id, condition)}
                    </Box>

                    <IconButton
                      onClick={() => removeCondition(group.id, condition.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Stack>

              <Button
                startIcon={<AddIcon />}
                onClick={() => addCondition(group.id)}
                variant="outlined"
                size="small"
              >
                Add Condition
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Button
        startIcon={<AddIcon />}
        onClick={addGroup}
        variant="outlined"
        sx={{ mt: 2 }}
      >
        Add Filter Group
      </Button>
    </Box>
  );
};

export default FilterBuilder;
