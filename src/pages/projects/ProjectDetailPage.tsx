import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  LinearProgress,
  Chip,
  Avatar,
  Tab,
  Tabs,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { PageHeader, StatusChip, LoadingSpinner } from '../../components/common';
import { useAuth } from '../../contexts';
import { ROUTES } from '../../config/constants';
import { formatDate, formatCurrency, generateInitials } from '../../utils';
import { projectService, ticketService, invoiceService } from '../../services';
import type { Project, Ticket, Invoice } from '../../types';

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
      <Typography variant="body2">{value}</Typography>
    </Box>
  </Box>
);

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { hasPermission } = useAuth();

  const [tabValue, setTabValue] = React.useState(0);
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch project first (required)
        const projectData = await projectService.getById(id);
        setProject(projectData);

        // Fetch tickets and invoices separately to handle index errors gracefully
        try {
          const ticketsData = await ticketService.getByProjectId(id);
          setTickets(ticketsData);
        } catch (ticketError) {
          console.error('Error fetching tickets:', ticketError);
          setTickets([]);
        }

        try {
          const invoicesData = await invoiceService.getByProjectId(id);
          setInvoices(invoicesData);
        } catch (invoiceError) {
          console.error('Error fetching invoices:', invoiceError);
          setInvoices([]);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!project) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Project not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={project.name}
        breadcrumbs={[
          { label: t('projects.title'), path: ROUTES.PROJECTS },
          { label: project.name },
        ]}
        actionLabel={hasPermission('projects.edit') ? t('common.edit') : undefined}
        onAction={hasPermission('projects.edit') ? handleEdit : undefined}
        actionIcon={<EditIcon />}
      />

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              {/* Status & Progress */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StatusChip
                  type="project"
                  value={project.status}
                  label={t(`projects.status.${project.status}`)}
                />
                {project.tags?.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>

              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('projects.progress')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {project.progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={project.progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {/* Description */}
              <Typography variant="body1" sx={{ mb: 3 }}>
                {project.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Tabs */}
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label={t('projects.linkedTickets')} />
                <Tab label={t('projects.linkedInvoices')} />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                {tickets.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('projects.noTickets') || 'No tickets linked to this project yet.'}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2" fontWeight={500} color="primary">
                                {ticket.ticketNumber}
                              </Typography>
                              <Typography variant="body2">{ticket.title}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StatusChip
                                type="ticket"
                                value={ticket.status}
                                label={t(`tickets.status.${ticket.status}`)}
                              />
                              <StatusChip
                                type="priority"
                                value={ticket.priority}
                                label={t(`tickets.priority.${ticket.priority}`)}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {invoices.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('projects.noInvoices') || 'No invoices linked to this project yet.'}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2" fontWeight={500} color="primary">
                                {invoice.invoiceNumber}
                              </Typography>
                              <Typography variant="body2">
                                {formatCurrency(invoice.financialSummary.grandTotal)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StatusChip
                                type="document"
                                value={invoice.status}
                                label={t(`invoices.status.${invoice.status}`)}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(invoice.issueDate)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Project Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('projects.projectDetails')}
              </Typography>

              <DetailRow
                icon={<LocationIcon fontSize="small" />}
                label={t('projects.location')}
                value={project.location}
              />

              <DetailRow
                icon={<MoneyIcon fontSize="small" />}
                label={t('projects.budget')}
                value={formatCurrency(project.budget)}
              />

              <DetailRow
                icon={<CalendarIcon fontSize="small" />}
                label={t('projects.startDate')}
                value={formatDate(project.startDate)}
              />

              <DetailRow
                icon={<CalendarIcon fontSize="small" />}
                label={t('projects.endDate')}
                value={formatDate(project.endDate)}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                {t('projects.assignedUsers')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {project.assignedUsers.slice(0, 4).map((userId, index) => (
                  <Avatar
                    key={userId}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.primary.main,
                    }}
                  >
                    {generateInitials(`User ${index + 1}`)}
                  </Avatar>
                ))}
                {project.assignedUsers.length > 4 && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.grey[500],
                    }}
                  >
                    +{project.assignedUsers.length - 4}
                  </Avatar>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client Details
              </Typography>

              <DetailRow
                icon={<PersonIcon fontSize="small" />}
                label={t('projects.clientName')}
                value={project.clientName}
              />

              {project.clientContact && (
                <DetailRow
                  icon={<PhoneIcon fontSize="small" />}
                  label={t('projects.clientContact')}
                  value={project.clientContact}
                />
              )}

              {project.clientEmail && (
                <DetailRow
                  icon={<EmailIcon fontSize="small" />}
                  label={t('projects.clientEmail')}
                  value={project.clientEmail}
                />
              )}

              {project.clientAddress && (
                <DetailRow
                  icon={<LocationIcon fontSize="small" />}
                  label={t('projects.clientAddress')}
                  value={project.clientAddress}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDetailPage;
