import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Card, CardContent, Typography, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { Edit as EditIcon, PictureAsPdf as PdfIcon, SwapHoriz as ConvertIcon, Description as QuotationIcon } from '@mui/icons-material';
import { PageHeader, StatusChip, EmptyState, LoadingSpinner } from '../../components/common';
import { useAuth, useNotification } from '../../contexts';
import { useRealtimeDocument } from '../../hooks';
import { ROUTES } from '../../config/constants';
import { formatDate, formatCurrency } from '../../utils';
import type { Quotation, DocumentStatus } from '../../types';
import type { DocumentData } from 'firebase/firestore';

const quotationMapper = (doc: DocumentData): Quotation => ({
  ...doc,
  issueDate: doc.issueDate?.toDate?.() || doc.createdDate?.toDate?.() || new Date(),
  expiryDate: doc.expiryDate?.toDate?.() || doc.validUntil?.toDate?.() || new Date(),
  createdAt: doc.createdAt?.toDate?.() || new Date(),
  updatedAt: doc.updatedAt?.toDate?.() || new Date(),
} as Quotation);

const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const { showSuccess } = useNotification();

  const { data: quotation, loading, error } = useRealtimeDocument<Quotation>('quotations', id || null, quotationMapper);

  const handleEdit = () => { navigate(`/quotations/${id}/edit`); };

  const handleDownloadPdf = useCallback(() => {
    if (!quotation) return;
    // Basic PDF generation using browser print
    const printContent = document.getElementById('quotation-preview');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>${quotation.quotationNumber}</title>
          <style>body { font-family: Arial, sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f5f5f5; }</style>
          </head><body>${printContent.innerHTML}</body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    showSuccess(t('invoices.pdfGenerated') || 'PDF generated');
  }, [quotation, showSuccess, t]);

  const handleConvertToInvoice = () => { navigate(`/invoices/new?quotationId=${id}`); };

  if (loading) return <LoadingSpinner />;

  if (error || !quotation) {
    return (
      <Box>
        <PageHeader title={t('quotations.quotationDetails')} breadcrumbs={[{ label: t('quotations.title'), path: ROUTES.QUOTATIONS }, { label: 'Not Found' }]} />
        <Card><CardContent><EmptyState icon={QuotationIcon} title={t('common.error')} description={error?.message || 'Quotation not found'} /></CardContent></Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={quotation.quotationNumber}
        breadcrumbs={[{ label: t('quotations.title'), path: ROUTES.QUOTATIONS }, { label: quotation.quotationNumber }]}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleDownloadPdf}>{t('invoices.downloadPdf')}</Button>
        {hasPermission('quotations.edit') && <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>{t('common.edit')}</Button>}
        {hasPermission('invoices.create') && quotation.status === 'approved' && <Button variant="contained" startIcon={<ConvertIcon />} onClick={handleConvertToInvoice}>{t('quotations.convertToInvoice')}</Button>}
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }} id="quotation-preview">
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="h5" fontWeight={600} color="primary">{quotation.businessDetails?.companyName || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">{quotation.businessDetails?.address || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">Phone: {quotation.businessDetails?.phone || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">Email: {quotation.businessDetails?.email || '-'}</Typography>
              {quotation.businessDetails?.gstNumber && <Typography variant="body2" color="text.secondary">GST: {quotation.businessDetails.gstNumber}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { sm: 'right' } }}>
              <Typography variant="h4" fontWeight={600} color="primary">QUOTATION</Typography>
              <Typography variant="h6">{quotation.quotationNumber}</Typography>
              <Box sx={{ mt: 2 }}><StatusChip type="document" value={quotation.status as DocumentStatus} label={t(`quotations.status.${quotation.status}`)} /></Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Bill To</Typography>
              <Typography variant="body1" fontWeight={500}>{quotation.clientDetails?.name || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">{quotation.clientDetails?.address || '-'}</Typography>
              {quotation.clientDetails?.phone && <Typography variant="body2" color="text.secondary">{quotation.clientDetails.phone}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { sm: 'right' } }}>
              <Box sx={{ mb: 1 }}><Typography variant="body2" color="text.secondary">Issue Date: <strong>{formatDate(quotation.issueDate)}</strong></Typography></Box>
              <Box><Typography variant="body2" color="text.secondary">Valid Until: <strong>{formatDate(quotation.expiryDate)}</strong></Typography></Box>
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                  <TableCell>{t('invoices.lineItems.itemName')}</TableCell>
                  <TableCell>{t('invoices.lineItems.description')}</TableCell>
                  <TableCell align="right">{t('invoices.lineItems.quantity')}</TableCell>
                  <TableCell align="right">{t('invoices.lineItems.unitPrice')}</TableCell>
                  <TableCell align="right">{t('invoices.lineItems.total')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(quotation.lineItems || []).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell align="right">{item.quantity} {item.unit || ''}</TableCell>
                    <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Box sx={{ width: 300 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography>{t('invoices.summary.subtotal')}</Typography>
                <Typography>{formatCurrency(quotation.financialSummary?.subtotal || 0)}</Typography>
              </Box>
              {quotation.financialSummary?.discountAmount && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography>{t('invoices.summary.discount')} ({quotation.financialSummary.discountPercent}%)</Typography>
                  <Typography color="error">-{formatCurrency(quotation.financialSummary.discountAmount)}</Typography>
                </Box>
              )}
              {quotation.financialSummary?.taxAmount && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography>{t('invoices.summary.tax')} ({quotation.financialSummary.taxPercent}%)</Typography>
                  <Typography>{formatCurrency(quotation.financialSummary.taxAmount)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="h6">{t('invoices.summary.grandTotal')}</Typography>
                <Typography variant="h6" color="primary">{formatCurrency(quotation.financialSummary?.grandTotal || 0)}</Typography>
              </Box>
            </Box>
          </Box>

          {(quotation.notes || quotation.termsAndConditions) && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              {quotation.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                  <Typography variant="body2" color="text.secondary">{quotation.notes}</Typography>
                </Box>
              )}
              {quotation.termsAndConditions && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Terms & Conditions</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{quotation.termsAndConditions}</Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuotationDetailPage;
