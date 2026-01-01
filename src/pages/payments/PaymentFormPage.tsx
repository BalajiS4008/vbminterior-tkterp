import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Typography,
  InputAdornment,
  Divider,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PageHeader } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES, PAYMENT_METHOD_OPTIONS } from '../../config/constants';
import { formatCurrency } from '../../utils';
import { paymentService, invoiceService } from '../../services';
import type { PaymentMethod } from '../../types';

interface InvoiceOption {
  id: string;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

const PaymentFormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('invoiceId');

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const [formData, setFormData] = useState({
    invoiceId: invoiceIdParam || '',
    amount: '',
    paymentDate: new Date(),
    paymentMethod: 'bank_transfer' as PaymentMethod,
    referenceNumber: '',
    bankName: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOption | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (formData.invoiceId) {
      const invoice = invoices.find(i => i.id === formData.invoiceId);
      setSelectedInvoice(invoice || null);
    } else {
      setSelectedInvoice(null);
    }
  }, [formData.invoiceId, invoices]);

  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const { invoices: allInvoices } = await invoiceService.getAllInvoices();

      // Calculate payment summary for each invoice
      const invoiceOptions: InvoiceOption[] = await Promise.all(
        allInvoices
          .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
          .map(async (inv) => {
            const payments = await paymentService.getByInvoiceId(inv.id);
            const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
            const totalAmount = inv.financialSummary.grandTotal;
            return {
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              clientName: inv.clientDetails.name,
              totalAmount,
              paidAmount,
              balanceAmount: totalAmount - paidAmount,
            };
          })
      );

      setInvoices(invoiceOptions.filter(i => i.balanceAmount > 0));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showError('Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({ ...prev, paymentDate: date }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceId) {
      newErrors.invoiceId = 'Please select an invoice';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (selectedInvoice && parseFloat(formData.amount) > selectedInvoice.balanceAmount) {
      newErrors.amount = `Amount cannot exceed balance of ${formatCurrency(selectedInvoice.balanceAmount)}`;
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (formData.paymentMethod === 'cheque' && !formData.referenceNumber) {
      newErrors.referenceNumber = 'Cheque number is required';
    }

    if ((formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'cheque') && !formData.bankName) {
      newErrors.bankName = 'Bank name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !selectedInvoice) return;

    setLoading(true);

    try {
      await paymentService.create({
        invoiceId: formData.invoiceId,
        invoiceNumber: selectedInvoice.invoiceNumber,
        clientId: '', // Would need to be fetched from invoice
        clientName: selectedInvoice.clientName,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
        bankName: formData.bankName || undefined,
        notes: formData.notes || undefined,
        receivedBy: userData?.displayName || 'Unknown',
        createdBy: userData?.id || 'unknown',
      });

      showSuccess('Payment recorded successfully!');
      navigate(ROUTES.PAYMENTS);
    } catch (error) {
      console.error('Payment save error:', error);
      showError('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const showBankField = formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'cheque';
  const showReferenceField = formData.paymentMethod !== 'cash';

  return (
    <Box>
      <PageHeader
        title="Record Payment"
        subtitle="Record a new payment against an invoice"
        breadcrumbs={[
          { label: 'Payments', path: ROUTES.PAYMENTS },
          { label: 'Record Payment' },
        ]}
      />

      {(loading || invoicesLoading) && <LinearProgress sx={{ mb: 2 }} />}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>

                <Grid container spacing={2}>
                  {/* Invoice Selection */}
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      select
                      label="Invoice"
                      value={formData.invoiceId}
                      onChange={handleChange('invoiceId')}
                      error={Boolean(errors.invoiceId)}
                      helperText={errors.invoiceId}
                      required
                      disabled={invoicesLoading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ReceiptIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      <MenuItem value="">Select an invoice</MenuItem>
                      {invoices.map((invoice) => (
                        <MenuItem key={invoice.id} value={invoice.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{invoice.invoiceNumber} - {invoice.clientName}</span>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                              Balance: {formatCurrency(invoice.balanceAmount)}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Invoice Summary */}
                  {selectedInvoice && (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Invoice Total:</strong> {formatCurrency(selectedInvoice.totalAmount)} |
                          <strong> Paid:</strong> {formatCurrency(selectedInvoice.paidAmount)} |
                          <strong> Balance:</strong> {formatCurrency(selectedInvoice.balanceAmount)}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* Amount */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Payment Amount"
                      value={formData.amount}
                      onChange={handleChange('amount')}
                      error={Boolean(errors.amount)}
                      helperText={errors.amount || (selectedInvoice ? `Max: ${formatCurrency(selectedInvoice.balanceAmount)}` : '')}
                      required
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PaymentIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Payment Date */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Payment Date"
                        value={formData.paymentDate}
                        onChange={handleDateChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: Boolean(errors.paymentDate),
                            helperText: errors.paymentDate,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  {/* Payment Method */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      select
                      label="Payment Method"
                      value={formData.paymentMethod}
                      onChange={handleChange('paymentMethod')}
                      required
                    >
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.labelEn}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Reference Number */}
                  {showReferenceField && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label={formData.paymentMethod === 'cheque' ? 'Cheque Number' : 'Reference Number'}
                        value={formData.referenceNumber}
                        onChange={handleChange('referenceNumber')}
                        error={Boolean(errors.referenceNumber)}
                        helperText={errors.referenceNumber}
                        required={formData.paymentMethod === 'cheque'}
                        placeholder={
                          formData.paymentMethod === 'upi' ? 'UPI Transaction ID' :
                          formData.paymentMethod === 'card' ? 'Transaction Reference' :
                          formData.paymentMethod === 'cheque' ? 'Cheque Number' :
                          'Transaction ID'
                        }
                      />
                    </Grid>
                  )}

                  {/* Bank Name */}
                  {showBankField && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={formData.bankName}
                        onChange={handleChange('bankName')}
                        error={Boolean(errors.bankName)}
                        helperText={errors.bankName}
                        required
                        placeholder="Bank name"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BankIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  )}

                  <Divider sx={{ my: 2, width: '100%' }} />

                  {/* Notes */}
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Notes"
                      value={formData.notes}
                      onChange={handleChange('notes')}
                      multiline
                      rows={3}
                      placeholder="Any additional notes about this payment..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar Actions */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading || invoicesLoading}
                  size="large"
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Saving...' : 'Record Payment'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate(ROUTES.PAYMENTS)}
                >
                  Cancel
                </Button>

                {selectedInvoice && formData.amount && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Payment Summary
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Amount</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(parseFloat(formData.amount) || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">New Balance</Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={selectedInvoice.balanceAmount - (parseFloat(formData.amount) || 0) <= 0 ? 'success.main' : 'text.primary'}
                      >
                        {formatCurrency(Math.max(0, selectedInvoice.balanceAmount - (parseFloat(formData.amount) || 0)))}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default PaymentFormPage;
