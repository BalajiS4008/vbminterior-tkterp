import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  Avatar,
  Divider,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Receipt as InvoiceIcon,
  Business as BusinessIcon,
  Person as ClientIcon,
  Description as DescriptionIcon,
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  LocalOffer as DiscountIcon,
  Folder as ProjectIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as AddressIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES, INVOICE_STATUS_OPTIONS, PAYMENT_TERMS_OPTIONS } from '../../config/constants';
import { invoiceService, projectService, clientService } from '../../services';
import type { Project, Client } from '../../types';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

const steps = ['Invoice Details', 'Line Items', 'Preview & Submit'];

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  amount: number;
}

const InvoiceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const isEdit = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    projectId: '',
    clientId: '',
    status: 'draft' as InvoiceStatus,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    paymentTerms: 'net30',
    notes: '',
    termsAndConditions: '',
    taxRate: 18, // GST default
    discountPercent: 0,
    discountAmount: 0,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, unit: 'unit', amount: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch projects and clients
  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      try {
        const [projectsData, clientsData] = await Promise.all([
          projectService.getAll(),
          clientService.getAll(),
        ]);
        setProjects(projectsData.projects);
        setClients(clientsData.clients);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  // Generate invoice number
  useEffect(() => {
    if (!isEdit && !formData.invoiceNumber) {
      const timestamp = Date.now().toString().slice(-6);
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: `INV-${new Date().getFullYear()}-${timestamp}`,
      }));
    }
  }, [isEdit, formData.invoiceNumber]);

  // Update selected client when clientId changes
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find((c) => c.id === formData.clientId);
      setSelectedClient(client || null);
    }
  }, [formData.clientId, clients]);

  // Update selected project when projectId changes
  useEffect(() => {
    if (formData.projectId) {
      const project = projects.find((p) => p.id === formData.projectId);
      setSelectedProject(project || null);
      // Auto-select client from project
      if (project?.clientId) {
        setFormData((prev) => ({ ...prev, clientId: project.clientId || '' }));
      }
    }
  }, [formData.projectId, projects]);

  // Calculate line item amounts
  const calculateLineItemAmount = (item: LineItem): number => {
    return item.quantity * item.unitPrice;
  };

  // Calculate totals
  const calculateSubtotal = (): number => {
    return lineItems.reduce((sum, item) => sum + calculateLineItemAmount(item), 0);
  };

  const calculateDiscount = (): number => {
    const subtotal = calculateSubtotal();
    if (formData.discountPercent > 0) {
      return (subtotal * formData.discountPercent) / 100;
    }
    return formData.discountAmount;
  };

  const calculateTax = (): number => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return ((subtotal - discount) * formData.taxRate) / 100;
  };

  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleNumberChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string) => (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({ ...prev, [field]: date }));
    }
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        unit: 'unit',
        amount: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleLineItemChange = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          updated.amount = updated.quantity * updated.unitPrice;
          return updated;
        }
        return item;
      })
    );
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.projectId) {
        newErrors.projectId = t('validation.required');
      }
      if (!formData.clientId) {
        newErrors.clientId = t('validation.required');
      }
      if (!formData.issueDate) {
        newErrors.issueDate = t('validation.required');
      }
      if (!formData.dueDate) {
        newErrors.dueDate = t('validation.required');
      }
    }

    if (step === 1) {
      const hasValidItems = lineItems.some(
        (item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0
      );
      if (!hasValidItems) {
        newErrors.lineItems = 'At least one line item with valid details is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);

    try {
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        projectId: formData.projectId,
        projectName: selectedProject?.name || '',
        clientId: formData.clientId,
        clientName: selectedClient?.name || '',
        status: formData.status,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        paymentTerms: formData.paymentTerms,
        items: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          amount: item.amount,
        })),
        subtotal: calculateSubtotal(),
        taxRate: formData.taxRate,
        taxAmount: calculateTax(),
        discountPercent: formData.discountPercent,
        discountAmount: calculateDiscount(),
        total: calculateTotal(),
        notes: formData.notes,
        termsAndConditions: formData.termsAndConditions,
        createdBy: userData?.id || '',
      };

      if (isEdit && id) {
        await invoiceService.updateInvoice(id, invoiceData as any);
        showSuccess(t('invoices.updateSuccess') || 'Invoice updated successfully');
      } else {
        await invoiceService.createInvoice(invoiceData as any);
        showSuccess(t('invoices.createSuccess') || 'Invoice created successfully');
      }

      navigate(ROUTES.INVOICES);
    } catch (error: any) {
      showError(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.INVOICES);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {/* Invoice Number */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('invoices.invoiceNumber')}
                value={formData.invoiceNumber}
                onChange={handleChange('invoiceNumber')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InvoiceIcon color="primary" />
                    </InputAdornment>
                  ),
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Status */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label={t('common.status')}
                value={formData.status}
                onChange={handleChange('status')}
              >
                {INVOICE_STATUS_OPTIONS.map((statusOption) => (
                  <MenuItem key={statusOption.value} value={statusOption.value}>
                    {statusOption.labelEn}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Project Selection */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label={t('invoices.project')}
                value={formData.projectId}
                onChange={handleChange('projectId')}
                error={Boolean(errors.projectId)}
                helperText={errors.projectId}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ProjectIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={project.status}
                        size="small"
                        color={(project.status as string) === 'active' ? 'success' : 'default'}
                        sx={{ height: 20 }}
                      />
                      {project.name}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Client Selection */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label={t('invoices.client')}
                value={formData.clientId}
                onChange={handleChange('clientId')}
                error={Boolean(errors.clientId)}
                helperText={errors.clientId}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ClientIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Issue Date */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label={t('invoices.issueDate')}
                value={formData.issueDate}
                onChange={handleDateChange('issueDate')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="primary" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Grid>

            {/* Due Date */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label={t('invoices.dueDate')}
                value={formData.dueDate}
                onChange={handleDateChange('dueDate')}
                minDate={formData.issueDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="primary" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Grid>

            {/* Payment Terms */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Payment Terms"
                value={formData.paymentTerms}
                onChange={handleChange('paymentTerms')}
              >
                {PAYMENT_TERMS_OPTIONS.map((termOption) => (
                  <MenuItem key={termOption.value} value={termOption.value}>
                    {termOption.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Tax Rate */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                type="number"
                value={formData.taxRate}
                onChange={handleNumberChange('taxRate')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalculateIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>

            {/* Selected Client Info */}
            {selectedClient && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: 1, borderColor: 'info.light' }}>
                  <Typography variant="subtitle2" color="info.main" gutterBottom>
                    Client Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedClient.name}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedClient.email}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedClient.phone}</Typography>
                      </Box>
                    </Grid>
                    {selectedClient.address && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AddressIcon fontSize="small" color="action" />
                          <Typography variant="body2">{selectedClient.address}</Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            {/* Line Items Table */}
            <Grid size={{ xs: 12 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: 150 }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: 150 }}>Amount</TableCell>
                      <TableCell sx={{ width: 60 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Enter item description"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={item.unit}
                            onChange={(e) => handleLineItemChange(item.id, 'unit', e.target.value)}
                            fullWidth
                          >
                            <MenuItem value="unit">Unit</MenuItem>
                            <MenuItem value="sqft">Sq. Ft.</MenuItem>
                            <MenuItem value="sqm">Sq. M.</MenuItem>
                            <MenuItem value="hours">Hours</MenuItem>
                            <MenuItem value="days">Days</MenuItem>
                            <MenuItem value="lot">Lot</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                            inputProps={{ min: 0, step: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(calculateLineItemAmount(item))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveLineItem(item.id)}
                            disabled={lineItems.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {errors.lineItems && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {errors.lineItems}
                </Typography>
              )}

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddLineItem}
                sx={{ mt: 2 }}
              >
                Add Line Item
              </Button>
            </Grid>

            {/* Discount Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DiscountIcon color="primary" />
                  Discount
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Discount %"
                      type="number"
                      value={formData.discountPercent}
                      onChange={handleNumberChange('discountPercent')}
                      disabled={formData.discountAmount > 0}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Flat Discount"
                      type="number"
                      value={formData.discountAmount}
                      onChange={handleNumberChange('discountAmount')}
                      disabled={formData.discountPercent > 0}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Summary Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalculateIcon color="primary" />
                  Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(calculateSubtotal())}</Typography>
                  </Box>
                  {calculateDiscount() > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                      <Typography variant="body2">Discount:</Typography>
                      <Typography variant="body2">-{formatCurrency(calculateDiscount())}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tax ({formData.taxRate}%):</Typography>
                    <Typography variant="body2">{formatCurrency(calculateTax())}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      {formatCurrency(calculateTotal())}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={handleChange('notes')}
                multiline
                rows={3}
                placeholder="Any additional notes for the client..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                      <DescriptionIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            {/* Invoice Preview */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      INVOICE
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      #{formData.invoiceNumber}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={formData.status.toUpperCase()}
                      color={formData.status === 'paid' ? 'success' : formData.status === 'sent' ? 'info' : 'warning'}
                    />
                  </Box>
                </Box>

                <Grid container spacing={4}>
                  {/* Bill To */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      BILL TO
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedClient?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2">{selectedClient?.email}</Typography>
                    <Typography variant="body2">{selectedClient?.phone}</Typography>
                    <Typography variant="body2">{selectedClient?.address}</Typography>
                  </Grid>

                  {/* Invoice Details */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ textAlign: { md: 'right' } }}>
                      <Typography variant="body2">
                        <strong>Issue Date:</strong> {formData.issueDate.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Due Date:</strong> {formData.dueDate.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Project:</strong> {selectedProject?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Line Items */}
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Qty</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Unit Price</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lineItems
                        .filter((item) => item.description.trim())
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell align="right">{item.quantity} {item.unit}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(calculateLineItemAmount(item))}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Totals */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Box sx={{ width: 300 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Subtotal:</Typography>
                      <Typography>{formatCurrency(calculateSubtotal())}</Typography>
                    </Box>
                    {calculateDiscount() > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                        <Typography>Discount:</Typography>
                        <Typography>-{formatCurrency(calculateDiscount())}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Tax ({formData.taxRate}%):</Typography>
                      <Typography>{formatCurrency(calculateTax())}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">Total:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatCurrency(calculateTotal())}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Notes */}
                {formData.notes && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      NOTES
                    </Typography>
                    <Typography variant="body2">{formData.notes}</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Confirmation Alert */}
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" icon={<PreviewIcon />}>
                <Typography variant="subtitle2">Ready to Submit</Typography>
                <Typography variant="body2">
                  Please review the invoice details above. Once submitted, you can still edit the invoice
                  or change its status from the invoices list.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (fetchingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <PageHeader
          title={isEdit ? t('invoices.editInvoice') : t('invoices.createInvoice')}
          breadcrumbs={[
            { label: t('invoices.title'), path: ROUTES.INVOICES },
            { label: isEdit ? t('invoices.editInvoice') : t('invoices.createInvoice') },
          ]}
        />

        <Card sx={{ overflow: 'visible' }}>
          {/* Premium Header with Stepper */}
          <Box
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'rgba(255,255,255,0.2)',
                }}
              >
                <InvoiceIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {isEdit ? 'Update invoice details' : 'Generate a professional invoice'}
                </Typography>
              </Box>
            </Box>

            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                '& .MuiStepLabel-label': {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-active': { color: 'white', fontWeight: 'bold' },
                  '&.Mui-completed': { color: 'white' },
                },
                '& .MuiStepIcon-root': {
                  color: 'rgba(255,255,255,0.3)',
                  '&.Mui-active': { color: 'white' },
                  '&.Mui-completed': { color: 'white' },
                },
              }}
            >
              {steps.map((label, index) => (
                <Step key={label} completed={index < activeStep}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Form Content */}
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              {renderStepContent(activeStep)}

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={activeStep === 0 ? handleCancel : handleBack}
                >
                  {activeStep === 0 ? t('common.cancel') : 'Back'}
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {activeStep < steps.length - 1 ? (
                    <Button
                      variant="contained"
                      endIcon={<NextIcon />}
                      onClick={handleNext}
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                      }}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      disabled={loading}
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                        px: 4,
                      }}
                    >
                      {loading ? t('common.loading') : isEdit ? 'Update Invoice' : 'Create Invoice'}
                    </Button>
                  )}
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default InvoiceFormPage;
