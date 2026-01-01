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
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useNotification } from '../../contexts';
import { reportService, type ExpenseMetrics, type DateRange } from '../../services/reportService';
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

const CATEGORY_COLORS: Record<string, string> = {
  'Office Supplies': '#2196F3',
  'Travel': '#4CAF50',
  'Software': '#9C27B0',
  'Hardware': '#FF9800',
  'Marketing': '#E91E63',
  'Professional Services': '#00BCD4',
  'Utilities': '#795548',
  'Other': '#9E9E9E',
};

const ExpenseReport: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('this_year');
  const [metrics, setMetrics] = useState<ExpenseMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dateRange = getDateRangeFromOption(dateRangeOption);
        const data = await reportService.getExpenseMetrics(dateRange);
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching expense data:', error);
        showError('Failed to load expense data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRangeOption, showError]);

  const handleExport = () => {
    if (!metrics) return;

    const rows = [
      ['Expense Report'],
      [''],
      ['Summary'],
      ['Total Expenses', formatCurrency(metrics.totalExpenses)],
      ['Approved Expenses', formatCurrency(metrics.approvedExpenses)],
      ['Pending Expenses', formatCurrency(metrics.pendingExpenses)],
      [''],
      ['Expenses by Category'],
      ['Category', 'Amount', '% of Total'],
      ...metrics.expensesByCategory.map(c => [
        c.category,
        formatCurrency(c.amount),
        `${metrics.totalExpenses > 0 ? Math.round((c.amount / metrics.totalExpenses) * 100) : 0}%`
      ]),
      [''],
      ['Expenses by Month'],
      ['Month', 'Amount'],
      ...metrics.expensesByMonth.map(m => [m.month, formatCurrency(m.amount)]),
      [''],
      ['Expenses by Project'],
      ['Project', 'Amount'],
      ...metrics.expensesByProject.map(p => [p.projectName, formatCurrency(p.amount)]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${dateRangeOption}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !metrics) return <LoadingSpinner />;

  const approvalRate = metrics.totalExpenses > 0
    ? Math.round((metrics.approvedExpenses / metrics.totalExpenses) * 100)
    : 0;

  return (
    <Box>
      <PageHeader
        title="Expense Report"
        subtitle="Detailed expense analysis and breakdown"
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {formatCurrency(metrics.approvedExpenses)}
              </Typography>
              <Chip
                size="small"
                label={`${approvalRate}% approved`}
                sx={{
                  mt: 1,
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main,
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pending Approval
              </Typography>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {formatCurrency(metrics.pendingExpenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Expenses by Category */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expenses by Category
          </Typography>
          {metrics.expensesByCategory.length > 0 ? (
            <Box>
              {metrics.expensesByCategory.map((category) => {
                const percentage = metrics.totalExpenses > 0
                  ? (category.amount / metrics.totalExpenses) * 100
                  : 0;
                const color = CATEGORY_COLORS[category.category] || theme.palette.grey[500];

                return (
                  <Box key={category.category} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {category.category}
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(category.amount)} ({Math.round(percentage)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: alpha(color, 0.15),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: color,
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No expense data for this period
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Expenses by Month and Project */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expenses by Month
              </Typography>
              {metrics.expensesByMonth.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.expensesByMonth.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell>{row.month}</TableCell>
                          <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                          <TableCell align="right">
                            {metrics.totalExpenses > 0
                              ? Math.round((row.amount / metrics.totalExpenses) * 100)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No monthly expense data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expenses by Project
              </Typography>
              {metrics.expensesByProject.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.expensesByProject.slice(0, 10).map((row) => (
                        <TableRow key={row.projectId}>
                          <TableCell>{row.projectName}</TableCell>
                          <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                          <TableCell align="right">
                            {metrics.totalExpenses > 0
                              ? Math.round((row.amount / metrics.totalExpenses) * 100)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No project expense data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExpenseReport;
