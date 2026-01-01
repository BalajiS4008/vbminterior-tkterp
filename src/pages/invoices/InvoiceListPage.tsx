import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, TextField, InputAdornment, Menu, MenuItem, ListItemIcon, Typography, FormControl, InputLabel, Select, Stack } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search as SearchIcon, MoreVert as MoreIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Receipt as InvoiceIcon, PictureAsPdf as PdfIcon, CheckCircle as PaidIcon, Clear as ClearIcon } from '@mui/icons-material';
import { PageHeader, StatusChip, EmptyState, ConfirmDialog, LoadingSpinner } from '../../components/common';
import { useAuth, useNotification } from '../../contexts';
import { useDebounce, useRealtimeInvoices } from '../../hooks';
import { invoiceService } from '../../services';
import { ROUTES, DEFAULT_PAGE_SIZE, INVOICE_STATUS_OPTIONS } from '../../config/constants';
import { formatDate, formatCurrency, calculateDaysRemaining } from '../../utils';
import type { Invoice, DocumentStatus } from '../../types';

const InvoiceListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');
  const { data: invoices, loading, error } = useRealtimeInvoices(undefined, undefined, statusFilter ? [statusFilter] : undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [markPaidLoading, setMarkPaidLoading] = useState(false);

  const filteredInvoices = useMemo(() => {
    let result = (invoices || []) as Invoice[];
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter((inv) => inv.invoiceNumber?.toLowerCase().includes(query) || inv.clientDetails?.name?.toLowerCase().includes(query));
    }
    return result;
  }, [invoices, debouncedSearchQuery]);

  const paginatedInvoices = useMemo(() => filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredInvoices, page, rowsPerPage]);
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, invoice: Invoice) => { setAnchorEl(event.currentTarget); setSelectedInvoice(invoice); }, []);
  const handleMenuClose = useCallback(() => { setAnchorEl(null); setSelectedInvoice(null); }, []);
  const handleView = useCallback(() => { if (selectedInvoice) navigate(`/invoices/${selectedInvoice.id}`); handleMenuClose(); }, [selectedInvoice, navigate, handleMenuClose]);
  const handleEdit = useCallback(() => { if (selectedInvoice) navigate(`/invoices/${selectedInvoice.id}/edit`); handleMenuClose(); }, [selectedInvoice, navigate, handleMenuClose]);
  const handleDeleteClick = useCallback(() => { setDeleteDialogOpen(true); setAnchorEl(null); }, []);

  const handleMarkAsPaid = useCallback(async () => {
    if (!selectedInvoice) return;
    setMarkPaidLoading(true);
    try { await invoiceService.markInvoiceAsPaid(selectedInvoice.id); showSuccess(t('invoices.markedAsPaid') || 'Invoice marked as paid'); }
    catch (err) { console.error('Error marking invoice as paid:', err); showError(t('common.error') || 'Failed to mark invoice as paid'); }
    finally { setMarkPaidLoading(false); handleMenuClose(); }
  }, [selectedInvoice, showSuccess, showError, t, handleMenuClose]);

  const handleDownloadPdf = useCallback(() => { console.log('Downloading PDF...'); handleMenuClose(); }, [handleMenuClose]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedInvoice) return;
    setDeleteLoading(true);
    try { await invoiceService.deleteInvoice(selectedInvoice.id); showSuccess(t('invoices.deleteSuccess') || 'Invoice deleted successfully'); }
    catch (err) { console.error('Error deleting invoice:', err); showError(t('common.error') || 'Failed to delete invoice'); }
    finally { setDeleteLoading(false); setDeleteDialogOpen(false); setSelectedInvoice(null); }
  }, [selectedInvoice, showSuccess, showError, t]);

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => { setStatusFilter(event.target.value as DocumentStatus | ''); setPage(0); };
  const handleClearFilters = () => { setStatusFilter(''); setSearchQuery(''); setPage(0); };
  const hasActiveFilters = statusFilter || searchQuery;

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <Box>
        <PageHeader title={t('invoices.title')} actionLabel={hasPermission('invoices.create') ? t('invoices.createInvoice') : undefined} onAction={hasPermission('invoices.create') ? () => navigate(ROUTES.INVOICE_CREATE) : undefined} />
        <Card><CardContent><EmptyState icon={InvoiceIcon} title={t('common.error')} description={error.message || 'Failed to load invoices'} /></CardContent></Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title={t('invoices.title')} subtitle={`${filteredInvoices.length} ${t('invoices.title').toLowerCase()}`} actionLabel={hasPermission('invoices.create') ? t('invoices.createInvoice') : undefined} onAction={hasPermission('invoices.create') ? () => navigate(ROUTES.INVOICE_CREATE) : undefined} />
      <Card><CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField placeholder={t('common.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="small" sx={{ minWidth: 250 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>{t('common.status')}</InputLabel><Select value={statusFilter} label={t('common.status')} onChange={handleStatusFilterChange}><MenuItem value="">{t('common.all')}</MenuItem>{INVOICE_STATUS_OPTIONS.map((o: { value: string; labelEn: string }) => <MenuItem key={o.value} value={o.value}>{t(`invoices.status.${o.value}`)}</MenuItem>)}</Select></FormControl>
          {hasActiveFilters && <IconButton onClick={handleClearFilters} size="small" title={t('common.clearFilters') || 'Clear filters'}><ClearIcon /></IconButton>}
        </Stack>

        {filteredInvoices.length === 0 ? (
          <EmptyState icon={InvoiceIcon} title={t('common.noData')} description={hasActiveFilters ? t('common.noResultsFilter') || 'No invoices found matching your filters' : t('invoices.noInvoices') || 'No invoices yet.'} actionLabel={hasPermission('invoices.create') ? t('invoices.createInvoice') : undefined} onAction={hasPermission('invoices.create') ? () => navigate(ROUTES.INVOICE_CREATE) : undefined} />
        ) : (
          <>
            <TableContainer><Table>
              <TableHead><TableRow>
                <TableCell>{t('invoices.invoiceNumber')}</TableCell>
                <TableCell>{t('invoices.client')}</TableCell>
                <TableCell>{t('invoices.issueDate')}</TableCell>
                <TableCell>{t('invoices.dueDate')}</TableCell>
                <TableCell>{t('invoices.amount')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${invoice.id}`)}>
                    <TableCell sx={{ fontWeight: 500 }}>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.clientDetails?.name || '-'}</TableCell>
                    <TableCell>{invoice.issueDate ? formatDate(invoice.issueDate) : '-'}</TableCell>
                    <TableCell>
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.dueDate && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {calculateDaysRemaining(invoice.dueDate) > 0 ? `${calculateDaysRemaining(invoice.dueDate)} days left` : `${Math.abs(calculateDaysRemaining(invoice.dueDate))} days overdue`}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.financialSummary?.grandTotal || 0)}</TableCell>
                    <TableCell><StatusChip type="document" value={invoice.status} label={t(`invoices.status.${invoice.status}`)} /></TableCell>
                    <TableCell align="right"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, invoice); }}><MoreIcon /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></TableContainer>
            <TablePagination component="div" count={filteredInvoices.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage={t('common.rowsPerPage')} />
          </>
        )}
      </CardContent></Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}><ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>{t('common.view')}</MenuItem>
        {hasPermission('invoices.download') && <MenuItem onClick={handleDownloadPdf}><ListItemIcon><PdfIcon fontSize="small" /></ListItemIcon>{t('invoices.downloadPdf')}</MenuItem>}
        {hasPermission('invoices.edit') && selectedInvoice?.status !== 'paid' && <MenuItem onClick={handleEdit}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>{t('common.edit')}</MenuItem>}
        {hasPermission('invoices.edit') && selectedInvoice?.status !== 'paid' && <MenuItem onClick={handleMarkAsPaid} disabled={markPaidLoading}><ListItemIcon><PaidIcon fontSize="small" color="success" /></ListItemIcon>{t('invoices.markAsPaid')}</MenuItem>}
        {hasPermission('invoices.delete') && <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>{t('common.delete')}</MenuItem>}
      </Menu>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('invoices.deleteInvoice') || 'Delete Invoice'}
        message={t('invoices.deleteConfirm', { number: selectedInvoice?.invoiceNumber }) || `Are you sure you want to delete "${selectedInvoice?.invoiceNumber}"?`}
        confirmLabel={t('common.delete')}
        confirmColor="error"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteDialogOpen(false); setSelectedInvoice(null); }}
      />
    </Box>
  );
};

export default InvoiceListPage;
