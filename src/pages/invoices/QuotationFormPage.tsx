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
  FormControlLabel,
  Switch,
  Collapse,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  RequestQuote as QuotationIcon,
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
  Event as ValidityIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES, QUOTATION_STATUS_OPTIONS } from '../../config/constants';
import { quotationService, projectService, clientService } from '../../services';
import type { Project, Client } from '../../types';

type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

const steps = ['Quotation Details', 'Line Items', 'Terms & Preview'];

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  amount: number;
}

interface ScopeOfWork {
  id: string;
  title: string;
  details: string[];
}

const QuotationFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const isEdit = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    quotationNumber: '',
    projectId: '',
    clientId: '',
    status: 'draft' as QuotationStatus,
    createdDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days validity
    subject: '',
    notes: '',
    termsAndConditions: `1. This quotation is valid for 30 days from the date of issue.
2. 50% advance payment required to commence work.
3. Balance payment upon completion.
4. Any changes to scope will be quoted separately.
5. Prices are exclusive of GST unless otherwise mentioned.`,
    taxRate: 18,
    discountPercent: 0,
    discountAmount: 0,
    includeBreakdown: true,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, unit: 'unit', amount: 0 },
  ]);

  const [scopeOfWork, setScopeOfWork] = useState<ScopeOfWork[]>([
    { id: '1', title: 'Phase 1 - Initial Work', details: [''] },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showTerms, setShowTerms] = useState(false);

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

  // Generate quotation number
  useEffect(() => {
    if (!isEdit && !formData.quotationNumber) {
      const timestamp = Date.now().toString().slice(-6);
      setFormData((prev) => ({
        ...prev,
        quotationNumber: `QT-${new Date().getFullYear()}-${timestamp}`,
      }));
    }
  }, [isEdit, formData.quotationNumber]);

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
      if ((project as any)?.clientId) {
        setFormData((prev) => ({ ...prev, clientId: (project as any).clientId }));
      }
      // Auto-fill subject from project name
      if (project?.name && !formData.subject) {
        setFormData((prev) => ({
          ...prev,
          subject: `Quotation for ${project.name}`,
        }));
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

  const handleSwitchChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.checked }));
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

  const handleAddScope = () => {
    setScopeOfWork((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: '',
        details: [''],
      },
    ]);
  };

  const handleRemoveScope = (id: string) => {
    if (scopeOfWork.length > 1) {
      setScopeOfWork((prev) => prev.filter((scope) => scope.id !== id));
    }
  };

  const handleScopeChange = (id: string, field: string, value: any) => {
    setScopeOfWork((prev) =>
      prev.map((scope) => {
        if (scope.id === id) {
          return { ...scope, [field]: value };
        }
        return scope;
      })
    );
  };

  const handleAddScopeDetail = (scopeId: string) => {
    setScopeOfWork((prev) =>
      prev.map((scope) => {
        if (scope.id === scopeId) {
          return { ...scope, details: [...scope.details, ''] };
        }
        return scope;
      })
    );
  };

  const handleScopeDetailChange = (scopeId: string, index: number, value: string) => {
    setScopeOfWork((prev) =>
      prev.map((scope) => {
        if (scope.id === scopeId) {
          const newDetails = [...scope.details];
          newDetails[index] = value;
          return { ...scope, details: newDetails };
        }
        return scope;
      })
    );
  };

  const handleRemoveScopeDetail = (scopeId: string, index: number) => {
    setScopeOfWork((prev) =>
      prev.map((scope) => {
        if (scope.id === scopeId && scope.details.length > 1) {
          const newDetails = scope.details.filter((_, i) => i !== index);
          return { ...scope, details: newDetails };
        }
        return scope;
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
      if (!formData.subject.trim()) {
        newErrors.subject = t('validation.required');
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
      const quotationData = {
        quotationNumber: formData.quotationNumber,
        projectId: formData.projectId,
        projectName: selectedProject?.name || '',
        clientId: formData.clientId,
        clientName: selectedClient?.name || '',
        status: formData.status,
        createdDate: formData.createdDate,
        validUntil: formData.validUntil,
        subject: formData.subject,
        items: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          amount: item.amount,
        })),
        scopeOfWork: scopeOfWork
          .filter((s) => s.title.trim())
          .map((s) => ({
            title: s.title,
            details: s.details.filter((d) => d.trim()),
          })),
        subtotal: calculateSubtotal(),
        taxRate: formData.taxRate,
        taxAmount: calculateTax(),
        discountPercent: formData.discountPercent,
        discountAmount: calculateDiscount(),
        total: calculateTotal(),
        notes: formData.notes,
        termsAndConditions: formData.termsAndConditions,
        includeBreakdown: formData.includeBreakdown,
        createdBy: userData?.id || '',
      };

      if (isEdit && id) {
        await quotationService.update(id, quotationData);
        showSuccess(t('quotations.updateSuccess') || 'Quotation updated successfully');
      } else {
        await quotationService.create(quotationData);
        showSuccess(t('quotations.createSuccess') || 'Quotation created successfully');
      }

      navigate(ROUTES.QUOTATIONS);
    } catch (error: any) {
      showError(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.QUOTATIONS);
  };

  const getDaysUntilExpiry = (): number => {
    const today = new Date();
    const validUntil = new Date(formData.validUntil);
    const diffTime = validUntil.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {/* Quotation Number */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('quotations.quotationNumber')}
                value={formData.quotationNumber}
                onChange={handleChange('quotationNumber')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QuotationIcon color="primary" />
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
                {QUOTATION_STATUS_OPTIONS.map((statusOption) => (
                  <MenuItem key={statusOption.value} value={statusOption.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor:
                            statusOption.value === 'approved'
                              ? 'success.main'
                              : statusOption.value === 'rejected'
                              ? 'error.main'
                              : statusOption.value === 'sent'
                              ? 'info.main'
                              : 'warning.main',
                        }}
                      />
                      {statusOption.labelEn}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Subject */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Subject"
                value={formData.subject}
                onChange={handleChange('subject')}
                error={Boolean(errors.subject)}
                helperText={errors.subject}
                required
                placeholder="e.g., Quotation for Villa Interior Work"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Project Selection */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label={t('quotations.project')}
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
                label={t('quotations.client')}
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

            {/* Created Date */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="Created Date"
                value={formData.createdDate}
                onChange={handleDateChange('createdDate')}
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

            {/* Valid Until */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="Valid Until"
                value={formData.validUntil}
                onChange={handleDateChange('validUntil')}
                minDate={formData.createdDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <ValidityIcon color="primary" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {getDaysUntilExpiry() > 0
                  ? `${getDaysUntilExpiry()} days validity`
                  : 'Quotation has expired'}
              </Typography>
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

            {/* Include Breakdown Toggle */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.includeBreakdown}
                      onChange={handleSwitchChange('includeBreakdown')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Include Price Breakdown</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Show itemized pricing to client
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </Grid>

            {/* Selected Client Info */}
            {selectedClient && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: 1, borderColor: 'success.light' }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
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
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Quotation Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: 150 }}>Rate</TableCell>
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
                            <MenuItem value="rft">R. Ft.</MenuItem>
                            <MenuItem value="hours">Hours</MenuItem>
                            <MenuItem value="days">Days</MenuItem>
                            <MenuItem value="lot">Lot</MenuItem>
                            <MenuItem value="lumpsum">Lump Sum</MenuItem>
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

              <Button startIcon={<AddIcon />} onClick={handleAddLineItem} sx={{ mt: 2 }}>
                Add Line Item
              </Button>
            </Grid>

            {/* Scope of Work */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                Scope of Work (Optional)
              </Typography>
              {scopeOfWork.map((scope, scopeIndex) => (
                <Paper key={scope.id} sx={{ p: 2, mb: 2 }} variant="outlined">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Phase ${scopeIndex + 1} Title`}
                      value={scope.title}
                      onChange={(e) => handleScopeChange(scope.id, 'title', e.target.value)}
                      placeholder="e.g., Flooring Work"
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveScope(scope.id)}
                      disabled={scopeOfWork.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  {scope.details.map((detail, detailIndex) => (
                    <Box key={detailIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, ml: 2 }}>
                      <Typography variant="body2" color="text.secondary">•</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={detail}
                        onChange={(e) => handleScopeDetailChange(scope.id, detailIndex, e.target.value)}
                        placeholder="Enter work detail"
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveScopeDetail(scope.id, detailIndex)}
                        disabled={scope.details.length === 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddScopeDetail(scope.id)}
                    sx={{ ml: 2 }}
                  >
                    Add Detail
                  </Button>
                </Paper>
              ))}
              <Button startIcon={<AddIcon />} onClick={handleAddScope}>
                Add Scope Section
              </Button>
            </Grid>

            {/* Discount & Summary */}
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

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalculateIcon color="success" />
                  Quotation Summary
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
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                      {formatCurrency(calculateTotal())}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            {/* Terms & Conditions */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setShowTerms(!showTerms)}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Terms & Conditions
                  </Typography>
                  <IconButton size="small">
                    {showTerms ? <CollapseIcon /> : <ExpandIcon />}
                  </IconButton>
                </Box>
                <Collapse in={showTerms}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={formData.termsAndConditions}
                    onChange={handleChange('termsAndConditions')}
                    placeholder="Enter terms and conditions..."
                    sx={{ mt: 2 }}
                  />
                </Collapse>
              </Paper>
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Additional Notes"
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

            {/* Quotation Preview */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Quotation Preview
              </Typography>
              <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      QUOTATION
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      #{formData.quotationNumber}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={formData.status.toUpperCase()}
                      color={
                        formData.status === 'approved'
                          ? 'success'
                          : formData.status === 'rejected'
                          ? 'error'
                          : formData.status === 'sent'
                          ? 'info'
                          : 'warning'
                      }
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Valid until: {formData.validUntil.toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                {/* Subject */}
                <Typography variant="h6" gutterBottom>
                  {formData.subject}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={4}>
                  {/* Client Info */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      PREPARED FOR
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedClient?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2">{selectedClient?.email}</Typography>
                    <Typography variant="body2">{selectedClient?.phone}</Typography>
                    <Typography variant="body2">{selectedClient?.address}</Typography>
                  </Grid>

                  {/* Quotation Details */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ textAlign: { md: 'right' } }}>
                      <Typography variant="body2">
                        <strong>Date:</strong> {formData.createdDate.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Project:</strong> {selectedProject?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Scope of Work */}
                {scopeOfWork.some((s) => s.title.trim()) && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      SCOPE OF WORK
                    </Typography>
                    {scopeOfWork
                      .filter((s) => s.title.trim())
                      .map((scope, index) => (
                        <Box key={scope.id} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {index + 1}. {scope.title}
                          </Typography>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {scope.details
                              .filter((d) => d.trim())
                              .map((detail, i) => (
                                <li key={i}>
                                  <Typography variant="body2">{detail}</Typography>
                                </li>
                              ))}
                          </ul>
                        </Box>
                      ))}
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Line Items (if breakdown enabled) */}
                {formData.includeBreakdown && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Qty</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Rate</TableCell>
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
                )}

                {/* Totals */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Box sx={{ width: 300 }}>
                    {formData.includeBreakdown && (
                      <>
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
                      </>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">
                        {formData.includeBreakdown ? 'Total:' : 'Quoted Amount:'}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {formatCurrency(calculateTotal())}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Terms */}
                {formData.termsAndConditions && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      TERMS & CONDITIONS
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {formData.termsAndConditions}
                    </Typography>
                  </Box>
                )}

                {/* Notes */}
                {formData.notes && (
                  <Box sx={{ mt: 2 }}>
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
              <Alert severity="success" icon={<PreviewIcon />}>
                <Typography variant="subtitle2">Ready to Submit</Typography>
                <Typography variant="body2">
                  Review the quotation preview above. Once submitted, you can send it to the client,
                  download as PDF, or make further edits from the quotations list.
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
          title={isEdit ? t('quotations.editQuotation') : t('quotations.createQuotation')}
          breadcrumbs={[
            { label: t('quotations.title'), path: ROUTES.QUOTATIONS },
            { label: isEdit ? t('quotations.editQuotation') : t('quotations.createQuotation') },
          ]}
        />

        <Card sx={{ overflow: 'visible' }}>
          {/* Premium Header with Stepper */}
          <Box
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
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
                <QuotationIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {isEdit ? 'Edit Quotation' : 'Create New Quotation'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {isEdit ? 'Update quotation details' : 'Generate a professional quotation for your client'}
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
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
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
                      {loading ? t('common.loading') : isEdit ? 'Update Quotation' : 'Create Quotation'}
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

export default QuotationFormPage;
