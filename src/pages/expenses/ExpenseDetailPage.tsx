import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Chip,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Receipt as ExpenseIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Print as PrintIcon,
  Category as CategoryIcon,
  Business as VendorIcon,
  CalendarMonth as DateIcon,
  Payment as PaymentIcon,
  Folder as ProjectIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner, EmptyState, ConfirmDialog } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES, EXPENSE_CATEGORY_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../../config/constants';
import { formatDate, formatCurrency } from '../../utils';
import { expenseService } from '../../services';
import type { Expense, ExpenseCategory, ExpenseStatus, ExpensePaymentStatus } from '../../types';

const EXPENSE_STATUS_COLORS: Record<ExpenseStatus, string> = {
  draft: '#9E9E9E',
  submitted: '#2196F3',
  approved: '#4CAF50',
  rejected: '#F44336',
};

const EXPENSE_PAYMENT_STATUS_COLORS: Record<ExpensePaymentStatus, string> = {
  pending: '#FF9800',
  partial: '#2196F3',
  paid: '#4CAF50',
};

const ExpenseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    const fetchExpense = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await expenseService.getById(id);
        setExpense(data);
      } catch (error) {
        console.error('Error fetching expense:', error);
        showError('Failed to load expense');
      } finally {
        setLoading(false);
      }
    };
    fetchExpense();
  }, [id, showError]);

  const handleEdit = () => {
    navigate(`${ROUTES.EXPENSES}/${id}/edit`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleApprove = async () => {
    if (!expense || !userData?.id) return;
    try {
      const updated = await expenseService.approve(expense.id, userData.id);
      setExpense(updated);
      showSuccess('Expense approved successfully');
    } catch (error) {
      showError('Failed to approve expense');
    } finally {
      setApproveDialogOpen(false);
    }
  };

  const handleReject = async () => {
    if (!expense) return;
    try {
      const updated = await expenseService.reject(expense.id);
      setExpense(updated);
      showSuccess('Expense rejected');
    } catch (error) {
      showError('Failed to reject expense');
    } finally {
      setRejectDialogOpen(false);
    }
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    const option = EXPENSE_CATEGORY_OPTIONS.find(o => o.value === category);
    return option?.labelEn || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    const option = PAYMENT_METHOD_OPTIONS.find(o => o.value === method);
    return option?.labelEn || method;
  };

  const getStatusLabel = (status: ExpenseStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPaymentStatusLabel = (status: ExpensePaymentStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) return <LoadingSpinner />;

  if (!expense) {
    return (
      <Box>
        <PageHeader
          title="Expense Details"
          breadcrumbs={[
            { label: 'Expenses', path: ROUTES.EXPENSES },
            { label: 'Not Found' },
          ]}
        />
        <Card>
          <CardContent>
            <EmptyState
              icon={ExpenseIcon}
              title="Expense Not Found"
              description="The expense you're looking for doesn't exist or has been deleted."
              actionLabel="Back to Expenses"
              onAction={() => navigate(ROUTES.EXPENSES)}
            />
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={expense.expenseNumber}
        breadcrumbs={[
          { label: 'Expenses', path: ROUTES.EXPENSES },
          { label: expense.expenseNumber },
        ]}
      />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate(ROUTES.EXPENSES)}>
          Back
        </Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print
        </Button>
        {expense.status === 'draft' && (
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
            Edit
          </Button>
        )}
        {expense.status === 'submitted' && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => setApproveDialogOpen(true)}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => setRejectDialogOpen(true)}
            >
              Reject
            </Button>
          </>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {expense.expenseNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created on {formatDate(expense.createdAt)}
                  </Typography>
                </Box>
                <Chip
                  label={getStatusLabel(expense.status)}
                  sx={{
                    backgroundColor: alpha(EXPENSE_STATUS_COLORS[expense.status], 0.15),
                    color: EXPENSE_STATUS_COLORS[expense.status],
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Description */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">
                  {expense.description}
                </Typography>
              </Box>

              {/* Details List */}
              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CategoryIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Category"
                    secondary={`${getCategoryLabel(expense.category)}${expense.subcategory ? ` - ${expense.subcategory}` : ''}`}
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <DateIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Expense Date"
                    secondary={formatDate(expense.expenseDate)}
                  />
                </ListItem>

                {expense.projectName && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <ProjectIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Project"
                      secondary={expense.projectName}
                    />
                  </ListItem>
                )}

                {expense.vendorName && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <VendorIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Vendor/Supplier"
                      secondary={expense.vendorName}
                    />
                  </ListItem>
                )}

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <PaymentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Payment Method"
                    secondary={getPaymentMethodLabel(expense.paymentMethod)}
                  />
                </ListItem>

                {expense.referenceNumber && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <ExpenseIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Reference Number"
                      secondary={expense.referenceNumber}
                    />
                  </ListItem>
                )}

                {expense.notes && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <NotesIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Notes"
                      secondary={expense.notes}
                    />
                  </ListItem>
                )}
              </List>

              {/* Approval Info */}
              {expense.status === 'approved' && expense.approvedBy && (
                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="success.main">
                    Approved
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved on {expense.approvedAt ? formatDate(expense.approvedAt) : 'N/A'}
                  </Typography>
                </Box>
              )}

              {expense.status === 'rejected' && (
                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="error.main">
                    Rejected
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Amount Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Amount Summary
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Base Amount
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(expense.amount)}
                </Typography>
              </Box>

              {expense.taxAmount && expense.taxAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tax Amount
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(expense.taxAmount)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Total Amount
                </Typography>
                <Typography variant="h5" color="primary" fontWeight={600}>
                  {formatCurrency(expense.totalAmount)}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`Payment: ${getPaymentStatusLabel(expense.paymentStatus)}`}
                  sx={{
                    backgroundColor: alpha(EXPENSE_PAYMENT_STATUS_COLORS[expense.paymentStatus], 0.15),
                    color: EXPENSE_PAYMENT_STATUS_COLORS[expense.paymentStatus],
                    fontWeight: 500,
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity
              </Typography>
              <Box sx={{ pl: 2, borderLeft: `2px solid ${theme.palette.divider}` }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={500}>
                    Created
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(expense.createdAt)}
                  </Typography>
                </Box>
                {expense.status === 'submitted' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Submitted for Approval
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending review
                    </Typography>
                  </Box>
                )}
                {expense.status === 'approved' && expense.approvedAt && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500} color="success.main">
                      Approved
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(expense.approvedAt)}
                    </Typography>
                  </Box>
                )}
                {expense.status === 'rejected' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500} color="error.main">
                      Rejected
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approve Dialog */}
      <ConfirmDialog
        open={approveDialogOpen}
        title="Approve Expense"
        message={`Are you sure you want to approve expense ${expense.expenseNumber} for ${formatCurrency(expense.totalAmount)}?`}
        confirmLabel="Approve"
        onConfirm={handleApprove}
        onCancel={() => setApproveDialogOpen(false)}
        confirmColor="primary"
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        open={rejectDialogOpen}
        title="Reject Expense"
        message={`Are you sure you want to reject expense ${expense.expenseNumber}?`}
        confirmLabel="Reject"
        onConfirm={handleReject}
        onCancel={() => setRejectDialogOpen(false)}
        confirmColor="error"
      />
    </Box>
  );
};

export default ExpenseDetailPage;
