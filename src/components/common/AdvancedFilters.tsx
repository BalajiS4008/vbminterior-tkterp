import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Grid,
  Typography,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterField[];
  filterValues: FilterValues;
  onFilterChange: (values: FilterValues) => void;
  onClearFilters: () => void;
  showActiveFilters?: boolean;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  onClearFilters,
  showActiveFilters = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleFilterValueChange = (key: string, value: any) => {
    onFilterChange({ ...filterValues, [key]: value });
  };

  const handleRemoveFilter = (key: string) => {
    const newValues = { ...filterValues };
    delete newValues[key];
    onFilterChange(newValues);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filterValues).filter((key) => {
      const value = filterValues[key];
      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined || value === '') return false;
      return true;
    }).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getFilterLabel = (key: string, value: any): string => {
    const filter = filters.find((f) => f.key === key);
    if (!filter) return `${key}: ${value}`;

    if (filter.type === 'multiselect' && Array.isArray(value)) {
      const labels = value.map((v) => {
        const option = filter.options?.find((o) => o.value === v);
        return option?.label || v;
      });
      return `${filter.label}: ${labels.join(', ')}`;
    }

    if (filter.type === 'select') {
      const option = filter.options?.find((o) => o.value === value);
      return `${filter.label}: ${option?.label || value}`;
    }

    if (filter.type === 'date' || filter.type === 'daterange') {
      if (value instanceof Date) {
        return `${filter.label}: ${value.toLocaleDateString()}`;
      }
      if (typeof value === 'object' && value.start && value.end) {
        return `${filter.label}: ${value.start.toLocaleDateString()} - ${value.end.toLocaleDateString()}`;
      }
    }

    return `${filter.label}: ${value}`;
  };

  const renderFilterField = (filter: FilterField) => {
    switch (filter.type) {
      case 'select':
        return (
          <FormControl size="small" fullWidth>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={filterValues[filter.key] || ''}
              label={filter.label}
              onChange={(e) => handleFilterValueChange(filter.key, e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {filter.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl size="small" fullWidth>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              multiple
              value={filterValues[filter.key] || []}
              label={filter.label}
              onChange={(e) => handleFilterValueChange(filter.key, e.target.value)}
              input={<OutlinedInput label={filter.label} />}
              renderValue={(selected) =>
                (selected as string[])
                  .map((v) => filter.options?.find((o) => o.value === v)?.label || v)
                  .join(', ')
              }
            >
              {filter.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox
                    checked={(filterValues[filter.key] || []).includes(option.value)}
                  />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={filter.label}
              value={filterValues[filter.key] || null}
              onChange={(date) => handleFilterValueChange(filter.key, date)}
              slotProps={{
                textField: { size: 'small', fullWidth: true },
              }}
            />
          </LocalizationProvider>
        );

      case 'daterange':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <DatePicker
                label={`${filter.label} From`}
                value={filterValues[filter.key]?.start || null}
                onChange={(date) =>
                  handleFilterValueChange(filter.key, {
                    ...filterValues[filter.key],
                    start: date,
                  })
                }
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
              />
              <DatePicker
                label={`${filter.label} To`}
                value={filterValues[filter.key]?.end || null}
                onChange={(date) =>
                  handleFilterValueChange(filter.key, {
                    ...filterValues[filter.key],
                    end: date,
                  })
                }
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
              />
            </Box>
          </LocalizationProvider>
        );

      case 'text':
        return (
          <TextField
            size="small"
            fullWidth
            label={filter.label}
            value={filterValues[filter.key] || ''}
            onChange={(e) => handleFilterValueChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          fullWidth
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchValue && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant={expanded ? 'contained' : 'outlined'}
          startIcon={<FilterIcon />}
          endIcon={expanded ? <CollapseIcon /> : <ExpandIcon />}
          onClick={() => setExpanded(!expanded)}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Filters
          {activeFiltersCount > 0 && (
            <Chip
              label={activeFiltersCount}
              size="small"
              color="primary"
              sx={{ ml: 1, height: 20, minWidth: 20 }}
            />
          )}
        </Button>
      </Box>

      {/* Active Filters */}
      {showActiveFilters && activeFiltersCount > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Active filters:
          </Typography>
          {Object.keys(filterValues).map((key) => {
            const value = filterValues[key];
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            return (
              <Chip
                key={key}
                label={getFilterLabel(key, value)}
                size="small"
                onDelete={() => handleRemoveFilter(key)}
                color="primary"
                variant="outlined"
              />
            );
          })}
          <Button size="small" onClick={onClearFilters} startIcon={<ClearIcon />}>
            Clear All
          </Button>
        </Box>
      )}

      {/* Expanded Filters */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          {filters.map((filter) => (
            <Grid size={{ xs: 12, sm: 6, md: filter.type === 'daterange' ? 6 : 3 }} key={filter.key}>
              {renderFilterField(filter)}
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClearFilters} startIcon={<ClearIcon />}>
            Clear Filters
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AdvancedFilters;
