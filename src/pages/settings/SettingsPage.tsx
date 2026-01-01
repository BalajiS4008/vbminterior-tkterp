import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { useAuth, useNotification } from '../../contexts';
import { settingsService } from '../../services';
import type { BusinessDetails, InvoiceSettings } from '../../services/settingsService';
import UserManagement from './UserManagement';
import NotificationSettings from '../../components/settings/NotificationSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Business Details
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    companyName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
  });

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    enableTax: true,
    defaultTaxPercent: 18,
    enableDiscount: true,
    enableAdditionalCharges: false,
    quotationPrefix: 'QT',
    invoicePrefix: 'INV',
    ticketPrefix: 'TKT',
    defaultPaymentTerms: 15,
    termsAndConditions: '',
  });

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [business, invoice] = await Promise.all([
          settingsService.getBusinessDetails(),
          settingsService.getInvoiceSettings(),
        ]);
        setBusinessDetails(business);
        setInvoiceSettings(invoice);
      } catch (error) {
        console.error('Error fetching settings:', error);
        showError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [showError]);

  const handleSaveBusinessDetails = async () => {
    setSaving(true);
    try {
      await settingsService.saveBusinessDetails(businessDetails);
      showSuccess('Business details saved successfully');
    } catch (error) {
      console.error('Error saving business details:', error);
      showError('Failed to save business details');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvoiceSettings = async () => {
    setSaving(true);
    try {
      await settingsService.saveInvoiceSettings(invoiceSettings);
      showSuccess('Invoice settings saved successfully');
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      showError('Failed to save invoice settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader title={t('settings.title')} />

      <Card>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t('settings.business')} />
          <Tab label={t('settings.invoiceConfig')} />
          <Tab label="Notifications" />
          {hasPermission('users.manage') && <Tab label={t('settings.users')} />}
        </Tabs>

        <CardContent>
          {/* Business Details Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              {t('settings.business')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              These details will appear on your quotations and invoices.
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('settings.companyName')}
                  value={businessDetails.companyName}
                  onChange={(e) =>
                    setBusinessDetails((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('settings.gstNumber')}
                  value={businessDetails.gstNumber}
                  onChange={(e) =>
                    setBusinessDetails((prev) => ({ ...prev, gstNumber: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('common.address')}
                  value={businessDetails.address}
                  onChange={(e) =>
                    setBusinessDetails((prev) => ({ ...prev, address: e.target.value }))
                  }
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('common.phone')}
                  value={businessDetails.phone}
                  onChange={(e) =>
                    setBusinessDetails((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('common.email')}
                  value={businessDetails.email}
                  onChange={(e) =>
                    setBusinessDetails((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveBusinessDetails}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : t('settings.saveSettings')}
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Invoice Settings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              {t('settings.invoiceConfig')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure default settings for quotations and invoices.
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('settings.taxSettings')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={invoiceSettings.enableTax}
                      onChange={(e) =>
                        setInvoiceSettings((prev) => ({ ...prev, enableTax: e.target.checked }))
                      }
                    />
                  }
                  label={t('settings.enableTax')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('settings.defaultTaxPercent')}
                  type="number"
                  value={invoiceSettings.defaultTaxPercent}
                  onChange={(e) =>
                    setInvoiceSettings((prev) => ({
                      ...prev,
                      defaultTaxPercent: parseFloat(e.target.value) || 0,
                    }))
                  }
                  disabled={!invoiceSettings.enableTax}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={invoiceSettings.enableDiscount}
                      onChange={(e) =>
                        setInvoiceSettings((prev) => ({
                          ...prev,
                          enableDiscount: e.target.checked,
                        }))
                      }
                    />
                  }
                  label={t('settings.enableDiscount')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={invoiceSettings.enableAdditionalCharges}
                      onChange={(e) =>
                        setInvoiceSettings((prev) => ({
                          ...prev,
                          enableAdditionalCharges: e.target.checked,
                        }))
                      }
                    />
                  }
                  label={t('settings.enableAdditionalCharges')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Ticket Prefix"
                  value={invoiceSettings.ticketPrefix}
                  onChange={(e) =>
                    setInvoiceSettings((prev) => ({ ...prev, ticketPrefix: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Quotation Prefix"
                  value={invoiceSettings.quotationPrefix}
                  onChange={(e) =>
                    setInvoiceSettings((prev) => ({ ...prev, quotationPrefix: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Invoice Prefix"
                  value={invoiceSettings.invoicePrefix}
                  onChange={(e) =>
                    setInvoiceSettings((prev) => ({ ...prev, invoicePrefix: e.target.value }))
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Default Payment Terms (days)"
                  type="number"
                  value={invoiceSettings.defaultPaymentTerms}
                  onChange={(e) =>
                    setInvoiceSettings((prev) => ({
                      ...prev,
                      defaultPaymentTerms: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('settings.termsAndConditions')}
                  value={invoiceSettings.termsAndConditions}
                  onChange={(e) =>
                    setInvoiceSettings((prev) => ({
                      ...prev,
                      termsAndConditions: e.target.value,
                    }))
                  }
                  multiline
                  rows={4}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveInvoiceSettings}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : t('settings.saveSettings')}
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel value={tabValue} index={2}>
            <NotificationSettings />
          </TabPanel>

          {/* Users Tab */}
          {hasPermission('users.manage') && (
            <TabPanel value={tabValue} index={3}>
              <UserManagement />
            </TabPanel>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;
