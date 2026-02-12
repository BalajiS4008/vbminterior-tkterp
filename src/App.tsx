import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ThemeProvider, NotificationProvider } from './contexts';
import { MainLayout, AuthLayout } from './components/layout';
import { LoadingSpinner, ProtectedRoute, PWAPrompt } from './components/common';
import { ROUTES } from './config/constants';
import './config/i18n';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProjectListPage = lazy(() => import('./pages/projects/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const ProjectFormPage = lazy(() => import('./pages/projects/ProjectFormPage'));
const TicketListPage = lazy(() => import('./pages/tickets/TicketListPage'));
const TicketDetailPage = lazy(() => import('./pages/tickets/TicketDetailPage'));
const TicketFormPage = lazy(() => import('./pages/tickets/TicketFormPage'));
const KanbanBoardPage = lazy(() => import('./pages/tickets/KanbanBoardPage'));
const ClientListPage = lazy(() => import('./pages/clients/ClientListPage'));
const ClientDetailPage = lazy(() => import('./pages/clients/ClientDetailPage'));
const ClientFormPage = lazy(() => import('./pages/clients/ClientFormPage'));
const QuotationListPage = lazy(() => import('./pages/invoices/QuotationListPage'));
const QuotationDetailPage = lazy(() => import('./pages/invoices/QuotationDetailPage'));
const QuotationFormPage = lazy(() => import('./pages/invoices/QuotationFormPage'));
const InvoiceListPage = lazy(() => import('./pages/invoices/InvoiceListPage'));
const InvoiceDetailPage = lazy(() => import('./pages/invoices/InvoiceDetailPage'));
const InvoiceFormPage = lazy(() => import('./pages/invoices/InvoiceFormPage'));
const PaymentListPage = lazy(() => import('./pages/payments/PaymentListPage'));
const PaymentDetailPage = lazy(() => import('./pages/payments/PaymentDetailPage'));
const PaymentFormPage = lazy(() => import('./pages/payments/PaymentFormPage'));
const ExpenseListPage = lazy(() => import('./pages/expenses/ExpenseListPage'));
const ExpenseDetailPage = lazy(() => import('./pages/expenses/ExpenseDetailPage'));
const ExpenseFormPage = lazy(() => import('./pages/expenses/ExpenseFormPage'));
const TimesheetPage = lazy(() => import('./pages/timesheet/TimesheetPage'));
const TimeEntryFormPage = lazy(() => import('./pages/timesheet/TimeEntryFormPage'));
const CalendarPage = lazy(() => import('./pages/calendar/CalendarPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const RevenueReport = lazy(() => import('./pages/reports/RevenueReport'));
const ExpenseReport = lazy(() => import('./pages/reports/ExpenseReport'));
const ProfitabilityReport = lazy(() => import('./pages/reports/ProfitabilityReport'));
const TimeReport = lazy(() => import('./pages/reports/TimeReport'));
const TicketReport = lazy(() => import('./pages/reports/TicketReport'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/dashboard/NotificationsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const DevFinancialTestPage = lazy(() => import('./pages/DevFinancialTestPage'));

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <PWAPrompt />
              <Suspense fallback={<LoadingSpinner fullScreen />}>
                <Routes>
                  {/* Auth Routes */}
                  <Route element={<AuthLayout />}>
                    <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                  </Route>

                  {/* Protected Routes */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Dashboard */}
                    <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                    <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />

                    {/* Projects */}
                    <Route
                      path={ROUTES.PROJECTS}
                      element={
                        <ProtectedRoute requiredPermission="projects.view">
                          <ProjectListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PROJECT_CREATE}
                      element={
                        <ProtectedRoute requiredPermission="projects.create">
                          <ProjectFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PROJECT_DETAIL}
                      element={
                        <ProtectedRoute requiredPermission="projects.view">
                          <ProjectDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PROJECT_EDIT}
                      element={
                        <ProtectedRoute requiredPermission="projects.edit">
                          <ProjectFormPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Tickets */}
                    <Route
                      path={ROUTES.TICKETS}
                      element={
                        <ProtectedRoute requiredPermission="tickets.view">
                          <TicketListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.TICKET_CREATE}
                      element={
                        <ProtectedRoute requiredPermission="tickets.create">
                          <TicketFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.TICKET_DETAIL}
                      element={
                        <ProtectedRoute requiredPermission="tickets.view">
                          <TicketDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.TICKET_EDIT}
                      element={
                        <ProtectedRoute requiredPermission="tickets.edit">
                          <TicketFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.TICKET_KANBAN}
                      element={
                        <ProtectedRoute requiredPermission="tickets.view">
                          <KanbanBoardPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Clients */}
                    <Route
                      path={ROUTES.CLIENTS}
                      element={<ClientListPage />}
                    />
                    <Route
                      path={ROUTES.CLIENT_CREATE}
                      element={<ClientFormPage />}
                    />
                    <Route
                      path={ROUTES.CLIENT_DETAIL}
                      element={<ClientDetailPage />}
                    />
                    <Route
                      path={ROUTES.CLIENT_EDIT}
                      element={<ClientFormPage />}
                    />

                    {/* Quotations */}
                    <Route
                      path={ROUTES.QUOTATIONS}
                      element={
                        <ProtectedRoute requiredPermission="quotations.view">
                          <QuotationListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.QUOTATION_CREATE}
                      element={
                        <ProtectedRoute requiredPermission="quotations.create">
                          <QuotationFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.QUOTATION_DETAIL}
                      element={
                        <ProtectedRoute requiredPermission="quotations.view">
                          <QuotationDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.QUOTATION_EDIT}
                      element={
                        <ProtectedRoute requiredPermission="quotations.edit">
                          <QuotationFormPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Invoices */}
                    <Route
                      path={ROUTES.INVOICES}
                      element={
                        <ProtectedRoute requiredPermission="invoices.view">
                          <InvoiceListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.INVOICE_CREATE}
                      element={
                        <ProtectedRoute requiredPermission="invoices.create">
                          <InvoiceFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.INVOICE_DETAIL}
                      element={
                        <ProtectedRoute requiredPermission="invoices.view">
                          <InvoiceDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.INVOICE_EDIT}
                      element={
                        <ProtectedRoute requiredPermission="invoices.edit">
                          <InvoiceFormPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Payments */}
                    <Route
                      path={ROUTES.PAYMENTS}
                      element={<PaymentListPage />}
                    />
                    <Route
                      path={ROUTES.PAYMENT_CREATE}
                      element={<PaymentFormPage />}
                    />
                    <Route
                      path={ROUTES.PAYMENT_DETAIL}
                      element={<PaymentDetailPage />}
                    />

                    {/* Expenses */}
                    <Route
                      path={ROUTES.EXPENSES}
                      element={<ExpenseListPage />}
                    />
                    <Route
                      path={ROUTES.EXPENSE_CREATE}
                      element={<ExpenseFormPage />}
                    />
                    <Route
                      path={ROUTES.EXPENSE_DETAIL}
                      element={<ExpenseDetailPage />}
                    />
                    <Route
                      path={ROUTES.EXPENSE_EDIT}
                      element={<ExpenseFormPage />}
                    />

                    {/* Timesheet */}
                    <Route
                      path={ROUTES.TIMESHEET}
                      element={<TimesheetPage />}
                    />
                    <Route
                      path={ROUTES.TIMESHEET_CREATE}
                      element={<TimeEntryFormPage />}
                    />
                    <Route
                      path="/timesheet/entry/:id/edit"
                      element={<TimeEntryFormPage />}
                    />

                    {/* Calendar */}
                    <Route
                      path={ROUTES.CALENDAR}
                      element={<CalendarPage />}
                    />

                    {/* Reports */}
                    <Route
                      path={ROUTES.REPORTS}
                      element={<ReportsPage />}
                    />
                    <Route
                      path={ROUTES.REPORTS_REVENUE}
                      element={<RevenueReport />}
                    />
                    <Route
                      path={ROUTES.REPORTS_EXPENSES}
                      element={<ExpenseReport />}
                    />
                    <Route
                      path={ROUTES.REPORTS_PROFITABILITY}
                      element={<ProfitabilityReport />}
                    />
                    <Route
                      path={ROUTES.REPORTS_TIME}
                      element={<TimeReport />}
                    />
                    <Route
                      path={ROUTES.REPORTS_TICKETS}
                      element={<TicketReport />}
                    />

                    {/* Settings */}
                    <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                    <Route path={`${ROUTES.SETTINGS}/*`} element={<SettingsPage />} />

                    {/* Dev Test Page */}
                    <Route path="/dev/financial-test" element={<DevFinancialTestPage />} />
                  </Route>

                  {/* Redirect root to dashboard or login */}
                  <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

                  {/* 404 Page */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
