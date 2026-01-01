import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Button,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Info as InfoIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import type { Permission, UserRole } from '../../types';
import {
  getPermissionsByCategory,
  permissionCategoryLabels,
  getPermissionsForRole,
  type PermissionCategory,
  type PermissionInfo,
} from '../../config/permissions';

interface PermissionEditorProps {
  role: UserRole;
  currentPermissions: Permission[];
  customAdditions: Permission[];
  customRemovals: Permission[];
  onChange: (additions: Permission[], removals: Permission[]) => void;
  onResetToDefaults: () => void;
  disabled?: boolean;
}

const PermissionEditor: React.FC<PermissionEditorProps> = ({
  role,
  currentPermissions,
  customAdditions,
  customRemovals,
  onChange,
  onResetToDefaults,
  disabled = false,
}) => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const lang = i18n.language as 'en' | 'ta';

  const rolePermissions = useMemo(() => getPermissionsForRole(role), [role]);
  const permissionsByCategory = useMemo(() => getPermissionsByCategory(), []);

  const hasCustomizations = customAdditions.length > 0 || customRemovals.length > 0;

  const isPermissionEnabled = (permission: Permission): boolean => {
    return currentPermissions.includes(permission);
  };

  const isInheritedFromRole = (permission: Permission): boolean => {
    return rolePermissions.includes(permission) && !customRemovals.includes(permission);
  };

  const isCustomAdded = (permission: Permission): boolean => {
    return customAdditions.includes(permission);
  };

  const isCustomRemoved = (permission: Permission): boolean => {
    return customRemovals.includes(permission);
  };

  const handlePermissionToggle = (permission: Permission) => {
    if (disabled) return;

    const isRoleDefault = rolePermissions.includes(permission);
    let newAdditions = [...customAdditions];
    let newRemovals = [...customRemovals];

    if (isRoleDefault) {
      // It's a role-default permission
      if (customRemovals.includes(permission)) {
        // Currently removed, restore it
        newRemovals = newRemovals.filter(p => p !== permission);
      } else {
        // Currently enabled, remove it
        newRemovals.push(permission);
      }
    } else {
      // It's not a role-default permission
      if (customAdditions.includes(permission)) {
        // Currently added, remove it
        newAdditions = newAdditions.filter(p => p !== permission);
      } else {
        // Not added, add it
        newAdditions.push(permission);
      }
    }

    onChange(newAdditions, newRemovals);
  };

  const getPermissionStatus = (permission: Permission): 'inherited' | 'added' | 'removed' | 'available' => {
    if (isCustomAdded(permission)) return 'added';
    if (isCustomRemoved(permission)) return 'removed';
    if (isInheritedFromRole(permission)) return 'inherited';
    return 'available';
  };

  const getStatusColor = (status: 'inherited' | 'added' | 'removed' | 'available') => {
    switch (status) {
      case 'inherited': return theme.palette.primary.main;
      case 'added': return theme.palette.success.main;
      case 'removed': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getStatusLabel = (status: 'inherited' | 'added' | 'removed' | 'available') => {
    switch (status) {
      case 'inherited': return lang === 'en' ? 'Inherited' : 'மரபுரிமை';
      case 'added': return lang === 'en' ? 'Custom Added' : 'தனிப்பயன் சேர்க்கப்பட்டது';
      case 'removed': return lang === 'en' ? 'Removed' : 'நீக்கப்பட்டது';
      default: return lang === 'en' ? 'Available' : 'கிடைக்கும்';
    }
  };

  const renderPermissionItem = (permInfo: PermissionInfo) => {
    const status = getPermissionStatus(permInfo.key);
    const isEnabled = isPermissionEnabled(permInfo.key);

    return (
      <Box
        key={permInfo.key}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1,
          px: 2,
          borderRadius: 1,
          mb: 0.5,
          bgcolor: status === 'removed'
            ? alpha(theme.palette.error.main, 0.05)
            : status === 'added'
            ? alpha(theme.palette.success.main, 0.05)
            : 'transparent',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={isEnabled}
              onChange={() => handlePermissionToggle(permInfo.key)}
              disabled={disabled}
              sx={{
                color: getStatusColor(status),
                '&.Mui-checked': {
                  color: getStatusColor(status),
                },
              }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                {permInfo.label[lang]}
              </Typography>
              <Tooltip title={permInfo.description[lang]} arrow>
                <InfoIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
              </Tooltip>
            </Box>
          }
          sx={{ flex: 1, m: 0 }}
        />
        <Chip
          label={getStatusLabel(status)}
          size="small"
          sx={{
            bgcolor: alpha(getStatusColor(status), 0.1),
            color: getStatusColor(status),
            fontWeight: 500,
            fontSize: '0.7rem',
            height: 22,
          }}
        />
      </Box>
    );
  };

  const categoryOrder: PermissionCategory[] = ['projects', 'tickets', 'documents', 'media', 'admin'];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {lang === 'en' ? 'Permissions' : 'அனுமதிகள்'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {lang === 'en'
              ? 'Customize permissions for this user beyond their role defaults'
              : 'இந்த பயனருக்கு அவர்களின் பங்கு இயல்புநிலைகளுக்கு அப்பால் அனுமதிகளைத் தனிப்பயனாக்கவும்'}
          </Typography>
        </Box>
        {hasCustomizations && (
          <Button
            size="small"
            startIcon={<ResetIcon />}
            onClick={onResetToDefaults}
            disabled={disabled}
            color="warning"
          >
            {lang === 'en' ? 'Reset to Defaults' : 'இயல்புநிலைக்கு மீட்டமை'}
          </Button>
        )}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.primary.main }} />
          <Typography variant="caption">{lang === 'en' ? 'Inherited from role' : 'பங்கிலிருந்து மரபுரிமை'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.success.main }} />
          <Typography variant="caption">{lang === 'en' ? 'Custom added' : 'தனிப்பயன் சேர்க்கப்பட்டது'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.error.main }} />
          <Typography variant="caption">{lang === 'en' ? 'Removed' : 'நீக்கப்பட்டது'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.text.secondary }} />
          <Typography variant="caption">{lang === 'en' ? 'Available to add' : 'சேர்க்க கிடைக்கும்'}</Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Permission Categories */}
      {categoryOrder.map((category) => {
        const permissions = permissionsByCategory[category] || [];
        if (permissions.length === 0) return null;

        const enabledCount = permissions.filter(p => isPermissionEnabled(p.key)).length;

        return (
          <Accordion key={category} defaultExpanded sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography fontWeight={500}>
                  {permissionCategoryLabels[category][lang]}
                </Typography>
                <Chip
                  label={`${enabledCount}/${permissions.length}`}
                  size="small"
                  color={enabledCount === permissions.length ? 'success' : 'default'}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {permissions.map(renderPermissionItem)}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default PermissionEditor;
