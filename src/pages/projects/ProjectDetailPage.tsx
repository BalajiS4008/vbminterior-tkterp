import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  LinearProgress,
  Chip,
  Avatar,
  Tab,
  Tabs,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { PageHeader, StatusChip, LoadingSpinner } from '../../components/common';
import { useAuth } from '../../contexts';
import { ROUTES, EXPENSE_CATEGORY_OPTIONS } from '../../config/constants';
import { formatDate, formatCurrency, generateInitials } from '../../utils';
import { projectService, ticketService, invoiceService, expenseService, paymentService } from '../../services';
import type { Project, Ticket, Invoice, Expense, Payment, ExpenseCategory } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.5 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  </Box>
);

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { hasPermission } = useAuth();

  const [tabValue, setTabValue] = React.useState(0);
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch project first (required)
        const projectData = await projectService.getById(id);
        setProject(projectData);

        // Fetch tickets and invoices separately to handle index errors gracefully
        try {
          const ticketsData = await ticketService.getByProjectId(id);
          setTickets(ticketsData);
        } catch (ticketError) {
          console.error('Error fetching tickets:', ticketError);
          setTickets([]);
        }

        try {
          const invoicesData = await invoiceService.getByProjectId(id);
          setInvoices(invoicesData);
        } catch (invoiceError) {
          console.error('Error fetching invoices:', invoiceError);
          setInvoices([]);
        }

        try {
          const expensesData = await expenseService.getByProjectId(id);
          setExpenses(expensesData);
        } catch (expenseError) {
          console.error('Error fetching expenses:', expenseError);
          setExpenses([]);
        }

        try {
          const { payments: paymentsData } = await paymentService.getAll({ projectId: id });
          setPayments(paymentsData);
        } catch (paymentError) {
          console.error('Error fetching payments:', paymentError);
          setPayments([]);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  const financialMetrics = useMemo(() => {
    const budget = project?.budget || 0;
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + (inv.financialSummary?.grandTotal || 0), 0
    );

    // Calculate expenses by status
    const approvedExpenses = expenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    const pendingExpenses = expenses
      .filter(e => e.status === 'submitted')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    const draftExpenses = expenses
      .filter(e => e.status === 'draft')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    // Total expenses = all non-rejected expenses
    const totalExpenses = expenses
      .filter(e => e.status !== 'rejected')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

    // Profit/Loss uses all non-rejected expenses for true picture
    const profitLoss = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0
      ? Math.round((profitLoss / totalRevenue) * 1000) / 10
      : 0;
    const budgetUtilization = budget > 0
      ? Math.round((totalExpenses / budget) * 1000) / 10
      : 0;

    // Category breakdown includes all non-rejected expenses
    const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();
    expenses
      .filter(e => e.status !== 'rejected')
      .forEach(e => {
        const existing = categoryMap.get(e.category) || { total: 0, count: 0 };
        categoryMap.set(e.category, {
          total: existing.total + e.totalAmount,
          count: existing.count + 1,
        });
      });
    const expensesByCategory = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total);

    return {
      budget,
      totalRevenue,
      totalExpenses,
      approvedExpenses,
      pendingExpenses,
      draftExpenses,
      totalPayments,
      profitLoss,
      profitMargin,
      budgetUtilization,
      expensesByCategory,
      outstandingAmount: totalRevenue - totalPayments,
    };
  }, [project, invoices, expenses, payments]);

  const getCategoryLabel = (category: ExpenseCategory): string => {
    const option = EXPENSE_CATEGORY_OPTIONS.find(o => o.value === category);
    return option?.labelEn || category;
  };

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!project) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Project not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={project.name}
        breadcrumbs={[
          { label: t('projects.title'), path: ROUTES.PROJECTS },
          { label: project.name },
        ]}
        actionLabel={hasPermission('projects.edit') ? t('common.edit') : undefined}
        onAction={hasPermission('projects.edit') ? handleEdit : undefined}
        actionIcon={<EditIcon />}
      />

      <Grid container spacing={3}>
        {/* Financial Overview */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Box sx={{
                    p: 2, borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}>
                    <Typography variant="caption" color="text.secondary">Budget</Typography>
                    <Typography variant="h6" fontWeight={600} color="info.main">
                      {formatCurrency(financialMetrics.budget)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {financialMetrics.budgetUtilization}% utilized
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Box sx={{
                    p: 2, borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}>
                    <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {formatCurrency(financialMetrics.totalRevenue)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Box sx={{
                    p: 2, borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  }}>
                    <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
                    <Typography variant="h6" fontWeight={600} color="error.main">
                      {formatCurrency(financialMetrics.totalExpenses)}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
                      {financialMetrics.approvedExpenses > 0 && (
                        <Typography variant="caption" color="success.main">
                          Approved: {formatCurrency(financialMetrics.approvedExpenses)}
                        </Typography>
                      )}
                      {financialMetrics.pendingExpenses > 0 && (
                        <Typography variant="caption" color="info.main">
                          Pending: {formatCurrency(financialMetrics.pendingExpenses)}
                        </Typography>
                      )}
                      {financialMetrics.draftExpenses > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Draft: {formatCurrency(financialMetrics.draftExpenses)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Box sx={{
                    p: 2, borderRadius: 2,
                    bgcolor: alpha(
                      financialMetrics.profitLoss >= 0 ? theme.palette.success.main : theme.palette.error.main,
                      0.08
                    ),
                    border: `1px solid ${alpha(
                      financialMetrics.profitLoss >= 0 ? theme.palette.success.main : theme.palette.error.main,
                      0.2
                    )}`,
                  }}>
                    <Typography variant="caption" color="text.secondary">Profit / Loss</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {financialMetrics.profitLoss >= 0
                        ? <TrendingUpIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        : <TrendingDownIcon sx={{ fontSize: 18, color: 'error.main' }} />
                      }
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color={financialMetrics.profitLoss >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(Math.abs(financialMetrics.profitLoss))}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {financialMetrics.profitMargin}% margin
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Box sx={{
                    p: 2, borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}>
                    <Typography variant="caption" color="text.secondary">Payments Received</Typography>
                    <Typography variant="h6" fontWeight={600} color="warning.main">
                      {formatCurrency(financialMetrics.totalPayments)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(financialMetrics.outstandingAmount)} outstanding
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {financialMetrics.expensesByCategory.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Expense Breakdown by Category
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {financialMetrics.expensesByCategory.map(({ category, total, count }) => (
                      <Box key={category} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ minWidth: 140 }}>
                          {getCategoryLabel(category)}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={financialMetrics.totalExpenses > 0 ? (total / financialMetrics.totalExpenses) * 100 : 0}
                            sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                          />
                        </Box>
                        <Typography variant="body2" fontWeight={500} sx={{ minWidth: 100, textAlign: 'right' }}>
                          {formatCurrency(total)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 30 }}>
                          ({count})
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              {/* Status & Progress */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StatusChip
                  type="project"
                  value={project.status}
                  label={t(`projects.status.${project.status}`)}
                />
                {project.tags?.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>

              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('projects.progress')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {project.progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={project.progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {/* Description */}
              <Typography variant="body1" sx={{ mb: 3 }}>
                {project.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Tabs */}
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label={t('projects.linkedTickets')} />
                <Tab label={t('projects.linkedInvoices')} />
                <Tab label={`Expenses (${expenses.length})`} />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                {tickets.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('projects.noTickets') || 'No tickets linked to this project yet.'}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2" fontWeight={500} color="primary">
                                {ticket.ticketNumber}
                              </Typography>
                              <Typography variant="body2">{ticket.title}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StatusChip
                                type="ticket"
                                value={ticket.status}
                                label={t(`tickets.status.${ticket.status}`)}
                              />
                              <StatusChip
                                type="priority"
                                value={ticket.priority}
                                label={t(`tickets.priority.${ticket.priority}`)}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {invoices.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('projects.noInvoices') || 'No invoices linked to this project yet.'}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {invoices.map((invoice) => (
                      <Card
                        key={invoice.id}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2" fontWeight={500} color="primary">
                                {invoice.invoiceNumber}
                              </Typography>
                              <Typography variant="body2">
                                {formatCurrency(invoice.financialSummary.grandTotal)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StatusChip
                                type="document"
                                value={invoice.status}
                                label={t(`invoices.status.${invoice.status}`)}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(invoice.issueDate)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                {expenses.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No expenses linked to this project yet.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Expense #</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow
                            key={expense.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/expenses/${expense.id}`)}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={500} color="primary">
                                {expense.expenseNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getCategoryLabel(expense.category)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {expense.description}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={500}>
                                {formatCurrency(expense.totalAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={expense.status}
                                size="small"
                                sx={{
                                  bgcolor:
                                    expense.status === 'approved' ? alpha(theme.palette.success.main, 0.15) :
                                    expense.status === 'rejected' ? alpha(theme.palette.error.main, 0.15) :
                                    expense.status === 'submitted' ? alpha(theme.palette.info.main, 0.15) :
                                    alpha(theme.palette.grey[500], 0.15),
                                  color:
                                    expense.status === 'approved' ? theme.palette.success.main :
                                    expense.status === 'rejected' ? theme.palette.error.main :
                                    expense.status === 'submitted' ? theme.palette.info.main :
                                    theme.palette.grey[600],
                                  textTransform: 'capitalize',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(expense.expenseDate)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Project Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('projects.projectDetails')}
              </Typography>

              <DetailRow
                icon={<LocationIcon fontSize="small" />}
                label={t('projects.location')}
                value={project.location}
              />

              <DetailRow
                icon={<MoneyIcon fontSize="small" />}
                label={t('projects.budget')}
                value={formatCurrency(project.budget)}
              />

              <DetailRow
                icon={<CalendarIcon fontSize="small" />}
                label={t('projects.startDate')}
                value={formatDate(project.startDate)}
              />

              <DetailRow
                icon={<CalendarIcon fontSize="small" />}
                label={t('projects.endDate')}
                value={formatDate(project.endDate)}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                {t('projects.assignedUsers')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {project.assignedUsers.slice(0, 4).map((userId, index) => (
                  <Avatar
                    key={userId}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.primary.main,
                    }}
                  >
                    {generateInitials(`User ${index + 1}`)}
                  </Avatar>
                ))}
                {project.assignedUsers.length > 4 && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.grey[500],
                    }}
                  >
                    +{project.assignedUsers.length - 4}
                  </Avatar>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client Details
              </Typography>

              <DetailRow
                icon={<PersonIcon fontSize="small" />}
                label={t('projects.clientName')}
                value={project.clientName}
              />

              {project.clientContact && (
                <DetailRow
                  icon={<PhoneIcon fontSize="small" />}
                  label={t('projects.clientContact')}
                  value={project.clientContact}
                />
              )}

              {project.clientEmail && (
                <DetailRow
                  icon={<EmailIcon fontSize="small" />}
                  label={t('projects.clientEmail')}
                  value={project.clientEmail}
                />
              )}

              {project.clientAddress && (
                <DetailRow
                  icon={<LocationIcon fontSize="small" />}
                  label={t('projects.clientAddress')}
                  value={project.clientAddress}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDetailPage;
