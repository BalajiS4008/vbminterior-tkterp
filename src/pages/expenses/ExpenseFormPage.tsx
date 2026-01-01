import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FormControl,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Receipt as ExpenseIcon,
  Send as SubmitIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import {
  ROUTES,
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../../config/constants';
import { expenseService, projectService } from '../../services';
import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  ExpensePaymentStatus,
  PaymentMethod,
} from '../../types';

interface FormData {
  projectId: string;
  projectName: string;
  category: ExpenseCategory;
  subcategory: string;
  description: string;
  amount: number;
  taxAmount: number;
  expenseDate: Date | null;
  vendorName: string;
  paymentMethod: PaymentMethod;
  paymentStatus: ExpensePaymentStatus;
  referenceNumber: string;
  notes: string;
}

const initialFormData: FormData = {
  projectId: '',
  projectName: '',
  category: 'materials',
  subcategory: '',
  description: '',
  amount: 0,
  taxAmount: 0,
  expenseDate: new Date(),
  vendorName: '',
  paymentMethod: 'cash',
  paymentStatus: 'paid',
  referenceNumber: '',
  notes: '',
};

const ExpenseFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects
        const projectResult = await projectService.getAll();
        setProjects(projectResult.projects.map(p => ({ id: p.id, name: p.name })));

        // Fetch expense if editing
        if (isEdit && id) {
          const expense = await expenseService.getById(id);
          if (expense) {
            setFormData({
              projectId: expense.projectId || '',
              projectName: expense.projectName || '',
              category: expense.category,
              subcategory: expense.subcategory || '',
              description: expense.description,
              amount: expense.amount,
              taxAmount: expense.taxAmount || 0,
              expenseDate: expense.expenseDate,
              vendorName: expense.vendorName || '',
              paymentMethod: expense.paymentMethod,
              paymentStatus: expense.paymentStatus,
              referenceNumber: expense.referenceNumber || '',
              notes: expense.notes || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit, showError]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Update project name when project changes
      if (field === 'projectId') {
        const project = projects.find(p => p.id === value);
        updated.projectName = project?.name || '';
      }

      return updated;
    });
  };

  const calculateTotal = () => {
    return formData.amount + formData.taxAmount;
  };

  const validateForm = (): boolean => {
    if (!formData.description.trim()) {
      showError('Please enter a description');
      return false;
    }
    if (formData.amount <= 0) {
      showError('Please enter a valid amount');
      return false;
    }
    if (!formData.expenseDate) {
      showError('Please select an expense date');
      return false;
    }
    return true;
  };

  const handleSave = async (status: ExpenseStatus = 'draft') => {
    if (!validateForm()) return;

    const isSave = status === 'draft';
    if (isSave) {
      setSaving(true);
    } else {
      setSubmitting(true);
    }

    try {
      const expenseData: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        expenseDate: formData.expenseDate!,
        totalAmount: calculateTotal(),
        status,
        createdBy: userData?.id || '',
      };

      if (isEdit && id) {
        await expenseService.update(id, expenseData);
        showSuccess(`Expense ${status === 'submitted' ? 'submitted' : 'updated'} successfully`);
      } else {
        await expenseService.create(expenseData);
        showSuccess(`Expense ${status === 'submitted' ? 'submitted' : 'created'} successfully`);
      }

      navigate(ROUTES.EXPENSES);
    } catch (error) {
      console.error('Error saving expense:', error);
      showError(`Failed to ${isEdit ? 'update' : 'create'} expense`);
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Expense' : 'New Expense'}
        breadcrumbs={[
          { label: 'Expenses', path: ROUTES.EXPENSES },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <Card>
        <CardContent sx={{ p: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ExpenseIcon color="primary" />
                  Expense Details
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <TextField
                    select
                    label="Project (Optional)"
                    value={formData.projectId}
                    onChange={(e) => handleChange('projectId', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>No Project</em>
                    </MenuItem>
                    {projects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Expense Date"
                  value={formData.expenseDate}
                  onChange={(date) => handleChange('expenseDate', date)}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {EXPENSE_CATEGORY_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.labelEn}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Subcategory"
                  value={formData.subcategory}
                  onChange={(e) => handleChange('subcategory', e.target.value)}
                  placeholder="e.g., Cement, Steel, Paint"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Brief description of the expense"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Amount Details */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Amount Details
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Amount"
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Tax Amount"
                  type="number"
                  value={formData.taxAmount || ''}
                  onChange={(e) => handleChange('taxAmount', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Total Amount"
                  value={calculateTotal().toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ '& .MuiInputBase-input': { fontWeight: 600 } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Payment Details */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Payment Details
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Vendor/Supplier Name"
                  value={formData.vendorName}
                  onChange={(e) => handleChange('vendorName', e.target.value)}
                  placeholder="e.g., ABC Suppliers"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Payment Method"
                  value={formData.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                >
                  {PAYMENT_METHOD_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.labelEn}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Payment Status"
                  value={formData.paymentStatus}
                  onChange={(e) => handleChange('paymentStatus', e.target.value)}
                >
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Reference Number"
                  value={formData.referenceNumber}
                  onChange={(e) => handleChange('referenceNumber', e.target.value)}
                  placeholder="Bill/Receipt number"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Additional notes or comments"
                />
              </Grid>

              {/* Actions */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => navigate(ROUTES.EXPENSES)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('draft')}
                    disabled={saving || submitting}
                  >
                    {saving ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SubmitIcon />}
                    onClick={() => handleSave('submitted')}
                    disabled={saving || submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit for Approval'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ExpenseFormPage;
