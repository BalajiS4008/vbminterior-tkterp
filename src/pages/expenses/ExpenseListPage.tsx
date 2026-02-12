import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Receipt as ExpenseIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { PageHeader, EmptyState, LoadingSpinner, ConfirmDialog } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES, EXPENSE_CATEGORY_OPTIONS, EXPENSE_STATUS_OPTIONS } from '../../config/constants';
import { formatDate, formatCurrency } from '../../utils';
import { expenseService } from '../../services';
import type { Expense, ExpenseCategory, ExpenseStatus } from '../../types';

const EXPENSE_STATUS_COLORS: Record<ExpenseStatus, string> = {
  draft: '#9E9E9E',
  submitted: '#2196F3',
  approved: '#4CAF50',
  rejected: '#F44336',
};

const ExpenseListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const expenseResult = await expenseService.getAll(
          projectIdParam ? { projectId: projectIdParam } : undefined
        );
        setExpenses(expenseResult.expenses);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        showError('Failed to load expenses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectIdParam, showError]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expense: Expense) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleView = () => {
    if (selectedExpense) {
      navigate(`${ROUTES.EXPENSES}/${selectedExpense.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedExpense) {
      navigate(`${ROUTES.EXPENSES}/${selectedExpense.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!selectedExpense) return;
    try {
      await expenseService.delete(selectedExpense.id);
      setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      showSuccess('Expense deleted successfully');
    } catch (error) {
      showError('Failed to delete expense');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
    }
  };

  const handleApprove = async () => {
    if (!selectedExpense || !userData?.id) return;
    try {
      const updated = await expenseService.approve(selectedExpense.id, userData.id);
      setExpenses(prev => prev.map(e => (e.id === updated.id ? updated : e)));
      showSuccess('Expense approved');
    } catch (error) {
      showError('Failed to approve expense');
    }
    handleMenuClose();
  };

  const handleReject = async () => {
    if (!selectedExpense) return;
    try {
      const updated = await expenseService.reject(selectedExpense.id);
      setExpenses(prev => prev.map(e => (e.id === updated.id ? updated : e)));
      showSuccess('Expense rejected');
    } catch (error) {
      showError('Failed to reject expense');
    }
    handleMenuClose();
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch =
      !searchQuery ||
      expense.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.projectName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    const matchesStatus = !statusFilter || expense.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const paginatedExpenses = filteredExpenses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getCategoryLabel = (category: ExpenseCategory) => {
    const option = EXPENSE_CATEGORY_OPTIONS.find(o => o.value === category);
    return option?.labelEn || category;
  };

  const getStatusLabel = (status: ExpenseStatus) => {
    const option = EXPENSE_STATUS_OPTIONS.find(o => o.value === status);
    return option?.labelEn || status;
  };

  // Financial summary for filtered expenses
  const expenseSummary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const approved = filteredExpenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    const pending = filteredExpenses
      .filter(e => e.status === 'submitted')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    const draft = filteredExpenses
      .filter(e => e.status === 'draft')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    const approvedCount = filteredExpenses.filter(e => e.status === 'approved').length;
    const pendingCount = filteredExpenses.filter(e => e.status === 'submitted').length;
    const draftCount = filteredExpenses.filter(e => e.status === 'draft').length;
    return { total, approved, pending, draft, approvedCount, pendingCount, draftCount };
  }, [filteredExpenses]);

  if (loading) return <LoadingSpinner />;

  // Mobile card view
  const MobileCardView = () => (
    <Stack spacing={2}>
      {paginatedExpenses.map(expense => (
        <Card
          key={expense.id}
          sx={{
            cursor: 'pointer',
            '&:hover': { boxShadow: theme.shadows[4] },
          }}
          onClick={() => navigate(`${ROUTES.EXPENSES}/${expense.id}`)}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {expense.expenseNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                  {expense.description}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, expense)}
              >
                <MoreIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Chip
                label={getCategoryLabel(expense.category)}
                size="small"
                variant="outlined"
              />
              <Chip
                label={getStatusLabel(expense.status)}
                size="small"
                sx={{
                  backgroundColor: alpha(EXPENSE_STATUS_COLORS[expense.status], 0.15),
                  color: EXPENSE_STATUS_COLORS[expense.status],
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {formatDate(expense.expenseDate)}
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(expense.totalAmount)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  return (
    <Box>
      <PageHeader
        title="Expenses"
        subtitle={`${filteredExpenses.length} expenses`}
        actionLabel="Add Expense"
        actionIcon={<AddIcon />}
        onAction={() => navigate(ROUTES.EXPENSE_CREATE)}
      />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {EXPENSE_CATEGORY_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.labelEn}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {EXPENSE_STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.labelEn}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      {filteredExpenses.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
                <Typography variant="h6" fontWeight={600}>
                  {formatCurrency(expenseSummary.total)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary">Approved</Typography>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  {formatCurrency(expenseSummary.approved)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {expenseSummary.approvedCount} expense{expenseSummary.approvedCount !== 1 ? 's' : ''}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary">Pending Approval</Typography>
                <Typography variant="h6" fontWeight={600} color="info.main">
                  {formatCurrency(expenseSummary.pending)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {expenseSummary.pendingCount} expense{expenseSummary.pendingCount !== 1 ? 's' : ''}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary">Draft</Typography>
                <Typography variant="h6" fontWeight={600} color="text.secondary">
                  {formatCurrency(expenseSummary.draft)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {expenseSummary.draftCount} expense{expenseSummary.draftCount !== 1 ? 's' : ''}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ExpenseIcon}
              title="No Expenses Found"
              description={searchQuery || categoryFilter || statusFilter
                ? "No expenses match your filters"
                : "Start tracking expenses by adding your first one"}
              actionLabel="Add Expense"
              onAction={() => navigate(ROUTES.EXPENSE_CREATE)}
            />
          </CardContent>
        </Card>
      ) : isMobile ? (
        <MobileCardView />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Expense #</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedExpenses.map(expense => (
                  <TableRow
                    key={expense.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`${ROUTES.EXPENSES}/${expense.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {expense.expenseNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {expense.description}
                      </Typography>
                      {expense.vendorName && (
                        <Typography variant="caption" color="text.secondary">
                          {expense.vendorName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryLabel(expense.category)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {expense.projectName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(expense.expenseDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(expense.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(expense.status)}
                        size="small"
                        sx={{
                          backgroundColor: alpha(EXPENSE_STATUS_COLORS[expense.status], 0.15),
                          color: EXPENSE_STATUS_COLORS[expense.status],
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, expense)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredExpenses.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        {selectedExpense?.status === 'draft' && (
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
        )}
        {selectedExpense?.status === 'submitted' && (
          <>
            <MenuItem onClick={handleApprove}>
              <ApproveIcon sx={{ mr: 1 }} fontSize="small" color="success" />
              Approve
            </MenuItem>
            <MenuItem onClick={handleReject}>
              <RejectIcon sx={{ mr: 1 }} fontSize="small" color="error" />
              Reject
            </MenuItem>
          </>
        )}
        {selectedExpense?.status === 'draft' && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Expense"
        message={`Are you sure you want to delete expense ${selectedExpense?.expenseNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedExpense(null);
        }}
        confirmColor="error"
      />
    </Box>
  );
};

export default ExpenseListPage;
