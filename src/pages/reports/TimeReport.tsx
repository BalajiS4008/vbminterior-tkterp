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
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useNotification } from '../../contexts';
import { reportService, type TimeMetrics, type DateRange } from '../../services/reportService';

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

const TimeReport: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('this_year');
  const [metrics, setMetrics] = useState<TimeMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dateRange = getDateRangeFromOption(dateRangeOption);
        const data = await reportService.getTimeMetrics(dateRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching time data:', error);
        showError('Failed to load time data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRangeOption, showError]);

  const handleExport = () => {
    if (!metrics) return;

    const rows = [
      ['Time Report'],
      [''],
      ['Summary'],
      ['Total Hours', `${metrics.totalHours}h`],
      ['Billable Hours', `${metrics.billableHours}h`],
      ['Non-Billable Hours', `${metrics.nonBillableHours}h`],
      ['Utilization Rate', `${metrics.utilizationRate}%`],
      [''],
      ['Hours by Project'],
      ['Project', 'Total Hours', 'Billable Hours', 'Utilization'],
      ...metrics.hoursByProject.map(p => [
        p.projectName,
        `${p.hours}h`,
        `${p.billableHours}h`,
        `${p.hours > 0 ? Math.round((p.billableHours / p.hours) * 100) : 0}%`
      ]),
      [''],
      ['Hours by User'],
      ['User', 'Total Hours', 'Billable Hours', 'Utilization'],
      ...metrics.hoursByUser.map(u => [
        u.userName,
        `${u.hours}h`,
        `${u.billableHours}h`,
        `${u.hours > 0 ? Math.round((u.billableHours / u.hours) * 100) : 0}%`
      ]),
      [''],
      ['Hours by Month'],
      ['Month', 'Total Hours', 'Billable Hours'],
      ...metrics.hoursByMonth.map(m => [m.month, `${m.hours}h`, `${m.billableHours}h`]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-report-${dateRangeOption}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !metrics) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader
        title="Time Report"
        subtitle="Time tracking and utilization analysis"
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
                Total Hours
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {metrics.totalHours}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Billable Hours
              </Typography>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {metrics.billableHours}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Non-Billable Hours
              </Typography>
              <Typography variant="h4" fontWeight={600} color="text.secondary">
                {metrics.nonBillableHours}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Utilization Rate
              </Typography>
              <Typography
                variant="h4"
                fontWeight={600}
                color={
                  metrics.utilizationRate >= 80
                    ? 'success.main'
                    : metrics.utilizationRate >= 60
                    ? 'warning.main'
                    : 'error.main'
                }
              >
                {metrics.utilizationRate}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.utilizationRate}
                sx={{
                  mt: 1,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  '& .MuiLinearProgress-bar': {
                    bgcolor:
                      metrics.utilizationRate >= 80
                        ? theme.palette.success.main
                        : metrics.utilizationRate >= 60
                        ? theme.palette.warning.main
                        : theme.palette.error.main,
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hours by Project and User */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hours by Project
              </Typography>
              {metrics.hoursByProject.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Billable</TableCell>
                        <TableCell align="right">Utilization</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.hoursByProject.slice(0, 10).map((row) => {
                        const utilization = row.hours > 0
                          ? Math.round((row.billableHours / row.hours) * 100)
                          : 0;
                        return (
                          <TableRow key={row.projectId}>
                            <TableCell>{row.projectName}</TableCell>
                            <TableCell align="right">{row.hours}h</TableCell>
                            <TableCell align="right">{row.billableHours}h</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <Box sx={{ width: 60, mr: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={utilization}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: alpha(theme.palette.info.main, 0.15),
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: theme.palette.info.main,
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2">{utilization}%</Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No project time data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hours by User
              </Typography>
              {metrics.hoursByUser.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Billable</TableCell>
                        <TableCell align="right">Utilization</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.hoursByUser.slice(0, 10).map((row) => {
                        const utilization = row.hours > 0
                          ? Math.round((row.billableHours / row.hours) * 100)
                          : 0;
                        return (
                          <TableRow key={row.userId}>
                            <TableCell>{row.userName}</TableCell>
                            <TableCell align="right">{row.hours}h</TableCell>
                            <TableCell align="right">{row.billableHours}h</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <Box sx={{ width: 60, mr: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={utilization}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: alpha(theme.palette.info.main, 0.15),
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: theme.palette.info.main,
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2">{utilization}%</Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No user time data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hours by Month */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Hours by Month
          </Typography>
          {metrics.hoursByMonth.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Total Hours</TableCell>
                    <TableCell align="right">Billable Hours</TableCell>
                    <TableCell align="right">Non-Billable</TableCell>
                    <TableCell align="right">Utilization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.hoursByMonth.map((row) => {
                    const nonBillable = row.hours - row.billableHours;
                    const utilization = row.hours > 0
                      ? Math.round((row.billableHours / row.hours) * 100)
                      : 0;
                    return (
                      <TableRow key={row.month}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell align="right">{row.hours}h</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {row.billableHours}h
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>
                          {nonBillable}h
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Box sx={{ width: 80, mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={utilization}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: alpha(theme.palette.info.main, 0.15),
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: theme.palette.info.main,
                                  },
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ minWidth: 40 }}>
                              {utilization}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No monthly time data
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimeReport;
