import { lazy } from 'react';

// Lazy-loaded chart components for better initial load performance
export const TicketStatusChart = lazy(() =>
  import('./DashboardCharts').then(module => ({ default: module.TicketStatusChart }))
);

export const ProjectProgressChart = lazy(() =>
  import('./DashboardCharts').then(module => ({ default: module.ProjectProgressChart }))
);

export const TicketsOverTimeChart = lazy(() =>
  import('./DashboardCharts').then(module => ({ default: module.TicketsOverTimeChart }))
);

export const RevenueChart = lazy(() =>
  import('./DashboardCharts').then(module => ({ default: module.RevenueChart }))
);

export const CategoryDistributionChart = lazy(() =>
  import('./DashboardCharts').then(module => ({ default: module.CategoryDistributionChart }))
);

export const TeamPerformanceChart = lazy(() =>
  import('./DashboardCharts').then(module => ({ default: module.TeamPerformanceChart }))
);

export const PriorityDistributionChart = lazy(() =>
  import('./DashboardCharts').then(module => ({ default: module.PriorityDistributionChart }))
);

// Advanced 3D Ticket Status Chart
export const TicketStatus3DChart = lazy(() =>
  import('./TicketStatus3DChart').then(module => ({ default: module.TicketStatus3DChart }))
);

// Advanced 3D Project Progress Chart
export const ProjectProgress3DChart = lazy(() =>
  import('./ProjectProgress3DChart').then(module => ({ default: module.ProjectProgress3DChart }))
);

// Advanced 3D Tickets Over Time Chart
export const TicketsOverTime3DChart = lazy(() =>
  import('./TicketsOverTime3DChart').then(module => ({ default: module.TicketsOverTime3DChart }))
);

// Advanced 3D Priority Distribution Chart
export const PriorityDistribution3DChart = lazy(() =>
  import('./PriorityDistribution3DChart').then(module => ({ default: module.PriorityDistribution3DChart }))
);

// Advanced 3D Revenue Chart
export const Revenue3DChart = lazy(() =>
  import('./Revenue3DChart').then(module => ({ default: module.Revenue3DChart }))
);

// StatCard is small and used frequently, so we export it directly
export { StatCard } from './DashboardCharts';

// Advanced 3D StatCard
export const StatCard3D = lazy(() =>
  import('./StatCard3D').then(module => ({ default: module.StatCard3D }))
);

// Dashboard Filters component
export { default as DashboardFilters } from './DashboardFilters';
export type { DashboardFilterValues, TimePeriod } from './DashboardFilters';
export { getDateRangeForPeriod } from './DashboardFilters';

// Welcome Banner component
export { default as WelcomeBanner } from './WelcomeBanner';
