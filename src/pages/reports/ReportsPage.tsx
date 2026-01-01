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
  Paper,
  useTheme,
  alpha,
  Stack,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as RevenueIcon,
  Receipt as ExpenseIcon,
  AccountBalance as ProfitIcon,
  AccessTime as TimeIcon,
  Assignment as TicketIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useNotification } from '../../contexts';
import { reportService, type DashboardSummary, type DateRange } from '../../services/reportService';
import { formatCurrency } from '../../utils';

type DateRangeOption = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year';

const getDateRangeFromOption = (option: DateRangeOption): DateRange => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarter = Math.floor(month / 3);

  switch (option) {
    case 'this_month':
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0),
      };
    case 'last_month':
      return {
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 0),
      };
    case 'this_quarter':
      return {
        start: new Date(year, quarter * 3, 1),
        end: new Date(year, (quarter + 1) * 3, 0),
      };
    case 'last_quarter':
      return {
        start: new Date(year, (quarter - 1) * 3, 1),
        end: new Date(year, quarter * 3, 0),
      };
    case 'this_year':
      return {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31),
      };
    case 'last_year':
      return {
        start: new Date(year - 1, 0, 1),
        end: new Date(year - 1, 11, 31),
      };
    default:
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0),
      };
  }
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, trend, icon, color, onClick }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{ color: trend >= 0 ? 'success.main' : 'error.main' }}
                >
                  {Math.abs(trend)}% vs previous period
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(color, 0.15),
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

interface ReportLinkCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const ReportLinkCard: React.FC<ReportLinkCardProps> = ({ title, description, icon, color, onClick }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(color, 0.15),
          color: color,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Paper>
  );
};

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('this_month');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dateRange = getDateRangeFromOption(dateRangeOption);
        const data = await reportService.getDashboardSummary(dateRange);
        setSummary(data);
      } catch (error) {
        console.error('Error fetching report data:', error);
        showError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRangeOption, showError]);

  if (loading || !summary) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Financial and operational insights"
        action={
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
        }
      />

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(summary.revenue.total)}
            subtitle={`${formatCurrency(summary.revenue.paid)} collected`}
            trend={summary.revenue.trend}
            icon={<RevenueIcon />}
            color={theme.palette.success.main}
            onClick={() => navigate('/reports/revenue')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Expenses"
            value={formatCurrency(summary.expenses.total)}
            subtitle={`${formatCurrency(summary.expenses.pending)} pending`}
            trend={summary.expenses.trend}
            icon={<ExpenseIcon />}
            color={theme.palette.error.main}
            onClick={() => navigate('/reports/expenses')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Gross Profit"
            value={formatCurrency(summary.profit.gross)}
            subtitle={`${summary.profit.margin}% margin`}
            trend={summary.profit.trend}
            icon={<ProfitIcon />}
            color={theme.palette.primary.main}
            onClick={() => navigate('/reports/profitability')}
          />
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Time Tracked
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {summary.time.totalHours}h
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.info.main, 0.15),
                    color: theme.palette.info.main,
                  }}
                >
                  <TimeIcon />
                </Box>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Utilization
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {summary.time.utilizationRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={summary.time.utilizationRate}
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
              <Typography variant="body2" color="text.secondary">
                {summary.time.billableHours}h billable / {summary.time.totalHours - summary.time.billableHours}h non-billable
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tickets
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {summary.tickets.open + summary.tickets.closed}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.warning.main, 0.15),
                    color: theme.palette.warning.main,
                  }}
                >
                  <TicketIcon />
                </Box>
              </Box>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Chip
                  size="small"
                  label={`${summary.tickets.open} Open`}
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.15),
                    color: theme.palette.warning.main,
                  }}
                />
                <Chip
                  size="small"
                  label={`${summary.tickets.closed} Closed`}
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    color: theme.palette.success.main,
                  }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Avg resolution: {summary.tickets.avgResolution} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Revenue Collection
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {summary.revenue.total > 0
                      ? Math.round((summary.revenue.paid / summary.revenue.total) * 100)
                      : 0}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    color: theme.palette.success.main,
                  }}
                >
                  <RevenueIcon />
                </Box>
              </Box>
              <Box sx={{ mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={summary.revenue.total > 0 ? (summary.revenue.paid / summary.revenue.total) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.success.main,
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(summary.revenue.pending)} pending collection
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Available Reports */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Detailed Reports
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ReportLinkCard
            title="Revenue Report"
            description="Revenue breakdown by client, project, and time period"
            icon={<RevenueIcon />}
            color={theme.palette.success.main}
            onClick={() => navigate('/reports/revenue')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ReportLinkCard
            title="Expense Report"
            description="Expense analysis by category and project"
            icon={<ExpenseIcon />}
            color={theme.palette.error.main}
            onClick={() => navigate('/reports/expenses')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ReportLinkCard
            title="Profitability Report"
            description="Profit margins and trends analysis"
            icon={<ProfitIcon />}
            color={theme.palette.primary.main}
            onClick={() => navigate('/reports/profitability')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ReportLinkCard
            title="Time Report"
            description="Time tracking and utilization metrics"
            icon={<TimeIcon />}
            color={theme.palette.info.main}
            onClick={() => navigate('/reports/time')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ReportLinkCard
            title="Ticket Report"
            description="Ticket resolution and status analysis"
            icon={<TicketIcon />}
            color={theme.palette.warning.main}
            onClick={() => navigate('/reports/tickets')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
