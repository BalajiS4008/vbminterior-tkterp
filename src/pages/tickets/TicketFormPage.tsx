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
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
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
  BugReport as TicketIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Flag as PriorityIcon,
  Schedule as ScheduleIcon,
  Folder as ProjectIcon,
  Person as PersonIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES, TICKET_CATEGORIES, PRIORITY_OPTIONS, TICKET_STATUS_OPTIONS } from '../../config/constants';
import { ticketService, projectService, userService, notificationService } from '../../services';
import type { Ticket, TicketStatus, TicketPriority, TicketCategory, Project, User } from '../../types';

const steps = ['Ticket Details', 'Assignment & Priority', 'Attachments'];

interface AttachmentPreview {
  file: File;
  preview: string;
  type: string;
}

const TicketFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const isEdit = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    location: '',
    category: 'general' as TicketCategory,
    priority: 'medium' as TicketPriority,
    status: 'open' as TicketStatus,
    dueDate: null as Date | null,
    assignedTo: [] as string[],
    tags: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [originalTicket, setOriginalTicket] = useState<Ticket | null>(null);

  // Fetch projects and users
  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      try {
        const [projectsData, usersData] = await Promise.all([
          projectService.getAll(),
          userService.getAll(),
        ]);
        setProjects(projectsData.projects);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  // Fetch ticket data if editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchTicket = async () => {
        setFetchingData(true);
        try {
          const ticket = await ticketService.getById(id);
          if (ticket) {
            setOriginalTicket(ticket);
            setFormData({
              title: ticket.title,
              description: ticket.description || '',
              projectId: ticket.projectId,
              location: ticket.location || '',
              category: ticket.category,
              priority: ticket.priority,
              status: ticket.status,
              dueDate: ticket.dueDate || null,
              assignedTo: ticket.assignedTo || [],
              tags: (ticket as any).tags || [],
            });
          }
        } catch (error) {
          showError('Failed to load ticket');
          navigate(ROUTES.TICKETS);
        } finally {
          setFetchingData(false);
        }
      };
      fetchTicket();
    }
  }, [isEdit, id]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSelectChange = (field: string) => (event: any) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: AttachmentPreview[] = [];
      Array.from(files).forEach((file) => {
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
        newAttachments.push({
          file,
          preview,
          type: file.type,
        });
      });
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type === 'application/pdf') return <PdfIcon />;
    return <FileIcon />;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.title.trim()) {
        newErrors.title = t('validation.required');
      }
      if (!formData.projectId) {
        newErrors.projectId = t('validation.required');
      }
      if (!formData.location.trim()) {
        newErrors.location = t('validation.required');
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
      const selectedProject = projects.find((p) => p.id === formData.projectId);
      const creatorName = userData?.displayName || 'User';

      const ticketData = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        projectName: selectedProject?.name || '',
        location: formData.location,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || undefined,
        assignedTo: formData.assignedTo,
        tags: formData.tags,
        createdBy: userData?.id || '',
        ticketNumber: '', // Will be generated by service
        attachments: [],
      };

      if (isEdit && id) {
        await ticketService.update(id, ticketData);

        // Check for status change and notify assigned users
        if (originalTicket && originalTicket.status !== formData.status) {
          const usersToNotify = formData.assignedTo.filter(
            (userId) => userId !== userData?.id
          );
          if (usersToNotify.length > 0) {
            await notificationService.notifyTicketStatusChanged(
              usersToNotify,
              id,
              formData.title,
              formData.status,
              creatorName
            );
          }
        }

        // Check for new assignees and notify them
        if (originalTicket) {
          const newAssignees = formData.assignedTo.filter(
            (userId) => !originalTicket.assignedTo.includes(userId) && userId !== userData?.id
          );
          if (newAssignees.length > 0) {
            await notificationService.notifyTicketAssigned(
              newAssignees,
              id,
              formData.title,
              creatorName
            );
          }
        }

        showSuccess(t('tickets.updateSuccess') || 'Ticket updated successfully');
      } else {
        const ticketId = await ticketService.create(ticketData);

        // Notify assigned users about the new ticket (excluding the creator)
        const usersToNotify = formData.assignedTo.filter(
          (userId) => userId !== userData?.id
        );
        if (usersToNotify.length > 0) {
          await notificationService.notifyTicketAssigned(
            usersToNotify,
            ticketId,
            formData.title,
            creatorName
          );
        }

        showSuccess(t('tickets.createSuccess') || 'Ticket created successfully');
      }

      navigate(ROUTES.TICKETS);
    } catch (error: any) {
      showError(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.TICKETS);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {/* Ticket Title */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('tickets.ticketTitle')}
                value={formData.title}
                onChange={handleChange('title')}
                error={Boolean(errors.title)}
                helperText={errors.title}
                required
                placeholder="Enter a clear, descriptive title for the issue"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TicketIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('common.description')}
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={4}
                placeholder="Describe the issue in detail. Include any relevant information that would help resolve it."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
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
                label={t('tickets.project')}
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
                        color={project.status === 'active' ? 'success' : 'default'}
                        sx={{ height: 20 }}
                      />
                      {project.name}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Location */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('tickets.location')}
                value={formData.location}
                onChange={handleChange('location')}
                error={Boolean(errors.location)}
                helperText={errors.location}
                required
                placeholder="e.g., Block A, Floor 2, Room 101"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Category */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label={t('tickets.category')}
                value={formData.category}
                onChange={handleChange('category')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CategoryIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              >
                {TICKET_CATEGORIES.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.labelEn}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Tags */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Press Enter to add tag"
                InputProps={{
                  endAdornment: tagInput && (
                    <InputAdornment position="end">
                      <Button size="small" onClick={handleAddTag}>
                        Add
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
              {formData.tags.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            {/* Priority Selection */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mb: 2 }}>
                Select Priority Level
              </Typography>
              <Grid container spacing={2}>
                {PRIORITY_OPTIONS.map((option) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={option.value}>
                    <Paper
                      onClick={() => setFormData((prev) => ({ ...prev, priority: option.value as TicketPriority }))}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: 2,
                        borderColor: formData.priority === option.value
                          ? getPriorityColor(option.value)
                          : 'transparent',
                        bgcolor: formData.priority === option.value
                          ? alpha(getPriorityColor(option.value), 0.1)
                          : 'background.paper',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: getPriorityColor(option.value),
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <PriorityIcon sx={{ fontSize: 32, color: getPriorityColor(option.value), mb: 1 }} />
                      <Typography variant="subtitle2">{option.labelEn}</Typography>
                      {formData.priority === option.value && (
                        <CheckIcon sx={{ color: getPriorityColor(option.value), fontSize: 20, mt: 0.5 }} />
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Due Date */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label={t('tickets.dueDate')}
                value={formData.dueDate}
                onChange={handleDateChange}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <ScheduleIcon color="primary" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Grid>

            {/* Status (Edit mode only) */}
            {isEdit && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label={t('common.status')}
                  value={formData.status}
                  onChange={handleChange('status')}
                >
                  {TICKET_STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.labelEn}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Assignees */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select
                  multiple
                  value={formData.assignedTo}
                  onChange={handleSelectChange('assignedTo')}
                  input={<OutlinedInput label="Assign To" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((userId) => {
                        const user = users.find((u) => u.id === userId);
                        return (
                          <Chip
                            key={userId}
                            avatar={<Avatar sx={{ width: 24, height: 24 }}>{user?.displayName?.[0]}</Avatar>}
                            label={user?.displayName || userId}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  }
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <Checkbox checked={formData.assignedTo.includes(user.id)} />
                      <Avatar sx={{ width: 28, height: 28, mr: 1 }}>{user.displayName?.[0]}</Avatar>
                      <ListItemText
                        primary={user.displayName}
                        secondary={user.role}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            {/* File Upload Area */}
            <Grid size={{ xs: 12 }}>
              <Paper
                sx={{
                  p: 4,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderColor: 'primary.dark',
                  },
                }}
                component="label"
              >
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drop files here or click to upload
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: Images, PDF, Word documents (Max 10MB each)
                </Typography>
              </Paper>
            </Grid>

            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Uploaded Files ({attachments.length})
                </Typography>
                <Grid container spacing={2}>
                  {attachments.map((attachment, index) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                      <Paper
                        sx={{
                          p: 2,
                          position: 'relative',
                          textAlign: 'center',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveAttachment(index)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {attachment.preview ? (
                          <Box
                            component="img"
                            src={attachment.preview}
                            sx={{
                              width: '100%',
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: 1,
                              mb: 1,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: 100,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'grey.100',
                              borderRadius: 1,
                              mb: 1,
                            }}
                          >
                            {getFileIcon(attachment.type)}
                          </Box>
                        )}
                        <Typography variant="caption" noWrap>
                          {attachment.file.name}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            {/* Summary Alert */}
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" icon={<AssignmentIcon />}>
                <Typography variant="subtitle2">Ticket Summary</Typography>
                <Typography variant="body2">
                  <strong>Title:</strong> {formData.title || 'Not specified'}
                </Typography>
                <Typography variant="body2">
                  <strong>Project:</strong> {projects.find((p) => p.id === formData.projectId)?.name || 'Not selected'}
                </Typography>
                <Typography variant="body2">
                  <strong>Priority:</strong> {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong> {formData.location || 'Not specified'}
                </Typography>
                <Typography variant="body2">
                  <strong>Attachments:</strong> {attachments.length} files
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
          title={isEdit ? t('tickets.editTicket') : t('tickets.createTicket')}
          breadcrumbs={[
            { label: t('tickets.title'), path: ROUTES.TICKETS },
            { label: isEdit ? t('tickets.editTicket') : t('tickets.createTicket') },
          ]}
        />

        <Card sx={{ overflow: 'visible' }}>
          {/* Premium Header with Stepper */}
          <Box
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
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
                <TicketIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {isEdit ? 'Edit Ticket' : 'Create New Ticket'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {isEdit ? 'Update ticket information' : 'Report an issue or request'}
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
                        background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
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
                      {loading ? t('common.loading') : isEdit ? 'Update Ticket' : 'Create Ticket'}
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

export default TicketFormPage;
