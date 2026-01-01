import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Button,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as BankIcon,
  Description as NoteIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { ROUTES, PAYMENT_METHOD_OPTIONS } from '../../config/constants';
import { formatDate, formatCurrency } from '../../utils';
import { paymentService } from '../../services';
import type { Payment, PaymentMethod } from '../../types';

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
      <Typography variant="body2">{value || '-'}</Typography>
    </Box>
  </Box>
);

const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const paymentData = await paymentService.getById(id);
        setPayment(paymentData);
      } catch (error) {
        console.error('Error fetching payment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [id]);

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!payment) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Payment not found
        </Typography>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate(ROUTES.PAYMENTS)}
          sx={{ mt: 2 }}
        >
          Back to Payments
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Payment Receipt"
        breadcrumbs={[
          { label: 'Payments', path: ROUTES.PAYMENTS },
          { label: payment.paymentNumber },
        ]}
      />

      <Grid container spacing={3}>
        {/* Receipt Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            id="payment-receipt"
            sx={{
              '@media print': {
                boxShadow: 'none',
                border: '1px solid #ddd',
              },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Receipt Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                  Payment Receipt
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {payment.paymentNumber}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Amount Section */}
              <Box
                sx={{
                  textAlign: 'center',
                  p: 4,
                  mb: 4,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Amount Received
                </Typography>
                <Typography variant="h3" fontWeight={700} color="success.main">
                  {formatCurrency(payment.amount)}
                </Typography>
                <Chip
                  label={getPaymentMethodLabel(payment.paymentMethod)}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: alpha(getPaymentMethodColor(payment.paymentMethod), 0.1),
                    color: getPaymentMethodColor(payment.paymentMethod),
                    fontWeight: 500,
                  }}
                />
              </Box>

              {/* Details Grid */}
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Payment Information
                  </Typography>
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                    <DetailRow
                      icon={<CalendarIcon fontSize="small" />}
                      label="Payment Date"
                      value={formatDate(payment.paymentDate)}
                    />
                    <DetailRow
                      icon={<PaymentIcon fontSize="small" />}
                      label="Payment Method"
                      value={getPaymentMethodLabel(payment.paymentMethod)}
                    />
                    {payment.referenceNumber && (
                      <DetailRow
                        icon={<ReceiptIcon fontSize="small" />}
                        label="Reference Number"
                        value={payment.referenceNumber}
                      />
                    )}
                    {payment.bankName && (
                      <DetailRow
                        icon={<BankIcon fontSize="small" />}
                        label="Bank Name"
                        value={payment.bankName}
                      />
                    )}
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Invoice & Client Details
                  </Typography>
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                    <DetailRow
                      icon={<ReceiptIcon fontSize="small" />}
                      label="Invoice Number"
                      value={
                        <Typography
                          variant="body2"
                          color="primary"
                          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => navigate(`/invoices/${payment.invoiceId}`)}
                        >
                          {payment.invoiceNumber}
                        </Typography>
                      }
                    />
                    <DetailRow
                      icon={<PersonIcon fontSize="small" />}
                      label="Client"
                      value={payment.clientName}
                    />
                    {payment.projectName && (
                      <DetailRow
                        icon={<ReceiptIcon fontSize="small" />}
                        label="Project"
                        value={payment.projectName}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Notes */}
              {payment.notes && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                    <DetailRow
                      icon={<NoteIcon fontSize="small" />}
                      label="Notes"
                      value={payment.notes}
                    />
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 4 }} />

              {/* Footer */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Received By
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {payment.receivedBy}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    Receipt Generated On
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(payment.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ '@media print': { display: 'none' } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>

              <Button
                fullWidth
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ mb: 2 }}
              >
                Print Receipt
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={() => navigate(ROUTES.PAYMENTS)}
              >
                Back to Payments
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ mt: 3, '@media print': { display: 'none' } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Info
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Number
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {payment.paymentNumber}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Invoice
                </Typography>
                <Typography variant="body2" fontWeight={500} color="primary">
                  {payment.invoiceNumber}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {formatCurrency(payment.amount)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body2">
                  {formatDate(payment.paymentDate)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentDetailPage;
