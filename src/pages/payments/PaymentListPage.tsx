import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { PageHeader, EmptyState, ConfirmDialog, LoadingSpinner } from '../../components/common';
import { useNotification } from '../../contexts';
import { useDebounce } from '../../hooks';
import { ROUTES, DEFAULT_PAGE_SIZE, PAYMENT_METHOD_OPTIONS } from '../../config/constants';
import { formatCurrency, formatDate } from '../../utils';
import { paymentService } from '../../services';
import type { Payment, PaymentMethod } from '../../types';

const PaymentListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError } = useNotification();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { payments: fetchedPayments } = await paymentService.getAll();
      setPayments(fetchedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = useMemo(() =>
    payments.filter(
      (payment) =>
        payment.paymentNumber?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        payment.invoiceNumber?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        payment.clientName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        payment.referenceNumber?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ),
    [payments, debouncedSearchQuery]
  );

  const paginatedPayments = useMemo(() =>
    filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredPayments, page, rowsPerPage]
  );

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, payment: Payment) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedPayment(null);
  }, []);

  const handleView = useCallback(() => {
    if (selectedPayment) {
      navigate(`/payments/${selectedPayment.id}`);
    }
    handleMenuClose();
  }, [selectedPayment, navigate, handleMenuClose]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedPayment) return;

    try {
      await paymentService.delete(selectedPayment.id);
      showSuccess('Payment deleted successfully');
      fetchPayments();
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete payment');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    }
  }, [selectedPayment, showSuccess, showError]);

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const option = PAYMENT_METHOD_OPTIONS.find(o => o.value === method);
    return option?.labelEn || method;
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    const colors: Record<PaymentMethod, string> = {
      cash: '#4CAF50',
      cheque: '#2196F3',
      bank_transfer: '#9C27B0',
      upi: '#FF9800',
      card: '#E91E63',
      other: '#607D8B',
    };
    return colors[method] || '#9E9E9E';
  };

  const renderMobileCard = (payment: Payment) => (
    <Card
      key={payment.id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={() => navigate(`/payments/${payment.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} color="primary">
              {payment.paymentNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {payment.clientName}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, payment)}
          >
            <MoreIcon />
          </IconButton>
        </Box>

        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Invoice: {payment.invoiceNumber}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip
              label={getPaymentMethodLabel(payment.paymentMethod)}
              size="small"
              sx={{
                bgcolor: alpha(getPaymentMethodColor(payment.paymentMethod), 0.1),
                color: getPaymentMethodColor(payment.paymentMethod),
                fontWeight: 500,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatDate(payment.paymentDate)}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" fontWeight={700} color="success.main">
            {formatCurrency(payment.amount)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <PageHeader
        title="Payments"
        subtitle={`${payments.length} payments recorded`}
        actionLabel="Record Payment"
        onAction={() => navigate(ROUTES.PAYMENT_CREATE)}
      />

      <Card>
        <CardContent>
          {/* Search */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ width: { xs: '100%', sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={PaymentIcon}
              title="No payments found"
              description="No payments found matching your criteria"
              actionLabel="Record Payment"
              onAction={() => navigate(ROUTES.PAYMENT_CREATE)}
            />
          ) : isMobile ? (
            // Mobile Card View
            <Box>
              {paginatedPayments.map(renderMobileCard)}
              <TablePagination
                component="div"
                count={filteredPayments.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Box>
          ) : (
            // Desktop Table View
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment #</TableCell>
                      <TableCell>Invoice</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPayments.map((payment) => (
                      <TableRow
                        key={payment.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/payments/${payment.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} color="primary">
                            {payment.paymentNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {payment.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {payment.clientName}
                          </Typography>
                          {payment.projectName && (
                            <Typography variant="caption" color="text.secondary">
                              {payment.projectName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(payment.paymentDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPaymentMethodLabel(payment.paymentMethod)}
                            size="small"
                            sx={{
                              bgcolor: alpha(getPaymentMethodColor(payment.paymentMethod), 0.1),
                              color: getPaymentMethodColor(payment.paymentMethod),
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {formatCurrency(payment.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, payment)}
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
                count={filteredPayments.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          View Receipt
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Payment"
        message={`Are you sure you want to delete payment "${selectedPayment?.paymentNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedPayment(null);
        }}
      />
    </Box>
  );
};

export default PaymentListPage;
