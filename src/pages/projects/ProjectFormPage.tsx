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
  Avatar,
  Chip,
  InputAdornment,
  Divider,
  Paper,
  IconButton,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  CurrencyRupee as CurrencyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as AddressIcon,
  Description as DescriptionIcon,
  Check as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES, PROJECT_STATUS_OPTIONS } from '../../config/constants';
import { projectService } from '../../services';
import type { ProjectStatus } from '../../types';

const steps = ['Project Details', 'Client Information', 'Timeline & Budget'];

const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t: _t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const isEdit = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    clientContact: '',
    clientEmail: '',
    clientAddress: '',
    location: '',
    budget: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: 'planning' as ProjectStatus,
    tags: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadProject(id);
    }
  }, [isEdit, id]);

  const loadProject = async (projectId: string) => {
    try {
      const project = await projectService.getById(projectId);
      if (project) {
        setFormData({
          name: project.name,
          description: project.description || '',
          clientName: project.clientName,
          clientContact: project.clientContact || '',
          clientEmail: project.clientEmail || '',
          clientAddress: project.clientAddress || '',
          location: project.location,
          budget: project.budget.toString(),
          startDate: project.startDate,
          endDate: project.endDate,
          status: project.status,
          tags: project.tags || [],
        });
      }
    } catch (error) {
      showError('Failed to load project');
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (date: Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Project name is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
    } else if (step === 1) {
      if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required';
      if (formData.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
        newErrors.clientEmail = 'Invalid email format';
      }
    } else if (step === 2) {
      if (!formData.budget || parseFloat(formData.budget) <= 0) {
        newErrors.budget = 'Please enter a valid budget';
      }
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.endDate) newErrors.endDate = 'End date is required';
      if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
        newErrors.endDate = 'End date must be after start date';
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

    if (!validateStep(activeStep)) return;

    setLoading(true);

    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        clientName: formData.clientName,
        clientContact: formData.clientContact,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress,
        location: formData.location,
        budget: parseFloat(formData.budget),
        startDate: formData.startDate!,
        endDate: formData.endDate!,
        status: formData.status,
        tags: formData.tags,
        assignedUsers: userData?.id ? [userData.id] : [],
        progress: 0,
        createdBy: userData?.id || 'unknown',
      };

      if (isEdit && id) {
        await projectService.update(id, projectData);
        showSuccess('Project updated successfully!');
      } else {
        await projectService.create(projectData);
        showSuccess('Project created successfully!');
      }

      navigate(ROUTES.PROJECTS);
    } catch (error) {
      console.error('Project save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving the project';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Project Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
                placeholder="e.g., Villa Construction - Phase 1"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={4}
                placeholder="Describe the project scope, objectives, and key deliverables..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                      <DescriptionIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Project Location"
                value={formData.location}
                onChange={handleChange('location')}
                error={Boolean(errors.location)}
                helperText={errors.location}
                required
                placeholder="e.g., ECR Road, Chennai"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Project Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
              <TextField
                size="small"
                placeholder="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleAddTag}>
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  mb: 2,
                }}
              >
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
                  <PersonIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {formData.clientName || 'Client Name'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.clientEmail || 'client@example.com'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Client Name"
                value={formData.clientName}
                onChange={handleChange('clientName')}
                error={Boolean(errors.clientName)}
                helperText={errors.clientName}
                required
                placeholder="Full name of the client"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.clientContact}
                onChange={handleChange('clientContact')}
                placeholder="+91 98765 43210"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email Address"
                value={formData.clientEmail}
                onChange={handleChange('clientEmail')}
                error={Boolean(errors.clientEmail)}
                helperText={errors.clientEmail}
                type="email"
                placeholder="client@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Client Address"
                value={formData.clientAddress}
                onChange={handleChange('clientAddress')}
                multiline
                rows={3}
                placeholder="Full address for correspondence"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                      <AddressIcon color="action" />
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
            <Grid size={{ xs: 12 }}>
              <Paper
                sx={{
                  p: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                  borderRadius: 2,
                }}
              >
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {formData.budget ? `₹${parseFloat(formData.budget).toLocaleString('en-IN')}` : '₹0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estimated Project Budget
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Project Budget"
                value={formData.budget}
                onChange={handleChange('budget')}
                error={Boolean(errors.budget)}
                helperText={errors.budget || 'Enter the total estimated budget'}
                type="number"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CurrencyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={handleDateChange('startDate')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(errors.startDate),
                    helperText: errors.startDate,
                    required: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={handleDateChange('endDate')}
                minDate={formData.startDate || undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(errors.endDate),
                    helperText: errors.endDate,
                    required: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Grid>

            {isEdit && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  select
                  label="Project Status"
                  value={formData.status}
                  onChange={handleChange('status')}
                >
                  {PROJECT_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.labelEn}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {formData.startDate && formData.endDate && (
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <InfoIcon color="info" fontSize="small" />
                    <Typography variant="subtitle2">Project Duration</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                    ({Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))} months approximately)
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <PageHeader
          title={isEdit ? 'Edit Project' : 'Create New Project'}
          subtitle={isEdit ? 'Update project details' : 'Set up a new construction project'}
          breadcrumbs={[
            { label: 'Projects', path: ROUTES.PROJECTS },
            { label: isEdit ? 'Edit Project' : 'New Project' },
          ]}
        />

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label} completed={index < activeStep}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': { color: 'white', opacity: 0.7 },
                      '& .MuiStepLabel-label.Mui-active': { color: 'white', opacity: 1 },
                      '& .MuiStepLabel-label.Mui-completed': { color: 'white', opacity: 1 },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              {getStepContent(activeStep)}

              <Divider sx={{ my: 4 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={activeStep === 0 ? () => navigate(ROUTES.PROJECTS) : handleBack}
                >
                  {activeStep === 0 ? 'Cancel' : 'Back'}
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    endIcon={<NextIcon />}
                    onClick={handleNext}
                    size="large"
                  >
                    Continue
                  </Button>
                )}
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default ProjectFormPage;
