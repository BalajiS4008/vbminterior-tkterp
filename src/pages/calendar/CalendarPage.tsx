import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Assignment as TicketIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES } from '../../config/constants';
import { ticketService, projectService, timeEntryService } from '../../services';
import { formatDate } from '../../utils';
import type { Ticket, Project, TimeEntry } from '../../types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

import { TICKET_PRIORITY_COLORS } from '../../config/statusColors';

const PRIORITY_COLORS = TICKET_PRIORITY_COLORS;

interface CalendarEvent {
  id: string;
  type: 'ticket' | 'time_entry';
  title: string;
  date: Date;
  priority?: string;
  projectName?: string;
  duration?: number;
  status?: string;
}

interface DayDialogProps {
  open: boolean;
  date: Date | null;
  events: CalendarEvent[];
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
}

const DayDialog: React.FC<DayDialogProps> = ({ open, date, events, onClose, onEventClick }) => {
  if (!date) return null;

  const ticketEvents = events.filter(e => e.type === 'ticket');
  const timeEvents = events.filter(e => e.type === 'time_entry');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {formatDate(date)}
      </DialogTitle>
      <DialogContent>
        {events.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No events for this day
          </Typography>
        ) : (
          <>
            {ticketEvents.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Ticket Due Dates
                </Typography>
                <List dense>
                  {ticketEvents.map(event => (
                    <ListItem
                      key={event.id}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1 }}
                      onClick={() => onEventClick(event)}
                    >
                      <ListItemText
                        primary={event.title}
                        secondary={event.projectName}
                        primaryTypographyProps={{
                          sx: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }
                        }}
                      />
                      <Chip
                        size="small"
                        label={event.priority}
                        sx={{
                          backgroundColor: alpha(PRIORITY_COLORS[event.priority || 'medium'], 0.15),
                          color: PRIORITY_COLORS[event.priority || 'medium'],
                          textTransform: 'capitalize',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {ticketEvents.length > 0 && timeEvents.length > 0 && <Divider sx={{ my: 1 }} />}

            {timeEvents.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Time Entries
                </Typography>
                <List dense>
                  {timeEvents.map(event => (
                    <ListItem
                      key={event.id}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1 }}
                      onClick={() => onEventClick(event)}
                    >
                      <ListItemText
                        primary={event.title}
                        secondary={`${event.projectName} - ${Math.round((event.duration || 0) / 60 * 10) / 10}h`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showError } = useNotification();
  const { userData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [viewType, setViewType] = useState<'all' | 'tickets' | 'time'>('all');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get calendar data
  const { year, month, calendarDays } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const fdow = new Date(y, m, 1).getDay();

    // Create calendar grid
    const days: (Date | null)[] = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < fdow; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= dim; i++) {
      days.push(new Date(y, m, i));
    }

    // Add empty cells to complete the last week
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return {
      year: y,
      month: m,
      daysInMonth: dim,
      firstDayOfWeek: fdow,
      calendarDays: days,
    };
  }, [currentDate]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get date range for the month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const [ticketResult, projectResult] = await Promise.all([
          ticketService.getAll(undefined, { page: 1, limit: 1000 }),
          projectService.getAll(),
        ]);

        // Create project lookup map
        const projectMap = new Map(projectResult.projects.map(p => [p.id, p.name]));

        // Filter tickets with due dates in this month and apply project filter client-side
        const monthTickets = ticketResult.tickets
          .filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            const inMonth = due >= startDate && due <= endDate;
            const matchesProject = !projectFilter || t.projectId === projectFilter;
            return inMonth && matchesProject;
          })
          .map(t => ({
            ...t,
            projectName: t.projectName || projectMap.get(t.projectId) || 'Unknown Project',
          }));

        setTickets(monthTickets);
        setProjects(projectResult.projects);

        // Fetch time entries for the current user
        if (userData?.id) {
          const { entries } = await timeEntryService.getAll({
            userId: userData.id,
            dateRange: { start: startDate, end: endDate },
          });
          setTimeEntries(entries);
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        showError('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, projectFilter, userData?.id, showError]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const dateStr = date.toISOString().split('T')[0];

    // Add ticket due dates
    if (viewType === 'all' || viewType === 'tickets') {
      tickets.forEach(ticket => {
        if (!ticket.dueDate) return;
        const dueStr = new Date(ticket.dueDate).toISOString().split('T')[0];
        if (dueStr === dateStr) {
          events.push({
            id: ticket.id,
            type: 'ticket',
            title: ticket.title,
            date: new Date(ticket.dueDate),
            priority: ticket.priority,
            projectName: ticket.projectName,
            status: ticket.status,
          });
        }
      });
    }

    // Add time entries
    if (viewType === 'all' || viewType === 'time') {
      timeEntries.forEach(entry => {
        const entryStr = new Date(entry.date).toISOString().split('T')[0];
        if (entryStr === dateStr) {
          events.push({
            id: entry.id,
            type: 'time_entry',
            title: entry.description,
            date: new Date(entry.date),
            projectName: entry.projectName,
            duration: entry.duration,
          });
        }
      });
    }

    return events;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setDialogOpen(false);
    if (event.type === 'ticket') {
      navigate(`${ROUTES.TICKETS}/${event.id}`);
    } else {
      navigate(`/timesheet/entry/${event.id}/edit`);
    }
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader
        title="Calendar"
        subtitle={`${MONTHS[month]} ${year}`}
      />

      {/* Calendar Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={handlePrevMonth}>
                  <PrevIcon />
                </IconButton>
                <Typography variant="h6" sx={{ minWidth: 180, textAlign: 'center' }}>
                  {MONTHS[month]} {year}
                </Typography>
                <IconButton onClick={handleNextMonth}>
                  <NextIcon />
                </IconButton>
                <Button size="small" onClick={handleToday}>
                  Today
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
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
            <Grid size={{ xs: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>View</InputLabel>
                <Select
                  value={viewType}
                  label="View"
                  onChange={(e) => setViewType(e.target.value as typeof viewType)}
                >
                  <MenuItem value="all">All Events</MenuItem>
                  <MenuItem value="tickets">Ticket Due Dates</MenuItem>
                  <MenuItem value="time">Time Entries</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent>
          {/* Days Header */}
          <Box sx={{ display: 'flex' }}>
            {DAYS_OF_WEEK.map((day) => (
              <Box
                key={day}
                sx={{
                  flex: 1,
                  py: 1,
                  textAlign: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar Days */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {calendarDays.map((date, index) => {
              const events = date ? getEventsForDate(date) : [];
              const ticketCount = events.filter(e => e.type === 'ticket').length;
              const timeCount = events.filter(e => e.type === 'time_entry').length;
              const totalTimeMinutes = events
                .filter(e => e.type === 'time_entry')
                .reduce((sum, e) => sum + (e.duration || 0), 0);

              return (
                <Box key={index} sx={{ width: 'calc(100% / 7)' }}>
                  <Paper
                    elevation={0}
                    onClick={() => date && handleDayClick(date)}
                    sx={{
                      minHeight: 100,
                      p: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      borderTop: 'none',
                      borderLeft: index % 7 === 0 ? `1px solid ${theme.palette.divider}` : 'none',
                      cursor: date ? 'pointer' : 'default',
                      bgcolor: date
                        ? isToday(date)
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'background.paper'
                        : 'action.hover',
                      '&:hover': date ? {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      } : {},
                    }}
                  >
                    {date && (
                      <>
                        <Typography
                          variant="body2"
                          fontWeight={isToday(date) ? 700 : 400}
                          color={isToday(date) ? 'primary' : 'text.primary'}
                          sx={{
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            bgcolor: isToday(date) ? 'primary.main' : 'transparent',
                            color: isToday(date) ? 'white' : 'text.primary',
                          }}
                        >
                          {date.getDate()}
                        </Typography>

                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                          {ticketCount > 0 && (
                            <Chip
                              size="small"
                              icon={<TicketIcon sx={{ fontSize: 14 }} />}
                              label={`${ticketCount} ticket${ticketCount > 1 ? 's' : ''}`}
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: alpha(theme.palette.warning.main, 0.15),
                                '& .MuiChip-icon': { ml: 0.5 },
                              }}
                            />
                          )}
                          {timeCount > 0 && (
                            <Chip
                              size="small"
                              icon={<TimeIcon sx={{ fontSize: 14 }} />}
                              label={`${Math.round(totalTimeMinutes / 60 * 10) / 10}h`}
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: alpha(theme.palette.success.main, 0.15),
                                '& .MuiChip-icon': { ml: 0.5 },
                              }}
                            />
                          )}
                        </Stack>
                      </>
                    )}
                  </Paper>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <DayDialog
        open={dialogOpen}
        date={selectedDate}
        events={selectedDateEvents}
        onClose={() => setDialogOpen(false)}
        onEventClick={handleEventClick}
      />
    </Box>
  );
};

export default CalendarPage;
