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
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useNotification } from '../../contexts';
import { reportService, type ProfitabilityMetrics, type DateRange } from '../../services/reportService';
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

const ProfitabilityReport: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('this_year');
  const [metrics, setMetrics] = useState<ProfitabilityMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dateRange = getDateRangeFromOption(dateRangeOption);
        const data = await reportService.getProfitabilityMetrics(dateRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching profitability data:', error);
        showError('Failed to load profitability data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRangeOption, showError]);

  const handleExport = () => {
    if (!metrics) return;

    const rows = [
      ['Profitability Report'],
      [''],
      ['Summary'],
      ['Total Revenue', formatCurrency(metrics.totalRevenue)],
      ['Total Expenses', formatCurrency(metrics.totalExpenses)],
      ['Gross Profit', formatCurrency(metrics.grossProfit)],
      ['Profit Margin', `${metrics.profitMargin}%`],
      [''],
      ['Profit by Month'],
      ['Month', 'Revenue', 'Expenses', 'Profit', 'Margin'],
      ...metrics.profitByMonth.map(m => [
        m.month,
        formatCurrency(m.revenue),
        formatCurrency(m.expenses),
        formatCurrency(m.profit),
        `${m.revenue > 0 ? Math.round((m.profit / m.revenue) * 100) : 0}%`
      ]),
      [''],
      ['Profit by Project'],
      ['Project', 'Revenue', 'Expenses', 'Profit', 'Margin'],
      ...metrics.profitByProject.map(p => [
        p.projectName,
        formatCurrency(p.revenue),
        formatCurrency(p.expenses),
        formatCurrency(p.profit),
        `${p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0}%`
      ]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profitability-report-${dateRangeOption}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !metrics) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader
        title="Profitability Report"
        subtitle="Profit analysis and margin breakdown"
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
                Total Expenses
              </Typography>
              <Typography variant="h4" fontWeight={600} color="error.main">
                {formatCurrency(metrics.totalExpenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gross Profit
              </Typography>
              <Typography
                variant="h4"
                fontWeight={600}
                color={metrics.grossProfit >= 0 ? 'primary.main' : 'error.main'}
              >
                {formatCurrency(metrics.grossProfit)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {metrics.grossProfit >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={metrics.grossProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  {metrics.grossProfit >= 0 ? 'Profitable' : 'Loss'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Profit Margin
              </Typography>
              <Typography
                variant="h4"
                fontWeight={600}
                color={metrics.profitMargin >= 0 ? 'primary.main' : 'error.main'}
              >
                {metrics.profitMargin}%
              </Typography>
              <Chip
                size="small"
                label={
                  metrics.profitMargin >= 20
                    ? 'Healthy'
                    : metrics.profitMargin >= 10
                    ? 'Moderate'
                    : metrics.profitMargin >= 0
                    ? 'Low'
                    : 'Negative'
                }
                sx={{
                  mt: 1,
                  bgcolor: alpha(
                    metrics.profitMargin >= 20
                      ? theme.palette.success.main
                      : metrics.profitMargin >= 10
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
                    0.15
                  ),
                  color:
                    metrics.profitMargin >= 20
                      ? theme.palette.success.main
                      : metrics.profitMargin >= 10
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Profit by Month */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Profit by Month
          </Typography>
          {metrics.profitByMonth.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Expenses</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.profitByMonth.map((row) => {
                    const margin = row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;
                    return (
                      <TableRow key={row.month}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {formatCurrency(row.revenue)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>
                          {formatCurrency(row.expenses)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: row.profit >= 0 ? 'primary.main' : 'error.main', fontWeight: 600 }}
                        >
                          {formatCurrency(row.profit)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={`${margin}%`}
                            sx={{
                              bgcolor: alpha(
                                margin >= 20
                                  ? theme.palette.success.main
                                  : margin >= 10
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                                0.15
                              ),
                              color:
                                margin >= 20
                                  ? theme.palette.success.main
                                  : margin >= 10
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
              No profitability data for this period
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Profit by Project */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Profit by Project
          </Typography>
          {metrics.profitByProject.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Project</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Expenses</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.profitByProject.map((row) => {
                    const margin = row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;
                    return (
                      <TableRow key={row.projectId}>
                        <TableCell>{row.projectName}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {formatCurrency(row.revenue)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>
                          {formatCurrency(row.expenses)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: row.profit >= 0 ? 'primary.main' : 'error.main', fontWeight: 600 }}
                        >
                          {formatCurrency(row.profit)}
                        </TableCell>
                        <TableCell align="right">{margin}%</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={
                              margin >= 20
                                ? 'Profitable'
                                : margin >= 0
                                ? 'Break-even'
                                : 'Loss'
                            }
                            sx={{
                              bgcolor: alpha(
                                margin >= 20
                                  ? theme.palette.success.main
                                  : margin >= 0
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                                0.15
                              ),
                              color:
                                margin >= 20
                                  ? theme.palette.success.main
                                  : margin >= 0
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
              No project profitability data
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfitabilityReport;
