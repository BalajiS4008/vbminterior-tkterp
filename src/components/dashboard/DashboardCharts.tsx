import React from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

// Ticket Status Distribution Chart
interface TicketStatusData {
  status: string;
  count: number;
  color: string;
  [key: string]: string | number;
}

interface TicketStatusChartProps {
  data: TicketStatusData[];
  loading?: boolean;
}

export const TicketStatusChart: React.FC<TicketStatusChartProps> = React.memo(({
  data,
  loading = false,
}) => {
  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 300 }}>
        <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={220} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Ticket Status Distribution
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="status"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
});

TicketStatusChart.displayName = 'TicketStatusChart';

// Project Progress Chart
interface ProjectProgressData {
  name: string;
  progress: number;
  target: number;
  [key: string]: string | number;
}

interface ProjectProgressChartProps {
  data: ProjectProgressData[];
  loading?: boolean;
}

export const ProjectProgressChart: React.FC<ProjectProgressChartProps> = React.memo(({
  data,
  loading = false,
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 300 }}>
        <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={220} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Project Progress
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="progress"
            fill={theme.palette.primary.main}
            name="Current Progress"
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="target"
            fill={theme.palette.grey[300]}
            name="Target"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

ProjectProgressChart.displayName = 'ProjectProgressChart';

// Tickets Over Time Chart
interface TicketsOverTimeData {
  date: string;
  created: number;
  resolved: number;
  [key: string]: string | number;
}

interface TicketsOverTimeChartProps {
  data: TicketsOverTimeData[];
  loading?: boolean;
}

export const TicketsOverTimeChart: React.FC<TicketsOverTimeChartProps> = React.memo(({
  data,
  loading = false,
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 300 }}>
        <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={220} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Tickets Over Time
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="created"
            stackId="1"
            stroke={theme.palette.warning.main}
            fill={theme.palette.warning.light}
            name="Created"
          />
          <Area
            type="monotone"
            dataKey="resolved"
            stackId="2"
            stroke={theme.palette.success.main}
            fill={theme.palette.success.light}
            name="Resolved"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
});

TicketsOverTimeChart.displayName = 'TicketsOverTimeChart';

// Revenue Chart
interface RevenueData {
  month: string;
  invoiced: number;
  received: number;
  pending: number;
  [key: string]: string | number;
}

interface RevenueChartProps {
  data: RevenueData[];
  loading?: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = React.memo(({
  data,
  loading = false,
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 300 }}>
        <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={220} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Revenue Overview
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="invoiced"
            fill={theme.palette.primary.main}
            name="Invoiced"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="received"
            fill={theme.palette.success.main}
            name="Received"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="pending"
            fill={theme.palette.warning.main}
            name="Pending"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

RevenueChart.displayName = 'RevenueChart';

// Category Distribution Chart
interface CategoryData {
  category: string;
  count: number;
  [key: string]: string | number;
}

interface CategoryDistributionChartProps {
  data: CategoryData[];
  loading?: boolean;
  title?: string;
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = React.memo(({
  data,
  loading = false,
  title = 'Category Distribution',
}) => {
  const theme = useTheme();
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 300 }}>
        <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={220} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="count"
            nameKey="category"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
});

CategoryDistributionChart.displayName = 'CategoryDistributionChart';

// Team Performance Chart
interface TeamMemberData {
  name: string;
  ticketsResolved: number;
  avgResolutionTime: number;
  [key: string]: string | number;
}

interface TeamPerformanceChartProps {
  data: TeamMemberData[];
  loading?: boolean;
}

export const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = React.memo(({
  data,
  loading = false,
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 300 }}>
        <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={220} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Team Performance
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
          <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
          <Tooltip />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="ticketsResolved"
            fill={theme.palette.primary.main}
            name="Tickets Resolved"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="avgResolutionTime"
            fill={theme.palette.secondary.main}
            name="Avg. Resolution Time (hrs)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

TeamPerformanceChart.displayName = 'TeamPerformanceChart';

// Priority Distribution Chart
interface PriorityData {
  priority: string;
  count: number;
  color: string;
  [key: string]: string | number;
}

interface PriorityDistributionChartProps {
  data: PriorityData[];
  loading?: boolean;
}

export const PriorityDistributionChart: React.FC<PriorityDistributionChartProps> = React.memo(({
  data,
  loading = false,
}) => {
  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 300 }}>
        <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={220} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Priority Distribution
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="priority" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
});

PriorityDistributionChart.displayName = 'PriorityDistributionChart';

// Stats Cards
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  change,
  changeLabel,
  icon,
  color,
  loading = false,
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="30%" />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
      {icon && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            opacity: 0.1,
            fontSize: 100,
            color: color || theme.palette.primary.main,
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography
        variant="h4"
        sx={{ color: color || theme.palette.text.primary, mb: 1 }}
      >
        {value}
      </Typography>
      {change !== undefined && (
        <Typography
          variant="body2"
          sx={{
            color: change >= 0 ? theme.palette.success.main : theme.palette.error.main,
          }}
        >
          {change >= 0 ? '+' : ''}
          {change}% {changeLabel}
        </Typography>
      )}
    </Paper>
  );
});

StatCard.displayName = 'StatCard';

export default {
  TicketStatusChart,
  ProjectProgressChart,
  TicketsOverTimeChart,
  RevenueChart,
  CategoryDistributionChart,
  TeamPerformanceChart,
  PriorityDistributionChart,
  StatCard,
};
