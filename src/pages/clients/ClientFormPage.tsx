import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Typography,
  Chip,
  InputAdornment,
  Divider,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Check as CheckIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES, CLIENT_STATUS_OPTIONS, CLIENT_SOURCE_OPTIONS } from '../../config/constants';
import { clientService } from '../../services';
import type { ClientStatus, ClientSource } from '../../types';

const ClientFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { userData } = useAuth();

  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    contactPerson: '',
    contactPersonPhone: '',
    notes: '',
    tags: [] as string[],
    source: '' as ClientSource | '',
    status: 'active' as ClientStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadClient(id);
    }
  }, [isEdit, id]);

  const loadClient = async (clientId: string) => {
    try {
      setLoading(true);
      const client = await clientService.getById(clientId);
      if (client) {
        setFormData({
          name: client.name || '',
          email: client.email || '',
          phone: client.phone || '',
          alternatePhone: client.alternatePhone || '',
          address: client.address || '',
          city: client.city || '',
          state: client.state || '',
          pincode: client.pincode || '',
          gstNumber: client.gstNumber || '',
          panNumber: client.panNumber || '',
          contactPerson: client.contactPerson || '',
          contactPersonPhone: client.contactPersonPhone || '',
          notes: client.notes || '',
          tags: client.tags || [],
          source: client.source || '',
          status: client.status || 'active',
        });
      }
    } catch (error) {
      showError('Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST number format';
    }

    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'Invalid PAN number format';
    }

    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Invalid pincode (6 digits required)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        gstNumber: formData.gstNumber.trim() || undefined,
        panNumber: formData.panNumber.trim() || undefined,
        contactPerson: formData.contactPerson.trim() || undefined,
        contactPersonPhone: formData.contactPersonPhone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags,
        source: formData.source || undefined,
        status: formData.status,
        totalProjects: 0,
        totalRevenue: 0,
        outstandingAmount: 0,
        createdBy: userData?.id || 'unknown',
      };

      if (isEdit && id) {
        await clientService.update(id, clientData);
        showSuccess('Client updated successfully!');
      } else {
        await clientService.create(clientData);
        showSuccess('Client created successfully!');
      }

      navigate(ROUTES.CLIENTS);
    } catch (error) {
      console.error('Client save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving the client';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Client' : 'Add New Client'}
        subtitle={isEdit ? 'Update client details' : 'Add a new client to your database'}
        breadcrumbs={[
          { label: 'Clients', path: ROUTES.CLIENTS },
          { label: isEdit ? 'Edit Client' : 'New Client' },
        ]}
      />

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Client Name"
                      value={formData.name}
                      onChange={handleChange('name')}
                      error={Boolean(errors.name)}
                      helperText={errors.name}
                      required
                      placeholder="Company or individual name"
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
                      label="Email"
                      value={formData.email}
                      onChange={handleChange('email')}
                      error={Boolean(errors.email)}
                      helperText={errors.email}
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

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={handleChange('phone')}
                      error={Boolean(errors.phone)}
                      helperText={errors.phone}
                      required
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

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Alternate Phone"
                      value={formData.alternatePhone}
                      onChange={handleChange('alternatePhone')}
                      placeholder="+91 98765 43211"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      select
                      label="Source"
                      value={formData.source}
                      onChange={handleChange('source')}
                    >
                      <MenuItem value="">Select source</MenuItem>
                      {CLIENT_SOURCE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.labelEn}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Contact Person
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Contact Person Name"
                      value={formData.contactPerson}
                      onChange={handleChange('contactPerson')}
                      placeholder="Person to contact"
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
                      label="Contact Person Phone"
                      value={formData.contactPersonPhone}
                      onChange={handleChange('contactPersonPhone')}
                      placeholder="+91 98765 43212"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Address
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={formData.address}
                      onChange={handleChange('address')}
                      multiline
                      rows={2}
                      placeholder="Street address"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                            <LocationIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="City"
                      value={formData.city}
                      onChange={handleChange('city')}
                      placeholder="Chennai"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="State"
                      value={formData.state}
                      onChange={handleChange('state')}
                      placeholder="Tamil Nadu"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Pincode"
                      value={formData.pincode}
                      onChange={handleChange('pincode')}
                      error={Boolean(errors.pincode)}
                      helperText={errors.pincode}
                      placeholder="600001"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Business Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="GST Number"
                      value={formData.gstNumber}
                      onChange={handleChange('gstNumber')}
                      error={Boolean(errors.gstNumber)}
                      helperText={errors.gstNumber || 'e.g., 33AAAAA0000A1Z5'}
                      placeholder="33AAAAA0000A1Z5"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="PAN Number"
                      value={formData.panNumber}
                      onChange={handleChange('panNumber')}
                      error={Boolean(errors.panNumber)}
                      helperText={errors.panNumber || 'e.g., AAAAA0000A'}
                      placeholder="AAAAA0000A"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>

                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={handleChange('notes')}
                  multiline
                  rows={3}
                  placeholder="Any additional notes about this client..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                        <NotesIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status
                </Typography>

                <TextField
                  fullWidth
                  select
                  label="Client Status"
                  value={formData.status}
                  onChange={handleChange('status')}
                  sx={{ mb: 2 }}
                >
                  {CLIENT_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.labelEn}
                    </MenuItem>
                  ))}
                </TextField>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 3 }}>
                  Tags
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
                  fullWidth
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
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  size="large"
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Saving...' : isEdit ? 'Update Client' : 'Save Client'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate(ROUTES.CLIENTS)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ClientFormPage;
