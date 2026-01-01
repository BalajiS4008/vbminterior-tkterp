import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useNotification } from '../../contexts';
import { reportService, type TicketMetrics, type DateRange } from '../../services/reportService';

type DateRangeOption = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year';

const getDateRangeFromOption = (option: DateRangeOption): DateRange => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarter = Math.floor(month / 3);

  switch (option) {
    case 'this_month':
      return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) };
    case 'last_month':
      return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0) };
    case 'this_quarter':
      return { start: new Date(year, quarter * 3, 1), end: new Date(year, (quarter + 1) * 3, 0) };
    case 'last_quarter':
      return { start: new Date(year, (quarter - 1) * 3, 1), end: new Date(year, quarter * 3, 0) };
    case 'this_year':
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
    case 'last_year':
      return { start: new Date(year - 1, 0, 1), end: new Date(year - 1, 11, 31) };
    default:
      return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) };
  }
};

const STATUS_COLORS: Record<string, string> = {
  open: '#FF9800',
  in_progress: '#2196F3',
  pending: '#9C27B0',
  resolved: '#4CAF50',
  closed: '#9E9E9E',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336',
  critical: '#9C27B0',
};

const TicketReport: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('this_year');
  const [metrics, setMetrics] = useState<TicketMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dateRange = getDateRangeFromOption(dateRangeOption);
        const data = await reportService.getTicketMetrics(dateRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching ticket data:', error);
        showError('Failed to load ticket data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRangeOption, showError]);

  const handleExport = () => {
    if (!metrics) return;

    const rows = [
      ['Ticket Report'],
      [''],
      ['Summary'],
      ['Total Tickets', metrics.totalTickets.toString()],
      ['Open Tickets', metrics.openTickets.toString()],
      ['Closed Tickets', metrics.closedTickets.toString()],
      ['Avg Resolution Time', `${metrics.avgResolutionTime} days`],
      [''],
      ['Tickets by Status'],
      ['Status', 'Count'],
      ...metrics.ticketsByStatus.map(s => [s.status, s.count.toString()]),
      [''],
      ['Tickets by Priority'],
      ['Priority', 'Count'],
      ...metrics.ticketsByPriority.map(p => [p.priority, p.count.toString()]),
      [''],
      ['Tickets by Month'],
      ['Month', 'Created', 'Resolved'],
      ...metrics.ticketsByMonth.map(m => [m.month, m.created.toString(), m.resolved.toString()]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-report-${dateRangeOption}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !metrics) return <LoadingSpinner />;

  const resolutionRate = metrics.totalTickets > 0
    ? Math.round((metrics.closedTickets / metrics.totalTickets) * 100)
    : 0;

  return (
    <Box>
      <PageHeader
        title="Ticket Report"
        subtitle="Ticket resolution and status analysis"
        action={
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRangeOption}
                label="Date Range"
                onChange={(e) => setDateRangeOption(e.target.value as DateRangeOption)}
              >
                <MenuItem value="this_month">This Month</MenuItem>
                <MenuItem value="last_month">Last Month</MenuItem>
                <MenuItem value="this_quarter">This Quarter</MenuItem>
                <MenuItem value="last_quarter">Last Quarter</MenuItem>
                <MenuItem value="this_year">This Year</MenuItem>
                <MenuItem value="last_year">Last Year</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/reports')}
            >
              Back
            </Button>
          </Stack>
        }
      />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Tickets
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {metrics.totalTickets}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Open Tickets
              </Typography>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {metrics.openTickets}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Closed Tickets
              </Typography>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {metrics.closedTickets}
              </Typography>
              <Chip
                size="small"
                label={`${resolutionRate}% resolved`}
                sx={{
                  mt: 1,
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main,
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avg Resolution Time
              </Typography>
              <Typography
                variant="h4"
                fontWeight={600}
                color={
                  metrics.avgResolutionTime <= 3
                    ? 'success.main'
                    : metrics.avgResolutionTime <= 7
                    ? 'warning.main'
                    : 'error.main'
                }
              >
                {metrics.avgResolutionTime} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tickets by Status and Priority */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tickets by Status
              </Typography>
              {metrics.ticketsByStatus.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.ticketsByStatus.map((row) => (
                        <TableRow key={row.status}>
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.status.replace('_', ' ')}
                              sx={{
                                textTransform: 'capitalize',
                                bgcolor: alpha(STATUS_COLORS[row.status] || theme.palette.grey[500], 0.15),
                                color: STATUS_COLORS[row.status] || theme.palette.grey[700],
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">{row.count}</TableCell>
                          <TableCell align="right">
                            {metrics.totalTickets > 0
                              ? Math.round((row.count / metrics.totalTickets) * 100)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No status data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tickets by Priority
              </Typography>
              {metrics.ticketsByPriority.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Priority</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.ticketsByPriority.map((row) => (
                        <TableRow key={row.priority}>
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.priority}
                              sx={{
                                textTransform: 'capitalize',
                                bgcolor: alpha(PRIORITY_COLORS[row.priority] || theme.palette.grey[500], 0.15),
                                color: PRIORITY_COLORS[row.priority] || theme.palette.grey[700],
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">{row.count}</TableCell>
                          <TableCell align="right">
                            {metrics.totalTickets > 0
                              ? Math.round((row.count / metrics.totalTickets) * 100)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No priority data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tickets by Month */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tickets by Month
          </Typography>
          {metrics.ticketsByMonth.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Created</TableCell>
                    <TableCell align="right">Resolved</TableCell>
                    <TableCell align="right">Net Change</TableCell>
                    <TableCell align="right">Resolution Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.ticketsByMonth.map((row) => {
                    const netChange = row.resolved - row.created;
                    const resRate = row.created > 0
                      ? Math.round((row.resolved / row.created) * 100)
                      : row.resolved > 0 ? 100 : 0;
                    return (
                      <TableRow key={row.month}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell align="right">{row.created}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {row.resolved}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: netChange >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {netChange >= 0 ? '+' : ''}{netChange}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={`${resRate}%`}
                            sx={{
                              bgcolor: alpha(
                                resRate >= 100
                                  ? theme.palette.success.main
                                  : resRate >= 75
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                                0.15
                              ),
                              color:
                                resRate >= 100
                                  ? theme.palette.success.main
                                  : resRate >= 75
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No monthly ticket data
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TicketReport;
