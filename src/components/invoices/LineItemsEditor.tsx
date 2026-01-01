import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Button,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import type { LineItem } from '../../types';
import { formatCurrency, generateLineItemId, calculateLineItemTotal } from '../../utils';

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  readOnly?: boolean;
}

const LineItemsEditor: React.FC<LineItemsEditorProps> = ({
  items,
  onChange,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: generateLineItemId(),
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      unit: '',
      total: 0,
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };

        // Recalculate total if quantity or unitPrice changed
        if (field === 'quantity' || field === 'unitPrice') {
          const quantity = field === 'quantity' ? Number(value) : item.quantity;
          const unitPrice = field === 'unitPrice' ? Number(value) : item.unitPrice;
          updatedItem.total = calculateLineItemTotal(quantity, unitPrice);
        }

        return updatedItem;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('invoices.lineItems.title')}</Typography>
        {!readOnly && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            size="small"
          >
            {t('invoices.lineItems.addItem')}
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
              {!readOnly && <TableCell width={40}></TableCell>}
              <TableCell>{t('invoices.lineItems.itemName')}</TableCell>
              <TableCell>{t('invoices.lineItems.description')}</TableCell>
              <TableCell width={100} align="center">
                {t('invoices.lineItems.quantity')}
              </TableCell>
              <TableCell width={80}>Unit</TableCell>
              <TableCell width={120} align="right">
                {t('invoices.lineItems.unitPrice')}
              </TableCell>
              <TableCell width={120} align="right">
                {t('invoices.lineItems.total')}
              </TableCell>
              {!readOnly && <TableCell width={50}></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 6 : 8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No items added yet. Click "Add Item" to add line items.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} hover>
                  {!readOnly && (
                    <TableCell>
                      <DragIcon
                        sx={{ color: 'text.disabled', cursor: 'grab', fontSize: 20 }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {readOnly ? (
                      <Typography variant="body2">{item.name}</Typography>
                    ) : (
                      <TextField
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                        size="small"
                        fullWidth
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <Typography variant="body2" color="text.secondary">
                        {item.description || '-'}
                      </Typography>
                    ) : (
                      <TextField
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Description"
                        size="small"
                        fullWidth
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {readOnly ? (
                      <Typography variant="body2">{item.quantity}</Typography>
                    ) : (
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        size="small"
                        variant="standard"
                        InputProps={{
                          disableUnderline: true,
                          inputProps: { min: 0, step: 1, style: { textAlign: 'center' } },
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <Typography variant="body2">{item.unit || '-'}</Typography>
                    ) : (
                      <TextField
                        value={item.unit || ''}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        placeholder="pcs"
                        size="small"
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {readOnly ? (
                      <Typography variant="body2">{formatCurrency(item.unitPrice)}</Typography>
                    ) : (
                      <TextField
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        size="small"
                        variant="standard"
                        InputProps={{
                          disableUnderline: true,
                          inputProps: { min: 0, step: 0.01, style: { textAlign: 'right' } },
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(item.total)}
                    </Typography>
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveItem(item.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}

            {/* Subtotal Row */}
            {items.length > 0 && (
              <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                <TableCell colSpan={readOnly ? 5 : 6} align="right">
                  <Typography variant="subtitle2">{t('invoices.summary.subtotal')}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight={600}>
                    {formatCurrency(subtotal)}
                  </Typography>
                </TableCell>
                {!readOnly && <TableCell />}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LineItemsEditor;
