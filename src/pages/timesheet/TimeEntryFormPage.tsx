import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Typography,
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES } from '../../config/constants';
import {
  timeEntryService,
  calculateDuration,
  formatDuration,
  projectService,
  ticketService,
} from '../../services';
import type { TimeEntry, Project, Ticket } from '../../types';

interface FormData {
  projectId: string;
  projectName: string;
  ticketId: string;
  ticketNumber: string;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  description: string;
  category: string;
  billable: boolean;
  hourlyRate: number;
  notes: string;
}

const initialFormData: FormData = {
  projectId: '',
  projectName: '',
  ticketId: '',
  ticketNumber: '',
  date: new Date(),
  startTime: null,
  endTime: null,
  description: '',
  category: '',
  billable: true,
  hourlyRate: 0,
  notes: '',
};

const TimeEntryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Set initial date from query params
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && !isEdit) {
      setFormData((prev) => ({ ...prev, date: new Date(dateParam) }));
    }
  }, [searchParams, isEdit]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectResult = await projectService.getAll();
        setProjects(projectResult.projects);

        if (isEdit && id) {
          const entry = await timeEntryService.getById(id);
          if (entry) {
            // Parse time strings to Date objects
            const [startHour, startMin] = entry.startTime.split(':').map(Number);
            const [endHour, endMin] = entry.endTime.split(':').map(Number);

            const startTimeDate = new Date();
            startTimeDate.setHours(startHour, startMin, 0, 0);

            const endTimeDate = new Date();
            endTimeDate.setHours(endHour, endMin, 0, 0);

            setFormData({
              projectId: entry.projectId,
              projectName: entry.projectName,
              ticketId: entry.ticketId || '',
              ticketNumber: entry.ticketNumber || '',
              date: new Date(entry.date),
              startTime: startTimeDate,
              endTime: endTimeDate,
              description: entry.description,
              category: entry.category || '',
              billable: entry.billable,
              hourlyRate: entry.hourlyRate || 0,
              notes: entry.notes || '',
            });

            // Fetch tickets for the project
            if (entry.projectId) {
              const projectTickets = await ticketService.getByProjectId(entry.projectId);
              setTickets(projectTickets);
            }
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

  // Fetch tickets when project changes
  useEffect(() => {
    const fetchTickets = async () => {
      if (!formData.projectId) {
        setTickets([]);
        return;
      }

      try {
        const projectTickets = await ticketService.getByProjectId(formData.projectId);
        setTickets(projectTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    fetchTickets();
  }, [formData.projectId]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Update project name when project changes
      if (field === 'projectId') {
        const project = projects.find((p) => p.id === value);
        updated.projectName = project?.name || '';
        updated.ticketId = '';
        updated.ticketNumber = '';
      }

      // Update ticket number when ticket changes
      if (field === 'ticketId') {
        const ticket = tickets.find((t) => t.id === value);
        updated.ticketNumber = ticket?.ticketNumber || '';
      }

      return updated;
    });
  };

  // Calculate duration
  const duration = (() => {
    if (!formData.startTime || !formData.endTime) return 0;

    const startStr = `${formData.startTime.getHours().toString().padStart(2, '0')}:${formData.startTime.getMinutes().toString().padStart(2, '0')}`;
    const endStr = `${formData.endTime.getHours().toString().padStart(2, '0')}:${formData.endTime.getMinutes().toString().padStart(2, '0')}`;

    return calculateDuration(startStr, endStr);
  })();

  const validateForm = (): boolean => {
    if (!formData.projectId) {
      showError('Please select a project');
      return false;
    }
    if (!formData.date) {
      showError('Please select a date');
      return false;
    }
    if (!formData.startTime) {
      showError('Please enter start time');
      return false;
    }
    if (!formData.endTime) {
      showError('Please enter end time');
      return false;
    }
    if (duration <= 0) {
      showError('End time must be after start time');
      return false;
    }
    if (!formData.description.trim()) {
      showError('Please enter a description');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userData?.id) {
      showError('User not authenticated');
      return;
    }

    setSaving(true);

    try {
      const startStr = `${formData.startTime!.getHours().toString().padStart(2, '0')}:${formData.startTime!.getMinutes().toString().padStart(2, '0')}`;
      const endStr = `${formData.endTime!.getHours().toString().padStart(2, '0')}:${formData.endTime!.getMinutes().toString().padStart(2, '0')}`;

      const entryData: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: userData.id,
        userName: userData.displayName || userData.email,
        projectId: formData.projectId,
        projectName: formData.projectName,
        ticketId: formData.ticketId || undefined,
        ticketNumber: formData.ticketNumber || undefined,
        date: formData.date!,
        startTime: startStr,
        endTime: endStr,
        duration,
        description: formData.description,
        category: formData.category || undefined,
        billable: formData.billable,
        hourlyRate: formData.billable ? formData.hourlyRate : undefined,
        status: 'draft',
        notes: formData.notes || undefined,
        createdBy: userData.id,
      };

      if (isEdit && id) {
        await timeEntryService.update(id, entryData);
        showSuccess('Time entry updated successfully');
      } else {
        await timeEntryService.create(entryData);
        showSuccess('Time entry created successfully');
      }

      navigate(ROUTES.TIMESHEET);
    } catch (error) {
      console.error('Error saving time entry:', error);
      showError(`Failed to ${isEdit ? 'update' : 'create'} time entry`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Time Entry' : 'New Time Entry'}
        breadcrumbs={[
          { label: 'Timesheet', path: ROUTES.TIMESHEET },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <Card>
        <CardContent sx={{ p: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <TimeIcon color="primary" />
                  Time Entry Details
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Project"
                  value={formData.projectId}
                  onChange={(e) => handleChange('projectId', e.target.value)}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Ticket (Optional)"
                  value={formData.ticketId}
                  onChange={(e) => handleChange('ticketId', e.target.value)}
                  disabled={!formData.projectId || tickets.length === 0}
                >
                  <MenuItem value="">
                    <em>No Ticket</em>
                  </MenuItem>
                  {tickets.map((ticket) => (
                    <MenuItem key={ticket.id} value={ticket.id}>
                      {ticket.ticketNumber} - {ticket.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(date) => handleChange('date', date)}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 4 }}>
                <TimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(time) => handleChange('startTime', time)}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 4 }}>
                <TimePicker
                  label="End Time"
                  value={formData.endTime}
                  onChange={(time) => handleChange('endTime', time)}
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <TimeIcon color="primary" />
                  <Typography variant="h6">
                    Duration: <strong>{formatDuration(duration)}</strong>
                  </Typography>
                </Box>
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
                  placeholder="What did you work on?"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="e.g., Development, Meeting, Research"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Billing Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Billing Information
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.billable}
                      onChange={(e) => handleChange('billable', e.target.checked)}
                    />
                  }
                  label="Billable Time"
                />
              </Grid>

              {formData.billable && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Hourly Rate"
                    value={formData.hourlyRate || ''}
                    onChange={(e) => handleChange('hourlyRate', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Additional notes (optional)"
                />
              </Grid>

              {/* Actions */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => navigate(ROUTES.TIMESHEET)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
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

export default TimeEntryFormPage;
