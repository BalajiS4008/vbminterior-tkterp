import React, { useState } from 'react';
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Stack,
  Typography,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns';

export type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all';

export interface DashboardFilterValues {
  projectId: string;
  timePeriod: TimePeriod;
  startDate: Date | null;
  endDate: Date | null;
}

interface DashboardFiltersProps {
  projects: Array<{ id: string; name: string }>;
  filterValues: DashboardFilterValues;
  onFilterChange: (values: DashboardFilterValues) => void;
  loading?: boolean;
}

const timePeriodOptions: Array<{ value: TimePeriod; label: string }> = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export const getDateRangeForPeriod = (period: TimePeriod): { start: Date | null; end: Date | null } => {
  const now = new Date();

  switch (period) {
    case 'today':
      return { start: now, end: now };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'quarter':
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'all':
    case 'custom':
    default:
      return { start: null, end: null };
  }
};

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  projects,
  filterValues,
  onFilterChange,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(false);

  const handleProjectChange = (projectId: string) => {
    onFilterChange({ ...filterValues, projectId });
  };

  const handleTimePeriodChange = (timePeriod: TimePeriod) => {
    const dateRange = getDateRangeForPeriod(timePeriod);
    onFilterChange({
      ...filterValues,
      timePeriod,
      startDate: dateRange.start,
      endDate: dateRange.end,
    });
  };

  const handleStartDateChange = (date: Date | null) => {
    onFilterChange({
      ...filterValues,
      timePeriod: 'custom',
      startDate: date,
    });
  };

  const handleEndDateChange = (date: Date | null) => {
    onFilterChange({
      ...filterValues,
      timePeriod: 'custom',
      endDate: date,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      projectId: '',
      timePeriod: 'all',
      startDate: null,
      endDate: null,
    });
  };

  const hasActiveFilters = filterValues.projectId || filterValues.timePeriod !== 'all';

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterValues.projectId) count++;
    if (filterValues.timePeriod !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Quick period buttons for mobile
  const QuickPeriodButtons = () => (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
      {timePeriodOptions.slice(0, 5).map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          size="small"
          variant={filterValues.timePeriod === option.value ? 'filled' : 'outlined'}
          color={filterValues.timePeriod === option.value ? 'primary' : 'default'}
          onClick={() => handleTimePeriodChange(option.value)}
        />
      ))}
    </Stack>
  );

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Header with toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 2 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="action" />
          <Typography variant="subtitle2" color="text.secondary">
            Dashboard Filters
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              label={activeFiltersCount}
              size="small"
              color="primary"
              sx={{ height: 20, minWidth: 20 }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasActiveFilters && (
            <Button size="small" onClick={handleClearFilters} startIcon={<ClearIcon />}>
              Clear
            </Button>
          )}
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Quick period selection - always visible on desktop */}
      {!isMobile && !expanded && (
        <Box sx={{ mt: 2 }}>
          <QuickPeriodButtons />
        </Box>
      )}

      {/* Expanded filters */}
      <Collapse in={expanded}>
        <Stack spacing={2}>
          {/* Time Period Selection */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Time Period
            </Typography>
            <QuickPeriodButtons />
          </Box>

          {/* Custom Date Range */}
          {filterValues.timePeriod === 'custom' && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <DatePicker
                  label="Start Date"
                  value={filterValues.startDate}
                  onChange={handleStartDateChange}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={filterValues.endDate}
                  onChange={handleEndDateChange}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                />
              </Stack>
            </LocalizationProvider>
          )}

          {/* Project Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Project</InputLabel>
            <Select
              value={filterValues.projectId}
              label="Project"
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={loading || projects.length === 0}
            >
              <MenuItem value="">
                <em>All Projects</em>
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                Active:
              </Typography>
              {filterValues.projectId && (
                <Chip
                  label={`Project: ${projects.find((p) => p.id === filterValues.projectId)?.name || filterValues.projectId}`}
                  size="small"
                  onDelete={() => handleProjectChange('')}
                  color="primary"
                  variant="outlined"
                />
              )}
              {filterValues.timePeriod !== 'all' && (
                <Chip
                  label={`Period: ${timePeriodOptions.find((o) => o.value === filterValues.timePeriod)?.label}`}
                  size="small"
                  onDelete={() => handleTimePeriodChange('all')}
                  color="primary"
                  variant="outlined"
                  icon={<DateRangeIcon />}
                />
              )}
            </Box>
          )}
        </Stack>
      </Collapse>
    </Paper>
  );
};

export default DashboardFilters;
