import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, TextField, InputAdornment, Menu, MenuItem, ListItemIcon, Chip, FormControl, InputLabel, Select, Stack } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search as SearchIcon, MoreVert as MoreIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, ConfirmationNumber as TicketIcon, Clear as ClearIcon } from '@mui/icons-material';
import { PageHeader, StatusChip, EmptyState, ConfirmDialog, LoadingSpinner } from '../../components/common';
import { useAuth, useNotification } from '../../contexts';
import { useDebounce, useRealtimeTickets } from '../../hooks';
import { ticketService } from '../../services';
import { ROUTES, DEFAULT_PAGE_SIZE, TICKET_STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../config/constants';
import { formatDate } from '../../utils';
import type { Ticket, TicketStatus, TicketPriority } from '../../types';

const TicketListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission, userData } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');

  // Note: For workers, we can't combine array-contains (assignedTo) with 'in' (status) in Firestore
  // So we only pass status filter for non-workers, and filter client-side for workers
  const isWorker = userData?.role === 'worker';
  const { data: tickets, loading, error } = useRealtimeTickets(
    undefined,
    isWorker ? userData?.id : undefined,
    // Only apply server-side status filter when not filtering by assignedTo (non-workers)
    !isWorker && statusFilter ? [statusFilter] : undefined
  );
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const filteredTickets = useMemo(() => {
    let result = (tickets || []) as Ticket[];
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter((ticket) => ticket.title.toLowerCase().includes(query) || ticket.ticketNumber.toLowerCase().includes(query) || ticket.location.toLowerCase().includes(query));
    }
    // Apply status filter client-side (for workers this is always needed, for others it's already applied server-side)
    if (statusFilter) result = result.filter((ticket) => ticket.status === statusFilter);
    if (priorityFilter) result = result.filter((ticket) => ticket.priority === priorityFilter);
    return result;
  }, [tickets, debouncedSearchQuery, statusFilter, priorityFilter]);

  const paginatedTickets = useMemo(() => filteredTickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredTickets, page, rowsPerPage]);
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, ticket: Ticket) => { setAnchorEl(event.currentTarget); setSelectedTicket(ticket); }, []);
  const handleMenuClose = useCallback(() => { setAnchorEl(null); setSelectedTicket(null); }, []);
  const handleView = useCallback(() => { if (selectedTicket) navigate(`/tickets/${selectedTicket.id}`); handleMenuClose(); }, [selectedTicket, navigate, handleMenuClose]);
  const handleEdit = useCallback(() => { if (selectedTicket) navigate(`/tickets/${selectedTicket.id}/edit`); handleMenuClose(); }, [selectedTicket, navigate, handleMenuClose]);
  const handleDeleteClick = useCallback(() => { setDeleteDialogOpen(true); setAnchorEl(null); }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedTicket) return;
    setDeleteLoading(true);
    try { await ticketService.delete(selectedTicket.id); showSuccess(t('tickets.deleteSuccess') || 'Ticket deleted successfully'); }
    catch (err) { console.error('Error deleting ticket:', err); showError(t('common.error') || 'Failed to delete ticket'); }
    finally { setDeleteLoading(false); setDeleteDialogOpen(false); setSelectedTicket(null); }
  }, [selectedTicket, showSuccess, showError, t]);

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => { setStatusFilter(event.target.value as TicketStatus | ''); setPage(0); };
  const handlePriorityFilterChange = (event: SelectChangeEvent<string>) => { setPriorityFilter(event.target.value as TicketPriority | ''); setPage(0); };
  const handleClearFilters = () => { setStatusFilter(''); setPriorityFilter(''); setSearchQuery(''); setPage(0); };
  const hasActiveFilters = statusFilter || priorityFilter || searchQuery;

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <Box>
        <PageHeader title={t('tickets.title')} actionLabel={hasPermission('tickets.create') ? t('tickets.createTicket') : undefined} onAction={hasPermission('tickets.create') ? () => navigate(ROUTES.TICKET_CREATE) : undefined} />
        <Card><CardContent><EmptyState icon={TicketIcon} title={t('common.error')} description={error.message || 'Failed to load tickets'} /></CardContent></Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title={t('tickets.title')} subtitle={`${filteredTickets.length} ${t('tickets.title').toLowerCase()}`} actionLabel={hasPermission('tickets.create') ? t('tickets.createTicket') : undefined} onAction={hasPermission('tickets.create') ? () => navigate(ROUTES.TICKET_CREATE) : undefined} />
      <Card><CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField placeholder={t('common.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="small" sx={{ minWidth: 250 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>{t('common.status')}</InputLabel><Select value={statusFilter} label={t('common.status')} onChange={handleStatusFilterChange}><MenuItem value="">{t('common.all')}</MenuItem>{TICKET_STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{t(`tickets.status.${o.value}`)}</MenuItem>)}</Select></FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>{t('tickets.priority')}</InputLabel><Select value={priorityFilter} label={t('tickets.priority')} onChange={handlePriorityFilterChange}><MenuItem value="">{t('common.all')}</MenuItem>{PRIORITY_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{t(`tickets.priority_labels.${o.value}`)}</MenuItem>)}</Select></FormControl>
          {hasActiveFilters && <IconButton onClick={handleClearFilters} size="small" title={t('common.clearFilters') || 'Clear filters'}><ClearIcon /></IconButton>}
        </Stack>
        {filteredTickets.length === 0 ? (
          <EmptyState icon={TicketIcon} title={t('common.noData')} description={hasActiveFilters ? t('common.noResultsFilter') || 'No tickets found matching your filters' : t('tickets.noTickets') || 'No tickets yet.'} actionLabel={hasPermission('tickets.create') ? t('tickets.createTicket') : undefined} onAction={hasPermission('tickets.create') ? () => navigate(ROUTES.TICKET_CREATE) : undefined} />
        ) : (
          <>
            <TableContainer><Table>
              <TableHead><TableRow>
                <TableCell>{t('tickets.ticketNumber')}</TableCell>
                <TableCell>{t('tickets.ticketTitle')}</TableCell>
                <TableCell>{t('tickets.category')}</TableCell>
                <TableCell>{t('tickets.priority')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('tickets.location')}</TableCell>
                <TableCell>{t('tickets.dueDate')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {paginatedTickets.map((ticket) => (
                  <TableRow key={ticket.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                    <TableCell><Chip label={ticket.ticketNumber} size="small" variant="outlined" /></TableCell>
                    <TableCell><Box sx={{ fontWeight: 500 }}>{ticket.title}</Box></TableCell>
                    <TableCell><Chip label={t(`tickets.categories.${ticket.category}`)} size="small" variant="outlined" /></TableCell>
                    <TableCell><StatusChip type="priority" value={ticket.priority} label={t(`tickets.priority_labels.${ticket.priority}`)} /></TableCell>
                    <TableCell><StatusChip type="ticket" value={ticket.status} label={t(`tickets.status.${ticket.status}`)} /></TableCell>
                    <TableCell>{ticket.location}</TableCell>
                    <TableCell>{ticket.dueDate ? formatDate(ticket.dueDate) : '-'}</TableCell>
                    <TableCell align="right"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, ticket); }}><MoreIcon /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></TableContainer>
            <TablePagination component="div" count={filteredTickets.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage={t('common.rowsPerPage')} />
          </>
        )}
      </CardContent></Card>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}><ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>{t('common.view')}</MenuItem>
        {hasPermission('tickets.edit') && <MenuItem onClick={handleEdit}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>{t('common.edit')}</MenuItem>}
        {hasPermission('tickets.delete') && <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>{t('common.delete')}</MenuItem>}
      </Menu>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('tickets.deleteTicket') || 'Delete Ticket'}
        message={t('tickets.deleteConfirm', { number: selectedTicket?.ticketNumber }) || `Are you sure you want to delete "${selectedTicket?.ticketNumber}"?`}
        confirmLabel={t('common.delete')}
        confirmColor="error"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteDialogOpen(false); setSelectedTicket(null); }}
      />
    </Box>
  );
};

export default TicketListPage;