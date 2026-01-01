import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Stack,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Send as SubmitIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner, EmptyState, ConfirmDialog } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES } from '../../config/constants';
import { timeEntryService, formatDuration, projectService } from '../../services';
import { formatDate } from '../../utils';
import type { TimeEntry, TimesheetSummary, Project } from '../../types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS: Record<string, string> = {
  draft: '#9E9E9E',
  submitted: '#2196F3',
  approved: '#4CAF50',
  rejected: '#F44336',
};

// Helper to get the start of the week (Sunday)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper to format a date for display
const formatDayDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const TimesheetPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [timesheet, setTimesheet] = useState<TimesheetSummary | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Get week dates
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentWeekStart]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.id) return;

      try {
        setLoading(true);
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const [timesheetData, projectResult] = await Promise.all([
          timeEntryService.getTimesheetSummary(userData.id, currentWeekStart),
          projectService.getAll(),
        ]);

        setTimesheet(timesheetData);
        setProjects(projectResult.projects);
      } catch (error) {
        console.error('Error fetching timesheet:', error);
        showError('Failed to load timesheet data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.id, currentWeekStart, showError]);

  // Get filtered entries
  const filteredEntries = useMemo(() => {
    if (!timesheet) return {};

    if (!projectFilter) return timesheet.entriesByDate;

    const filtered: Record<string, TimeEntry[]> = {};
    Object.entries(timesheet.entriesByDate).forEach(([date, entries]) => {
      const projectEntries = entries.filter((e) => e.projectId === projectFilter);
      if (projectEntries.length > 0) {
        filtered[date] = projectEntries;
      }
    });
    return filtered;
  }, [timesheet, projectFilter]);

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    weekDates.forEach((date) => {
      const dateKey = date.toISOString().split('T')[0];
      const entries = filteredEntries[dateKey] || [];
      totals[dateKey] = entries.reduce((sum, e) => sum + e.duration, 0);
    });
    return totals;
  }, [weekDates, filteredEntries]);

  // Calculate week total
  const weekTotal = useMemo(() => {
    return Object.values(dailyTotals).reduce((sum, d) => sum + d, 0);
  }, [dailyTotals]);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleThisWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleAddEntry = (date?: Date) => {
    const params = new URLSearchParams();
    if (date) {
      params.set('date', date.toISOString().split('T')[0]);
    }
    navigate(`${ROUTES.TIMESHEET_CREATE}?${params.toString()}`);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    navigate(`/timesheet/entry/${entry.id}/edit`);
  };

  const handleDeleteClick = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEntry) return;

    try {
      await timeEntryService.delete(selectedEntry.id);
      // Refresh timesheet
      if (userData?.id) {
        const updated = await timeEntryService.getTimesheetSummary(userData.id, currentWeekStart);
        setTimesheet(updated);
      }
      showSuccess('Time entry deleted');
    } catch (error) {
      showError('Failed to delete time entry');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
    }
  };

  const handleSubmitWeek = async () => {
    if (!timesheet) return;

    try {
      const allEntries = Object.values(timesheet.entriesByDate).flat();
      const draftEntries = allEntries.filter((e) => e.status === 'draft');

      if (draftEntries.length === 0) {
        showError('No draft entries to submit');
        return;
      }

      await timeEntryService.submitForApproval(draftEntries.map((e) => e.id));

      // Refresh timesheet
      if (userData?.id) {
        const updated = await timeEntryService.getTimesheetSummary(userData.id, currentWeekStart);
        setTimesheet(updated);
      }
      showSuccess('Timesheet submitted for approval');
    } catch (error) {
      showError('Failed to submit timesheet');
    } finally {
      setSubmitDialogOpen(false);
    }
  };

  const isCurrentWeek = useMemo(() => {
    const thisWeekStart = getWeekStart(new Date());
    return currentWeekStart.getTime() === thisWeekStart.getTime();
  }, [currentWeekStart]);

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader
        title="Timesheet"
        subtitle={`Week of ${formatDate(currentWeekStart)}`}
        actionLabel="Add Entry"
        actionIcon={<AddIcon />}
        onAction={() => handleAddEntry()}
      />

      {/* Week Navigation & Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={handlePrevWeek}>
                  <PrevIcon />
                </IconButton>
                <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                  {formatDayDate(weekDates[0])} - {formatDayDate(weekDates[6])}
                </Typography>
                <IconButton onClick={handleNextWeek}>
                  <NextIcon />
                </IconButton>
                {!isCurrentWeek && (
                  <Button size="small" onClick={handleThisWeek}>
                    Today
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Project</InputLabel>
                <Select
                  value={projectFilter}
                  label="Project"
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                {timesheet && timesheet.status === 'draft' && (
                  <Button
                    variant="contained"
                    startIcon={<SubmitIcon />}
                    onClick={() => setSubmitDialogOpen(true)}
                  >
                    Submit Week
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="overline" color="text.secondary">
              Total Hours
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {formatDuration(weekTotal)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="overline" color="text.secondary">
              Billable
            </Typography>
            <Typography variant="h4" fontWeight={600} color="success.main">
              {timesheet ? `${timesheet.billableHours}h` : '0h'}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="overline" color="text.secondary">
              Non-Billable
            </Typography>
            <Typography variant="h4" fontWeight={600} color="text.secondary">
              {timesheet ? `${timesheet.nonBillableHours}h` : '0h'}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="overline" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={timesheet?.status || 'draft'}
              sx={{
                mt: 1,
                backgroundColor: alpha(STATUS_COLORS[timesheet?.status || 'draft'], 0.15),
                color: STATUS_COLORS[timesheet?.status || 'draft'],
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Timesheet Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project / Task</TableCell>
                {weekDates.map((date) => (
                  <TableCell key={date.toISOString()} align="center" sx={{ minWidth: 100 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {DAYS_OF_WEEK[date.getDay()]}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {date.getDate()}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
                <TableCell align="center">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Group entries by project */}
              {projects
                .filter((p) => !projectFilter || p.id === projectFilter)
                .map((project) => {
                  // Check if project has any entries this week
                  const projectHasEntries = Object.values(filteredEntries).some((entries) =>
                    entries.some((e) => e.projectId === project.id)
                  );

                  if (!projectHasEntries) return null;

                  const projectTotal = weekDates.reduce((sum, date) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const entries = filteredEntries[dateKey] || [];
                    return sum + entries.filter((e) => e.projectId === project.id).reduce((s, e) => s + e.duration, 0);
                  }, 0);

                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {project.name}
                        </Typography>
                      </TableCell>
                      {weekDates.map((date) => {
                        const dateKey = date.toISOString().split('T')[0];
                        const entries = (filteredEntries[dateKey] || []).filter(
                          (e) => e.projectId === project.id
                        );

                        return (
                          <TableCell key={dateKey} align="center">
                            {entries.length > 0 ? (
                              <Stack spacing={0.5}>
                                {entries.map((entry) => (
                                  <Tooltip
                                    key={entry.id}
                                    title={
                                      <Box>
                                        <Typography variant="body2">{entry.description}</Typography>
                                        <Typography variant="caption">
                                          {entry.startTime} - {entry.endTime}
                                        </Typography>
                                      </Box>
                                    }
                                  >
                                    <Chip
                                      size="small"
                                      label={formatDuration(entry.duration)}
                                      onClick={() => handleEditEntry(entry)}
                                      onDelete={
                                        entry.status === 'draft'
                                          ? () => handleDeleteClick(entry)
                                          : undefined
                                      }
                                      sx={{
                                        backgroundColor: entry.billable
                                          ? alpha(theme.palette.success.main, 0.15)
                                          : alpha(theme.palette.grey[500], 0.15),
                                        cursor: 'pointer',
                                      }}
                                    />
                                  </Tooltip>
                                ))}
                              </Stack>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={() => handleAddEntry(date)}
                                sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          {formatDuration(projectTotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {/* Daily Totals Row */}
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    Daily Total
                  </Typography>
                </TableCell>
                {weekDates.map((date) => {
                  const dateKey = date.toISOString().split('T')[0];
                  return (
                    <TableCell key={dateKey} align="center">
                      <Typography variant="body2" fontWeight={600}>
                        {formatDuration(dailyTotals[dateKey] || 0)}
                      </Typography>
                    </TableCell>
                  );
                })}
                <TableCell align="center">
                  <Typography variant="h6" fontWeight={600} color="primary">
                    {formatDuration(weekTotal)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {Object.keys(filteredEntries).length === 0 && (
          <Box sx={{ p: 4 }}>
            <EmptyState
              icon={TimeIcon}
              title="No Time Entries"
              description="Start tracking your time by adding your first entry"
              actionLabel="Add Entry"
              onAction={() => handleAddEntry()}
            />
          </Box>
        )}
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedEntry(null);
        }}
        confirmColor="error"
      />

      {/* Submit Confirmation */}
      <ConfirmDialog
        open={submitDialogOpen}
        title="Submit Timesheet"
        message="Are you sure you want to submit this week's timesheet for approval? You won't be able to edit submitted entries."
        confirmLabel="Submit"
        onConfirm={handleSubmitWeek}
        onCancel={() => setSubmitDialogOpen(false)}
        confirmColor="primary"
      />
    </Box>
  );
};

export default TimesheetPage;
