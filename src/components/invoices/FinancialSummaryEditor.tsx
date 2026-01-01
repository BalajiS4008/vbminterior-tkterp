import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
  Divider,
  useTheme,
} from '@mui/material';
import type { FinancialSummary } from '../../types';
import { formatCurrency } from '../../utils';

interface FinancialSummaryEditorProps {
  subtotal: number;
  summary: FinancialSummary;
  onChange: (summary: FinancialSummary) => void;
  enableDiscount?: boolean;
  enableTax?: boolean;
  enableAdditionalCharges?: boolean;
  readOnly?: boolean;
}

const FinancialSummaryEditor: React.FC<FinancialSummaryEditorProps> = ({
  subtotal,
  summary,
  onChange,
  enableDiscount = true,
  enableTax = true,
  enableAdditionalCharges = false,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const calculateSummary = (updates: Partial<FinancialSummary>): FinancialSummary => {
    const newSummary = { ...summary, ...updates, subtotal };

    // Calculate discount
    if (newSummary.discountPercent && newSummary.discountPercent > 0) {
      newSummary.discountAmount = Math.round(subtotal * (newSummary.discountPercent / 100) * 100) / 100;
    } else {
      newSummary.discountAmount = 0;
    }

    // Calculate tax (on amount after discount)
    const taxableAmount = subtotal - (newSummary.discountAmount || 0);
    if (newSummary.taxPercent && newSummary.taxPercent > 0) {
      newSummary.taxAmount = Math.round(taxableAmount * (newSummary.taxPercent / 100) * 100) / 100;
    } else {
      newSummary.taxAmount = 0;
    }

    // Calculate grand total
    newSummary.grandTotal =
      subtotal -
      (newSummary.discountAmount || 0) +
      (newSummary.taxAmount || 0) +
      (newSummary.additionalCharges || 0);

    return newSummary;
  };

  const handleChange = (field: keyof FinancialSummary, value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const newSummary = calculateSummary({ [field]: numValue });
    onChange(newSummary);
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.grey[50],
        borderRadius: 2,
        p: 3,
        maxWidth: 400,
        ml: 'auto',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Summary
      </Typography>

      {/* Subtotal */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
        <Typography variant="body2">{t('invoices.summary.subtotal')}</Typography>
        <Typography variant="body2" fontWeight={500}>
          {formatCurrency(subtotal)}
        </Typography>
      </Box>

      {/* Discount */}
      {enableDiscount && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
          <Typography variant="body2">{t('invoices.summary.discount')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!readOnly && (
              <TextField
                type="number"
                value={summary.discountPercent || ''}
                onChange={(e) => handleChange('discountPercent', e.target.value)}
                size="small"
                sx={{ width: 80 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 100, step: 0.5 },
                }}
              />
            )}
            {summary.discountAmount && summary.discountAmount > 0 ? (
              <Typography variant="body2" color="error.main" sx={{ minWidth: 80, textAlign: 'right' }}>
                -{formatCurrency(summary.discountAmount)}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, textAlign: 'right' }}>
                -
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Tax */}
      {enableTax && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
          <Typography variant="body2">{t('invoices.summary.tax')} (GST)</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!readOnly && (
              <TextField
                type="number"
                value={summary.taxPercent || ''}
                onChange={(e) => handleChange('taxPercent', e.target.value)}
                size="small"
                sx={{ width: 80 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 100, step: 0.5 },
                }}
              />
            )}
            {summary.taxAmount && summary.taxAmount > 0 ? (
              <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right' }}>
                {formatCurrency(summary.taxAmount)}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, textAlign: 'right' }}>
                -
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Additional Charges */}
      {enableAdditionalCharges && (
        <Box sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">{t('invoices.summary.additionalCharges')}</Typography>
            {!readOnly ? (
              <TextField
                type="number"
                value={summary.additionalCharges || ''}
                onChange={(e) => handleChange('additionalCharges', e.target.value)}
                size="small"
                sx={{ width: 120 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0, step: 100 },
                }}
              />
            ) : (
              <Typography variant="body2">
                {summary.additionalCharges ? formatCurrency(summary.additionalCharges) : '-'}
              </Typography>
            )}
          </Box>
          {!readOnly && summary.additionalCharges && summary.additionalCharges > 0 && (
            <TextField
              value={summary.additionalChargesDescription || ''}
              onChange={(e) =>
                onChange({ ...summary, additionalChargesDescription: e.target.value })
              }
              placeholder="Description (e.g., Transportation)"
              size="small"
              fullWidth
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Grand Total */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="primary">
          {t('invoices.summary.grandTotal')}
        </Typography>
        <Typography variant="h5" fontWeight={600} color="primary">
          {formatCurrency(summary.grandTotal)}
        </Typography>
      </Box>
    </Box>
  );
};

export default FinancialSummaryEditor;
