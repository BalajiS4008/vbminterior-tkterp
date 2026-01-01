import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, TextField, InputAdornment, Menu, MenuItem, ListItemIcon, FormControl, InputLabel, Select, Stack } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search as SearchIcon, MoreVert as MoreIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Description as QuotationIcon, SwapHoriz as ConvertIcon, Clear as ClearIcon } from '@mui/icons-material';
import { PageHeader, StatusChip, EmptyState, ConfirmDialog, LoadingSpinner } from '../../components/common';
import { useAuth, useNotification } from '../../contexts';
import { useDebounce, useRealtimeQuotations } from '../../hooks';
import { quotationService } from '../../services';
import { ROUTES, DEFAULT_PAGE_SIZE, QUOTATION_STATUS_OPTIONS } from '../../config/constants';
import { formatDate, formatCurrency } from '../../utils';
import type { Quotation, DocumentStatus } from '../../types';
const QuotationListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');
  const { data: quotations, loading, error } = useRealtimeQuotations();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredQuotations = useMemo(() => {
    let result = (quotations || []) as unknown as Quotation[];
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter((q) => q.quotationNumber?.toLowerCase().includes(query) || q.clientDetails?.name?.toLowerCase().includes(query));
    }
    if (statusFilter) result = result.filter((q) => q.status === statusFilter);
    return result;
  }, [quotations, debouncedSearchQuery, statusFilter]);

  const paginatedQuotations = useMemo(() => filteredQuotations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredQuotations, page, rowsPerPage]);
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, quotation: Quotation) => { setAnchorEl(event.currentTarget); setSelectedQuotation(quotation); }, []);
  const handleMenuClose = useCallback(() => { setAnchorEl(null); setSelectedQuotation(null); }, []);
  const handleView = useCallback(() => { if (selectedQuotation) navigate(`/quotations/${selectedQuotation.id}`); handleMenuClose(); }, [selectedQuotation, navigate, handleMenuClose]);
  const handleEdit = useCallback(() => { if (selectedQuotation) navigate(`/quotations/${selectedQuotation.id}/edit`); handleMenuClose(); }, [selectedQuotation, navigate, handleMenuClose]);
  const handleConvertToInvoice = useCallback(() => { if (selectedQuotation) navigate(`/invoices/new?quotationId=${selectedQuotation.id}`); handleMenuClose(); }, [selectedQuotation, navigate, handleMenuClose]);
  const handleDeleteClick = useCallback(() => { setDeleteDialogOpen(true); setAnchorEl(null); }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedQuotation) return;
    setDeleteLoading(true);
    try { await quotationService.delete(selectedQuotation.id); showSuccess(t('quotations.deleteSuccess') || 'Quotation deleted successfully'); }
    catch (err) { console.error('Error deleting quotation:', err); showError(t('common.error') || 'Failed to delete quotation'); }
    finally { setDeleteLoading(false); setDeleteDialogOpen(false); setSelectedQuotation(null); }
  }, [selectedQuotation, showSuccess, showError, t]);

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => { setStatusFilter(event.target.value as DocumentStatus | ''); setPage(0); };
  const handleClearFilters = () => { setStatusFilter(''); setSearchQuery(''); setPage(0); };
  const hasActiveFilters = statusFilter || searchQuery;

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <Box>
        <PageHeader title={t('quotations.title')} actionLabel={hasPermission('quotations.create') ? t('quotations.createQuotation') : undefined} onAction={hasPermission('quotations.create') ? () => navigate(ROUTES.QUOTATION_CREATE) : undefined} />
        <Card><CardContent><EmptyState icon={QuotationIcon} title={t('common.error')} description={error.message || 'Failed to load quotations'} /></CardContent></Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title={t('quotations.title')} subtitle={`${filteredQuotations.length} ${t('quotations.title').toLowerCase()}`} actionLabel={hasPermission('quotations.create') ? t('quotations.createQuotation') : undefined} onAction={hasPermission('quotations.create') ? () => navigate(ROUTES.QUOTATION_CREATE) : undefined} />
      <Card><CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField placeholder={t('common.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="small" sx={{ minWidth: 250 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>{t('common.status')}</InputLabel><Select value={statusFilter} label={t('common.status')} onChange={handleStatusFilterChange}><MenuItem value="">{t('common.all')}</MenuItem>{QUOTATION_STATUS_OPTIONS.map((o: { value: string; labelEn: string }) => <MenuItem key={o.value} value={o.value}>{t(`quotations.status.${o.value}`)}</MenuItem>)}</Select></FormControl>
          {hasActiveFilters && <IconButton onClick={handleClearFilters} size="small" title={t('common.clearFilters') || 'Clear filters'}><ClearIcon /></IconButton>}
        </Stack>

        {filteredQuotations.length === 0 ? (
          <EmptyState icon={QuotationIcon} title={t('common.noData')} description={hasActiveFilters ? t('common.noResultsFilter') || 'No quotations found matching your filters' : t('quotations.noQuotations') || 'No quotations yet.'} actionLabel={hasPermission('quotations.create') ? t('quotations.createQuotation') : undefined} onAction={hasPermission('quotations.create') ? () => navigate(ROUTES.QUOTATION_CREATE) : undefined} />
        ) : (
          <>
            <TableContainer><Table>
              <TableHead><TableRow>
                <TableCell>{t('quotations.quotationNumber')}</TableCell>
                <TableCell>{t('quotations.client')}</TableCell>
                <TableCell>{t('quotations.issueDate')}</TableCell>
                <TableCell>{t('quotations.expiryDate')}</TableCell>
                <TableCell>{t('quotations.amount')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {paginatedQuotations.map((quotation) => (
                  <TableRow key={quotation.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/quotations/${quotation.id}`)}>
                    <TableCell sx={{ fontWeight: 500 }}>{quotation.quotationNumber}</TableCell>
                    <TableCell>{quotation.clientDetails?.name || '-'}</TableCell>
                    <TableCell>{quotation.issueDate ? formatDate(quotation.issueDate) : '-'}</TableCell>
                    <TableCell>{quotation.expiryDate ? formatDate(quotation.expiryDate) : '-'}</TableCell>
                    <TableCell>{formatCurrency(quotation.financialSummary?.grandTotal || 0)}</TableCell>
                    <TableCell><StatusChip type="document" value={quotation.status} label={t(`quotations.status.${quotation.status}`)} /></TableCell>
                    <TableCell align="right"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, quotation); }}><MoreIcon /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></TableContainer>
            <TablePagination component="div" count={filteredQuotations.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} labelRowsPerPage={t('common.rowsPerPage')} />
          </>
        )}
      </CardContent></Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}><ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>{t('common.view')}</MenuItem>
        {hasPermission('quotations.edit') && <MenuItem onClick={handleEdit}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>{t('common.edit')}</MenuItem>}
        {hasPermission('invoices.create') && selectedQuotation?.status === 'approved' && <MenuItem onClick={handleConvertToInvoice}><ListItemIcon><ConvertIcon fontSize="small" /></ListItemIcon>{t('quotations.convertToInvoice')}</MenuItem>}
        {hasPermission('quotations.delete') && <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>{t('common.delete')}</MenuItem>}
      </Menu>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('quotations.deleteQuotation') || 'Delete Quotation'}
        message={t('quotations.deleteConfirm', { number: selectedQuotation?.quotationNumber }) || `Are you sure you want to delete "${selectedQuotation?.quotationNumber}"?`}
        confirmLabel={t('common.delete')}
        confirmColor="error"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteDialogOpen(false); setSelectedQuotation(null); }}
      />
    </Box>
  );
};

export default QuotationListPage;
