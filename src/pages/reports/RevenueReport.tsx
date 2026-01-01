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
import { reportService, type RevenueMetrics, type DateRange } from '../../services/reportService';
import { formatCurrency } from '../../utils';

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

const RevenueReport: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('this_year');
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dateRange = getDateRangeFromOption(dateRangeOption);
        const data = await reportService.getRevenueMetrics(dateRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        showError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRangeOption, showError]);

  const handleExport = () => {
    if (!metrics) return;

    const rows = [
      ['Revenue Report'],
      [''],
      ['Summary'],
      ['Total Revenue', formatCurrency(metrics.totalRevenue)],
      ['Paid Revenue', formatCurrency(metrics.paidRevenue)],
      ['Pending Revenue', formatCurrency(metrics.pendingRevenue)],
      ['Overdue Revenue', formatCurrency(metrics.overdueRevenue)],
      [''],
      ['Revenue by Month'],
      ['Month', 'Invoiced', 'Collected'],
      ...metrics.revenueByMonth.map(m => [m.month, formatCurrency(m.revenue), formatCurrency(m.paid)]),
      [''],
      ['Revenue by Project'],
      ['Project', 'Revenue'],
      ...metrics.revenueByProject.map(p => [p.projectName, formatCurrency(p.revenue)]),
      [''],
      ['Revenue by Client'],
      ['Client', 'Revenue'],
      ...metrics.revenueByClient.map(c => [c.clientName, formatCurrency(c.revenue)]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${dateRangeOption}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !metrics) return <LoadingSpinner />;

  const collectionRate = metrics.totalRevenue > 0
    ? Math.round((metrics.paidRevenue / metrics.totalRevenue) * 100)
    : 0;

  return (
    <Box>
      <PageHeader
        title="Revenue Report"
        subtitle="Detailed revenue analysis and breakdown"
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
                Total Revenue
              </Typography>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {formatCurrency(metrics.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Collected
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {formatCurrency(metrics.paidRevenue)}
              </Typography>
              <Chip
                size="small"
                label={`${collectionRate}% collected`}
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
                Pending
              </Typography>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {formatCurrency(metrics.pendingRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overdue
              </Typography>
              <Typography variant="h4" fontWeight={600} color="error.main">
                {formatCurrency(metrics.overdueRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue by Month */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Revenue by Month
          </Typography>
          {metrics.revenueByMonth.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Invoiced</TableCell>
                    <TableCell align="right">Collected</TableCell>
                    <TableCell align="right">Collection Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.revenueByMonth.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.paid)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={`${row.revenue > 0 ? Math.round((row.paid / row.revenue) * 100) : 0}%`}
                          sx={{
                            bgcolor: alpha(
                              row.revenue > 0 && row.paid / row.revenue >= 0.8
                                ? theme.palette.success.main
                                : theme.palette.warning.main,
                              0.15
                            ),
                            color: row.revenue > 0 && row.paid / row.revenue >= 0.8
                              ? theme.palette.success.main
                              : theme.palette.warning.main,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No revenue data for this period
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Project and Client */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue by Project
              </Typography>
              {metrics.revenueByProject.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.revenueByProject.slice(0, 10).map((row) => (
                        <TableRow key={row.projectId}>
                          <TableCell>{row.projectName}</TableCell>
                          <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                          <TableCell align="right">
                            {metrics.totalRevenue > 0
                              ? Math.round((row.revenue / metrics.totalRevenue) * 100)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No project revenue data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue by Client
              </Typography>
              {metrics.revenueByClient.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Client</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.revenueByClient.slice(0, 10).map((row) => (
                        <TableRow key={row.clientId}>
                          <TableCell>{row.clientName}</TableCell>
                          <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                          <TableCell align="right">
                            {metrics.totalRevenue > 0
                              ? Math.round((row.revenue / metrics.totalRevenue) * 100)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No client revenue data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RevenueReport;
