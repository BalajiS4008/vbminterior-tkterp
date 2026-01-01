import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Paper,
  alpha,
  type Theme,
} from '@mui/material';
import {
  Folder as ProjectsIcon,
  ConfirmationNumber as TicketsIcon,
  Receipt as InvoicesIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { StatusChip } from '../../components/common';
import {
  TicketStatus3DChart,
  ProjectProgress3DChart,
  TicketsOverTime3DChart,
  Revenue3DChart,
  PriorityDistribution3DChart,
  StatCard3D,
  DashboardFilters,
  WelcomeBanner,
} from '../../components/dashboard';
import type { DashboardFilterValues } from '../../components/dashboard';
import { useAuth } from '../../contexts';
import { useRealtimeDashboardStats } from '../../hooks';
import { ROUTES } from '../../config/constants';
import { formatDate } from '../../utils';
import { projectService } from '../../services';

// 3D Chart loading fallback component
const Chart3DFallback: React.FC = () => (
  <Paper sx={{ p: 3, height: 400 }}>
    <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
  </Paper>
);

// 3D StatCard loading fallback component
const StatCard3DFallback: React.FC = () => (
  <Paper sx={{ p: 2, height: 180 }}>
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="rectangular" height={100} sx={{ my: 1, borderRadius: 2 }} />
    <Skeleton variant="text" width="40%" />
  </Paper>
);

// Mock data for charts - replace with actual API calls
const mockTicketStatusData = [
  { status: 'Open', count: 15, color: '#ff9800' },
  { status: 'In Progress', count: 12, color: '#2196f3' },
  { status: 'Pending', count: 8, color: '#9c27b0' },
  { status: 'Resolved', count: 28, color: '#4caf50' },
  { status: 'Closed', count: 18, color: '#9e9e9e' },
];

const mockProjectProgressData = [
  { name: 'Villa Project', progress: 75, target: 100 },
  { name: 'Apartment Complex', progress: 45, target: 100 },
  { name: 'Office Renovation', progress: 90, target: 100 },
  { name: 'Mall Construction', progress: 30, target: 100 },
];

const mockTicketsOverTimeData = [
  { date: 'Week 1', created: 12, resolved: 8 },
  { date: 'Week 2', created: 19, resolved: 14 },
  { date: 'Week 3', created: 15, resolved: 18 },
  { date: 'Week 4', created: 22, resolved: 20 },
  { date: 'Week 5', created: 18, resolved: 22 },
  { date: 'Week 6', created: 14, resolved: 16 },
];

const mockRevenueData = [
  { month: 'Jul', invoiced: 500000, received: 400000, pending: 100000 },
  { month: 'Aug', invoiced: 650000, received: 550000, pending: 100000 },
  { month: 'Sep', invoiced: 480000, received: 420000, pending: 60000 },
  { month: 'Oct', invoiced: 720000, received: 600000, pending: 120000 },
  { month: 'Nov', invoiced: 550000, received: 480000, pending: 70000 },
  { month: 'Dec', invoiced: 680000, received: 520000, pending: 160000 },
];

const mockPriorityData = [
  { priority: 'Critical', count: 5, color: '#d32f2f' },
  { priority: 'High', count: 12, color: '#f57c00' },
  { priority: 'Medium', count: 25, color: '#fbc02d' },
  { priority: 'Low', count: 18, color: '#4caf50' },
];

const mockRecentTickets = [
  { id: '1', title: 'Electrical wiring issue in Block A', status: 'open', priority: 'high', project: 'Villa Project' },
  { id: '2', title: 'Plumbing leak in bathroom', status: 'in_progress', priority: 'critical', project: 'Apartment Complex' },
  { id: '3', title: 'Paint touch-up required', status: 'pending', priority: 'low', project: 'Office Renovation' },
  { id: '4', title: 'Window frame installation', status: 'open', priority: 'medium', project: 'Mall Construction' },
];

const mockUpcomingDeadlines = [
  { id: '1', name: 'Villa Project - Phase 1', date: new Date(2024, 11, 31), progress: 75 },
  { id: '2', name: 'Apartment Complex', date: new Date(2025, 0, 15), progress: 45 },
  { id: '3', name: 'Office Renovation', date: new Date(2025, 0, 30), progress: 90 },
];

type ChartView = 'overview' | 'tickets' | 'revenue';

// Common hover card styles for 3D effect
const getHoverCardSx = (theme: Theme) => ({
  height: '100%',
  borderRadius: 3,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
    : theme.palette.background.paper,
  '&:hover': {
    transform: 'translateY(-8px) scale(1.01)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 20px 40px ${alpha(theme.palette.common.black, 0.4)}, 0 0 20px ${alpha(theme.palette.primary.main, 0.1)}`
      : `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  },
});

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { userData, hasPermission } = useAuth();
  const [chartView, setChartView] = useState<ChartView>('overview');

  // Dashboard filter state
  const [filterValues, setFilterValues] = useState<DashboardFilterValues>({
    projectId: '',
    timePeriod: 'month',
    startDate: null,
    endDate: null,
  });

  // Projects list for filter dropdown
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Fetch projects for filter dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        const { projects: projectList } = await projectService.getAll();
        setProjects(projectList.map(p => ({ id: p.id, name: p.name })));
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Use real-time stats hook
  const { stats, loading: statsLoading } = useRealtimeDashboardStats(
    userData?.id,
    userData?.role
  );

  // Fallback to mock data if real-time stats are empty
  const displayStats = useMemo(() => ({
    totalProjects: stats.totalProjects || 12,
    activeProjects: stats.activeProjects || 8,
    totalTickets: stats.totalTickets || 45,
    openTickets: stats.openTickets || 15,
    pendingInvoices: stats.pendingInvoices || 5,
    overdueTickets: stats.overdueTickets || 2,
  }), [stats]);

  const handleFilterChange = (values: DashboardFilterValues) => {
    setFilterValues(values);
    // TODO: In a real implementation, this would trigger data refetch with the new filters
    console.log('Dashboard filters changed:', values);
  };

  const handleChartViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ChartView | null
  ) => {
    if (newView !== null) {
      setChartView(newView);
    }
  };

  return (
    <Box>
      {/* Welcome Banner */}
      <WelcomeBanner
        userName={userData?.displayName || 'User'}
        subtitle="Ready to start your day with some productivity?"
      />

      {/* Dashboard Filters */}
      <DashboardFilters
        projects={projects}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        loading={projectsLoading}
      />

      {/* Stats Grid - 3D Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Suspense fallback={<StatCard3DFallback />}>
            <StatCard3D
              title={t('dashboard.activeProjects')}
              value={displayStats.activeProjects}
              icon={<ProjectsIcon sx={{ fontSize: 80 }} />}
              color={theme.palette.primary.main}
              change={12}
              changeLabel="vs last month"
              loading={statsLoading}
            />
          </Suspense>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Suspense fallback={<StatCard3DFallback />}>
            <StatCard3D
              title={t('dashboard.openTickets')}
              value={displayStats.openTickets}
              icon={<TicketsIcon sx={{ fontSize: 80 }} />}
              color={theme.palette.warning.main}
              change={-8}
              changeLabel="vs last week"
              loading={statsLoading}
            />
          </Suspense>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Suspense fallback={<StatCard3DFallback />}>
            <StatCard3D
              title={t('dashboard.pendingInvoices')}
              value={displayStats.pendingInvoices}
              icon={<InvoicesIcon sx={{ fontSize: 80 }} />}
              color={theme.palette.info.main}
              loading={statsLoading}
            />
          </Suspense>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Suspense fallback={<StatCard3DFallback />}>
            <StatCard3D
              title="Overdue Tickets"
              value={displayStats.overdueTickets}
              icon={<WarningIcon sx={{ fontSize: 80 }} />}
              color={theme.palette.error.main}
              loading={statsLoading}
            />
          </Suspense>
        </Grid>
      </Grid>

      {/* Chart View Toggle */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <ToggleButtonGroup
          value={chartView}
          exclusive
          onChange={handleChartViewChange}
          size="small"
        >
          <ToggleButton value="overview">Overview</ToggleButton>
          <ToggleButton value="tickets">Tickets</ToggleButton>
          <ToggleButton value="revenue">Revenue</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Charts Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {chartView === 'overview' && (
          <>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Suspense fallback={<Chart3DFallback />}>
                <TicketStatus3DChart data={mockTicketStatusData} height={400} />
              </Suspense>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Suspense fallback={<Chart3DFallback />}>
                <ProjectProgress3DChart data={mockProjectProgressData} height={400} />
              </Suspense>
            </Grid>
          </>
        )}
        {chartView === 'tickets' && (
          <>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Suspense fallback={<Chart3DFallback />}>
                <TicketsOverTime3DChart data={mockTicketsOverTimeData} height={400} />
              </Suspense>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Suspense fallback={<Chart3DFallback />}>
                <PriorityDistribution3DChart data={mockPriorityData} height={400} />
              </Suspense>
            </Grid>
          </>
        )}
        {chartView === 'revenue' && (
          <>
            <Grid size={{ xs: 12 }}>
              <Suspense fallback={<Chart3DFallback />}>
                <Revenue3DChart data={mockRevenueData} height={420} />
              </Suspense>
            </Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={getHoverCardSx(theme)}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                {t('dashboard.quickActions')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                {hasPermission('projects.create') && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(ROUTES.PROJECT_CREATE)}
                    fullWidth
                    sx={{
                      py: 1.2,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    }}
                  >
                    {t('projects.createProject')}
                  </Button>
                )}
                {hasPermission('tickets.create') && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(ROUTES.TICKET_CREATE)}
                    fullWidth
                    sx={{
                      py: 1.2,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    }}
                  >
                    {t('tickets.createTicket')}
                  </Button>
                )}
                {hasPermission('invoices.create') && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(ROUTES.INVOICE_CREATE)}
                    fullWidth
                    sx={{
                      py: 1.2,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    }}
                  >
                    {t('invoices.createInvoice')}
                  </Button>
                )}
                {hasPermission('quotations.create') && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(ROUTES.QUOTATION_CREATE)}
                    fullWidth
                    sx={{
                      py: 1.2,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    }}
                  >
                    Create Quotation
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tickets */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={getHoverCardSx(theme)}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.recentActivity')}
                </Typography>
                <Button size="small" onClick={() => navigate(ROUTES.TICKETS)}>
                  View All
                </Button>
              </Box>
              <List disablePadding>
                {mockRecentTickets.map((ticket) => (
                  <ListItem
                    key={ticket.id}
                    sx={{
                      px: 1,
                      py: 1,
                      borderRadius: 2,
                      mb: 0.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <TicketsIcon color="action" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={ticket.title}
                      secondary={ticket.project}
                      primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <StatusChip
                      type="priority"
                      value={ticket.priority as any}
                      label={ticket.priority}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Deadlines */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={getHoverCardSx(theme)}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.upcomingDeadlines')}
                </Typography>
                <Button size="small" onClick={() => navigate(ROUTES.PROJECTS)}>
                  View All
                </Button>
              </Box>
              <List disablePadding>
                {mockUpcomingDeadlines.map((project) => (
                  <ListItem
                    key={project.id}
                    sx={{
                      px: 1.5,
                      py: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', mb: 1 }}>
                      <ScheduleIcon color="action" fontSize="small" />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {project.name}
                      </Typography>
                      <Chip
                        label={formatDate(project.date)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {project.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
