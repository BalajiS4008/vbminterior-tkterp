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
  Avatar,
  Tab,
  Tabs,
  useTheme,
  Stack,
  Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Assignment as ProjectIcon,
  Receipt as InvoiceIcon,
  Description as QuotationIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { PageHeader, StatusChip, LoadingSpinner } from '../../components/common';
import { ROUTES, CLIENT_STATUS_COLORS } from '../../config/constants';
import { formatDate, formatCurrency, generateInitials } from '../../utils';
import { clientService, projectService, invoiceService, quotationService } from '../../services';
import type { Client, Project, Invoice, QuotationStatus, DocumentStatus } from '../../types';

// Local type for quotation data from the quotation service
interface QuotationData {
  id: string;
  quotationNumber: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  status: QuotationStatus;
  createdDate: Date;
  validUntil: Date;
  subject: string;
  total: number;
  createdAt: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

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

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [tabValue, setTabValue] = useState(0);
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const clientData = await clientService.getById(id);
        setClient(clientData);

        // Fetch related data
        try {
          const { projects: allProjects } = await projectService.getAll();
          const clientProjects = allProjects.filter(p => p.clientId === id || p.clientName === clientData?.name);
          setProjects(clientProjects);
        } catch (error) {
          console.error('Error fetching projects:', error);
          setProjects([]);
        }

        try {
          const { invoices: allInvoices } = await invoiceService.getAllInvoices();
          const clientInvoices = allInvoices.filter(inv => inv.clientDetails?.name === clientData?.name);
          setInvoices(clientInvoices);
        } catch (error) {
          console.error('Error fetching invoices:', error);
          setInvoices([]);
        }

        try {
          const { quotations: allQuotations } = await quotationService.getAll();
          const clientQuotations = allQuotations.filter(q => q.clientName === clientData?.name);
          setQuotations(clientQuotations);
        } catch (error) {
          console.error('Error fetching quotations:', error);
          setQuotations([]);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id]);

  const handleEdit = () => {
    navigate(`/clients/${id}/edit`);
  };

  const getStatusColor = (status: string) => {
    return CLIENT_STATUS_COLORS[status as keyof typeof CLIENT_STATUS_COLORS] || '#9E9E9E';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!client) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Client not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={client.name}
        breadcrumbs={[
          { label: 'Clients', path: ROUTES.CLIENTS },
          { label: client.name },
        ]}
        actionLabel="Edit"
        onAction={handleEdit}
        actionIcon={<EditIcon />}
      />

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Client Header Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontSize: '1.5rem',
                    fontWeight: 600,
                  }}
                >
                  {generateInitials(client.name)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {client.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={client.status}
                      size="small"
                      sx={{
                        bgcolor: alpha(getStatusColor(client.status), 0.1),
                        color: getStatusColor(client.status),
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}
                    />
                    {client.source && (
                      <Chip
                        label={client.source}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Stats */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h4" fontWeight={700} color="primary">
                      {client.totalProjects}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Projects
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {formatCurrency(client.totalRevenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(client.outstandingAmount > 0 ? theme.palette.error.main : theme.palette.success.main, 0.05),
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={client.outstandingAmount > 0 ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(client.outstandingAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Outstanding
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {client.notes && (
                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05), borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">{client.notes}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Tabs */}
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab icon={<ProjectIcon />} iconPosition="start" label={`Projects (${projects.length})`} />
                <Tab icon={<InvoiceIcon />} iconPosition="start" label={`Invoices (${invoices.length})`} />
                <Tab icon={<QuotationIcon />} iconPosition="start" label={`Quotations (${quotations.length})`} />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                {projects.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No projects yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(ROUTES.PROJECT_CREATE)}
                      sx={{ mt: 1 }}
                    >
                      Create Project
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {projects.map((project) => (
                      <Card
                        key={project.id}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {project.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {project.location}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                {formatCurrency(project.budget)}
                              </Typography>
                              <StatusChip
                                type="project"
                                value={project.status}
                                label={project.status}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {invoices.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No invoices yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(ROUTES.INVOICE_CREATE)}
                      sx={{ mt: 1 }}
                    >
                      Create Invoice
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {invoices.map((invoice) => (
                      <Card
                        key={invoice.id}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" fontWeight={500} color="primary">
                                {invoice.invoiceNumber}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(invoice.issueDate)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {formatCurrency(invoice.financialSummary.grandTotal)}
                              </Typography>
                              <StatusChip
                                type="document"
                                value={invoice.status}
                                label={invoice.status}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                {quotations.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No quotations yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(ROUTES.QUOTATION_CREATE)}
                      sx={{ mt: 1 }}
                    >
                      Create Quotation
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {quotations.map((quotation) => (
                      <Card
                        key={quotation.id}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/quotations/${quotation.id}`)}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" fontWeight={500} color="primary">
                                {quotation.quotationNumber}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(quotation.createdDate)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {formatCurrency(quotation.total)}
                              </Typography>
                              <StatusChip
                                type="document"
                                value={quotation.status as DocumentStatus}
                                label={quotation.status}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Contact Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>

              <DetailRow
                icon={<EmailIcon fontSize="small" />}
                label="Email"
                value={client.email}
              />

              <DetailRow
                icon={<PhoneIcon fontSize="small" />}
                label="Phone"
                value={client.phone}
              />

              {client.alternatePhone && (
                <DetailRow
                  icon={<PhoneIcon fontSize="small" />}
                  label="Alternate Phone"
                  value={client.alternatePhone}
                />
              )}

              {client.contactPerson && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <DetailRow
                    icon={<PersonIcon fontSize="small" />}
                    label="Contact Person"
                    value={client.contactPerson}
                  />
                  {client.contactPersonPhone && (
                    <DetailRow
                      icon={<PhoneIcon fontSize="small" />}
                      label="Contact Person Phone"
                      value={client.contactPersonPhone}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Address
              </Typography>

              {client.address && (
                <DetailRow
                  icon={<LocationIcon fontSize="small" />}
                  label="Address"
                  value={client.address}
                />
              )}

              <DetailRow
                icon={<LocationIcon fontSize="small" />}
                label="City"
                value={`${client.city || '-'}${client.state ? `, ${client.state}` : ''}${client.pincode ? ` - ${client.pincode}` : ''}`}
              />
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business Details
              </Typography>

              {client.gstNumber && (
                <DetailRow
                  icon={<BusinessIcon fontSize="small" />}
                  label="GST Number"
                  value={client.gstNumber}
                />
              )}

              {client.panNumber && (
                <DetailRow
                  icon={<BusinessIcon fontSize="small" />}
                  label="PAN Number"
                  value={client.panNumber}
                />
              )}

              {client.tags && client.tags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {client.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary">
                Client since {formatDate(client.createdAt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClientDetailPage;
