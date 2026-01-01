import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  Chip,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationCity as CityIcon,
} from '@mui/icons-material';
import { PageHeader, EmptyState, ConfirmDialog, LoadingSpinner } from '../../components/common';
import { useNotification } from '../../contexts';
import { useDebounce } from '../../hooks';
import { ROUTES, DEFAULT_PAGE_SIZE, CLIENT_STATUS_COLORS } from '../../config/constants';
import { formatCurrency, generateInitials } from '../../utils';
import { clientService } from '../../services';
import type { Client, ClientStatus } from '../../types';

const ClientListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError } = useNotification();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { clients: fetchedClients } = await clientService.getAll();
      setClients(fetchedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() =>
    clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        client.phone?.includes(debouncedSearchQuery) ||
        client.city?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ),
    [clients, debouncedSearchQuery]
  );

  const paginatedClients = useMemo(() =>
    filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredClients, page, rowsPerPage]
  );

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, client: Client) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedClient(null);
  }, []);

  const handleView = useCallback(() => {
    if (selectedClient) {
      navigate(`/clients/${selectedClient.id}`);
    }
    handleMenuClose();
  }, [selectedClient, navigate, handleMenuClose]);

  const handleEdit = useCallback(() => {
    if (selectedClient) {
      navigate(`/clients/${selectedClient.id}/edit`);
    }
    handleMenuClose();
  }, [selectedClient, navigate, handleMenuClose]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedClient) return;

    try {
      await clientService.delete(selectedClient.id);
      showSuccess('Client deleted successfully');
      fetchClients();
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete client');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedClient(null);
    }
  }, [selectedClient, showSuccess, showError]);

  const getStatusColor = (status: ClientStatus) => {
    return CLIENT_STATUS_COLORS[status] || '#9E9E9E';
  };

  const renderMobileCard = (client: Client) => (
    <Card
      key={client.id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 48,
                height: 48,
              }}
            >
              {generateInitials(client.name)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {client.name}
              </Typography>
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
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, client)}
          >
            <MoreIcon />
          </IconButton>
        </Box>

        <Stack spacing={1}>
          {client.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {client.email}
              </Typography>
            </Box>
          )}
          {client.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {client.phone}
              </Typography>
            </Box>
          )}
          {client.city && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CityIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {client.city}{client.state ? `, ${client.state}` : ''}
              </Typography>
            </Box>
          )}
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Projects</Typography>
            <Typography variant="body2" fontWeight={600}>{client.totalProjects}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Revenue</Typography>
            <Typography variant="body2" fontWeight={600}>{formatCurrency(client.totalRevenue)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Outstanding</Typography>
            <Typography variant="body2" fontWeight={600} color={client.outstandingAmount > 0 ? 'error.main' : 'success.main'}>
              {formatCurrency(client.outstandingAmount)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients`}
        actionLabel="Add Client"
        onAction={() => navigate(ROUTES.CLIENT_CREATE)}
      />

      <Card>
        <CardContent>
          {/* Search */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ width: { xs: '100%', sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {filteredClients.length === 0 ? (
            <EmptyState
              icon={PersonIcon}
              title="No clients found"
              description="No clients found matching your criteria"
              actionLabel="Add Client"
              onAction={() => navigate(ROUTES.CLIENT_CREATE)}
            />
          ) : isMobile ? (
            // Mobile Card View
            <Box>
              {paginatedClients.map(renderMobileCard)}
              <TablePagination
                component="div"
                count={filteredClients.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Box>
          ) : (
            // Desktop Table View
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Client</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell align="center">Projects</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Outstanding</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow
                        key={client.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                              }}
                            >
                              {generateInitials(client.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {client.name}
                              </Typography>
                              {client.contactPerson && (
                                <Typography variant="caption" color="text.secondary">
                                  {client.contactPerson}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            {client.email && (
                              <Typography variant="body2">{client.email}</Typography>
                            )}
                            {client.phone && (
                              <Typography variant="caption" color="text.secondary">
                                {client.phone}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {client.city ? (
                            <Typography variant="body2">
                              {client.city}{client.state ? `, ${client.state}` : ''}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={client.totalProjects} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500}>
                            {formatCurrency(client.totalRevenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            color={client.outstandingAmount > 0 ? 'error.main' : 'success.main'}
                          >
                            {formatCurrency(client.outstandingAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, client)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredClients.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          View
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Client"
        message={`Are you sure you want to delete "${selectedClient?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedClient(null);
        }}
      />
    </Box>
  );
};

export default ClientListPage;
