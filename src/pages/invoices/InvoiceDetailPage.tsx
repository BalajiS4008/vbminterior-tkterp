import React, { useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { PageHeader, StatusChip, EmptyState, LoadingSpinner, ConfirmDialog } from '../../components/common';
import { useAuth, useNotification } from '../../contexts';
import { useRealtimeDocument } from '../../hooks';
import { ROUTES, PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_COLORS } from '../../config/constants';
import { formatDate, formatCurrency } from '../../utils';
import { paymentService } from '../../services';
import type { Invoice, DocumentStatus, Payment, PaymentStatus } from '../../types';
import type { DocumentData } from 'firebase/firestore';

const invoiceMapper = (doc: DocumentData): Invoice => ({
  ...doc,
  issueDate: doc.issueDate?.toDate?.() || new Date(),
  dueDate: doc.dueDate?.toDate?.() || new Date(),
  paidDate: doc.paidDate?.toDate?.() || null,
  createdAt: doc.createdAt?.toDate?.() || new Date(),
  updatedAt: doc.updatedAt?.toDate?.() || new Date(),
} as Invoice);

const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();

  const { data: invoice, loading, error } = useRealtimeDocument<Invoice>('invoices', id || null, invoiceMapper);

  // Payment state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentMenuAnchor, setPaymentMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch payments for this invoice
  useEffect(() => {
    const fetchPayments = async () => {
      if (!id) return;
      try {
        setPaymentsLoading(true);
        const invoicePayments = await paymentService.getByInvoiceId(id);
        setPayments(invoicePayments);
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setPaymentsLoading(false);
      }
    };
    fetchPayments();
  }, [id]);

  // Calculate payment summary
  const paymentSummary = React.useMemo(() => {
    const totalAmount = invoice?.financialSummary?.grandTotal || 0;
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceAmount = totalAmount - paidAmount;

    let status: PaymentStatus = 'unpaid';
    if (paidAmount >= totalAmount) {
      status = paidAmount > totalAmount ? 'overpaid' : 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    return { totalAmount, paidAmount, balanceAmount, status };
  }, [invoice, payments]);

  const handleEdit = () => {
    navigate(`/invoices/${id}/edit`);
  };

  const handleDownloadPdf = useCallback(() => {
    if (!invoice) return;
    const printContent = document.getElementById('invoice-preview');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .no-print { display: none; }
          </style>
          </head><body>${printContent.innerHTML}</body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    showSuccess(t('invoices.pdfGenerated') || 'PDF generated');
  }, [invoice, showSuccess, t]);

  const handleRecordPayment = () => {
    navigate(`${ROUTES.PAYMENT_CREATE}?invoiceId=${id}`);
  };

  const handlePaymentMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: Payment) => {
    event.stopPropagation();
    setPaymentMenuAnchor(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handlePaymentMenuClose = () => {
    setPaymentMenuAnchor(null);
  };

  const handleViewPayment = () => {
    if (selectedPayment) {
      navigate(`${ROUTES.PAYMENTS}/${selectedPayment.id}`);
    }
    handlePaymentMenuClose();
  };

  const handleDeletePayment = () => {
    setDeleteDialogOpen(true);
    handlePaymentMenuClose();
  };

  const confirmDeletePayment = async () => {
    if (!selectedPayment) return;
    try {
      await paymentService.delete(selectedPayment.id);
      setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
      showSuccess('Payment deleted successfully');
    } catch (err) {
      showError('Failed to delete payment');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const option = PAYMENT_METHOD_OPTIONS.find(o => o.value === method);
    return option?.labelEn || method;
  };

  if (loading) return <LoadingSpinner />;

  if (error || !invoice) {
    return (
      <Box>
        <PageHeader
          title={t('invoices.invoiceDetails')}
          breadcrumbs={[
            { label: t('invoices.title'), path: ROUTES.INVOICES },
            { label: 'Not Found' },
          ]}
        />
        <Card>
          <CardContent>
            <EmptyState
              icon={InvoiceIcon}
              title={t('common.error')}
              description={error?.message || 'Invoice not found'}
            />
          </CardContent>
        </Card>
      </Box>
    );
  }

  const paymentProgressPercent = Math.min(
    (paymentSummary.paidAmount / paymentSummary.totalAmount) * 100,
    100
  );

  return (
    <Box>
      <PageHeader
        title={invoice.invoiceNumber}
        breadcrumbs={[
          { label: t('invoices.title'), path: ROUTES.INVOICES },
          { label: invoice.invoiceNumber },
        ]}
      />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleDownloadPdf}>
          {t('invoices.downloadPdf')}
        </Button>
        {hasPermission('invoices.edit') && (
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
            {t('common.edit')}
          </Button>
        )}
        {paymentSummary.status !== 'paid' && paymentSummary.status !== 'overpaid' && (
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={handleRecordPayment}
            color="success"
          >
            Record Payment
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Invoice Preview */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: 4 }} id="invoice-preview">
              {/* Header */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="h5" fontWeight={600} color="primary">
                    {invoice.businessDetails?.companyName || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {invoice.businessDetails?.address || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {invoice.businessDetails?.phone || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {invoice.businessDetails?.email || '-'}
                  </Typography>
                  {invoice.businessDetails?.gstNumber && (
                    <Typography variant="body2" color="text.secondary">
                      GST: {invoice.businessDetails.gstNumber}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { sm: 'right' } }}>
                  <Typography variant="h4" fontWeight={600} color="primary">
                    INVOICE
                  </Typography>
                  <Typography variant="h6">{invoice.invoiceNumber}</Typography>
                  <Box sx={{ mt: 2 }}>
                    <StatusChip
                      type="document"
                      value={invoice.status as DocumentStatus}
                      label={t(`invoices.status.${invoice.status}`)}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Client & Dates */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Bill To
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {invoice.clientDetails?.name || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {invoice.clientDetails?.address || '-'}
                  </Typography>
                  {invoice.clientDetails?.phone && (
                    <Typography variant="body2" color="text.secondary">
                      {invoice.clientDetails.phone}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { sm: 'right' } }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Issue Date: <strong>{formatDate(invoice.issueDate)}</strong>
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Due Date: <strong>{formatDate(invoice.dueDate)}</strong>
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Line Items Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                      <TableCell>{t('invoices.lineItems.itemName')}</TableCell>
                      <TableCell>{t('invoices.lineItems.description')}</TableCell>
                      <TableCell align="right">{t('invoices.lineItems.quantity')}</TableCell>
                      <TableCell align="right">{t('invoices.lineItems.unitPrice')}</TableCell>
                      <TableCell align="right">{t('invoices.lineItems.total')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(invoice.lineItems || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                        <TableCell align="right">
                          {item.quantity} {item.unit || ''}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Box sx={{ width: 300 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography>{t('invoices.summary.subtotal')}</Typography>
                    <Typography>{formatCurrency(invoice.financialSummary?.subtotal || 0)}</Typography>
                  </Box>
                  {invoice.financialSummary?.discountAmount ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                      <Typography>
                        {t('invoices.summary.discount')} ({invoice.financialSummary.discountPercent}%)
                      </Typography>
                      <Typography color="error">
                        -{formatCurrency(invoice.financialSummary.discountAmount)}
                      </Typography>
                    </Box>
                  ) : null}
                  {invoice.financialSummary?.taxAmount ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                      <Typography>
                        {t('invoices.summary.tax')} ({invoice.financialSummary.taxPercent}%)
                      </Typography>
                      <Typography>{formatCurrency(invoice.financialSummary.taxAmount)}</Typography>
                    </Box>
                  ) : null}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="h6">{t('invoices.summary.grandTotal')}</Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(invoice.financialSummary?.grandTotal || 0)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Notes */}
              {(invoice.notes || invoice.termsAndConditions) && (
                <Box sx={{ mt: 4 }}>
                  <Divider sx={{ mb: 3 }} />
                  {invoice.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {invoice.notes}
                      </Typography>
                    </Box>
                  )}
                  {invoice.termsAndConditions && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Terms & Conditions
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {invoice.termsAndConditions}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Summary Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Payment Status Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Payment Status</Typography>
                <Chip
                  label={paymentSummary.status.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: alpha(PAYMENT_STATUS_COLORS[paymentSummary.status], 0.15),
                    color: PAYMENT_STATUS_COLORS[paymentSummary.status],
                    fontWeight: 600,
                  }}
                />
              </Box>

              {/* Progress Bar */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(paymentProgressPercent)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={paymentProgressPercent}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: alpha(PAYMENT_STATUS_COLORS[paymentSummary.status], 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: PAYMENT_STATUS_COLORS[paymentSummary.status],
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>

              {/* Amount Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {formatCurrency(paymentSummary.totalAmount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Paid Amount
                </Typography>
                <Typography variant="body1" fontWeight={500} color="success.main">
                  {formatCurrency(paymentSummary.paidAmount)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  Balance Due
                </Typography>
                <Typography
                  variant="h6"
                  color={paymentSummary.balanceAmount > 0 ? 'error.main' : 'success.main'}
                >
                  {formatCurrency(Math.max(0, paymentSummary.balanceAmount))}
                </Typography>
              </Box>

              {/* Record Payment Button */}
              {paymentSummary.status !== 'paid' && paymentSummary.status !== 'overpaid' && (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={handleRecordPayment}
                  sx={{ mt: 2 }}
                  color="success"
                >
                  Record Payment
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment History Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Payment History
              </Typography>

              {paymentsLoading ? (
                <Box sx={{ py: 2 }}>
                  <LinearProgress />
                </Box>
              ) : payments.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <PaymentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No payments recorded yet
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {payments.map((payment, index) => (
                    <ListItem
                      key={payment.id}
                      sx={{
                        px: 0,
                        borderBottom:
                          index < payments.length - 1
                            ? `1px solid ${theme.palette.divider}`
                            : 'none',
                      }}
                      secondaryAction={
                        <IconButton
                          size="small"
                          onClick={(e) => handlePaymentMenuOpen(e, payment)}
                        >
                          <MoreIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <PaymentIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight={500}>
                              {payment.paymentNumber}
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              {formatCurrency(payment.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mt: 0.5,
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(payment.paymentDate)}
                            </Typography>
                            <Chip
                              label={getPaymentMethodLabel(payment.paymentMethod)}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {/* View All Payments */}
              {payments.length > 0 && (
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => navigate(`${ROUTES.PAYMENTS}?invoiceId=${id}`)}
                  sx={{ mt: 2 }}
                >
                  View All Payments
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Menu */}
      <Menu
        anchorEl={paymentMenuAnchor}
        open={Boolean(paymentMenuAnchor)}
        onClose={handlePaymentMenuClose}
      >
        <MenuItem onClick={handleViewPayment}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={handleDeletePayment} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Payment"
        message={`Are you sure you want to delete payment ${selectedPayment?.paymentNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDeletePayment}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedPayment(null);
        }}
        confirmColor="error"
      />
    </Box>
  );
};

export default InvoiceDetailPage;
