import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Typography,
  useTheme,
  CircularProgress,
  Divider,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Person as PersonIcon,
  Security as PermissionIcon,
} from '@mui/icons-material';
import { ConfirmDialog, EmptyState, LoadingSpinner } from '../../components/common';
import { PermissionEditor } from '../../components/settings';
import { useNotification } from '../../contexts';
import { userService } from '../../services';
import type { User, UserRole, Permission } from '../../types';
import { roleLabels, getPermissionsForRole, mergePermissions } from '../../config/permissions';
import { generateInitials, formatDate } from '../../utils';

interface UserFormData {
  email: string;
  displayName: string;
  phone: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
}

const initialFormData: UserFormData = {
  email: '',
  displayName: '',
  phone: '',
  role: 'worker',
  password: '',
  confirmPassword: '',
};

const UserManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const lang = i18n.language as 'en' | 'ta';
  const { showSuccess, showError } = useNotification();

  const [users, setUsers] = useState<User[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Permission editor state
  const [customAdditions, setCustomAdditions] = useState<Permission[]>([]);
  const [customRemovals, setCustomRemovals] = useState<Permission[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await userService.getAll();
      setUsers(allUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      showError(t('common.error') || 'Failed to load users');
    } finally {
      setPageLoading(false);
    }
  }, [showError, t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddUser = () => {
    setIsEditing(false);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleEditUser = () => {
    if (selectedUser) {
      setIsEditing(true);
      setFormData({
        email: selectedUser.email,
        displayName: selectedUser.displayName,
        phone: selectedUser.phone || '',
        role: selectedUser.role,
        password: '',
        confirmPassword: '',
      });
      setDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleEditPermissions = () => {
    if (selectedUser) {
      setCustomAdditions(selectedUser.customPermissions?.additions || []);
      setCustomRemovals(selectedUser.customPermissions?.removals || []);
      setPermissionDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleToggleActive = async () => {
    if (!selectedUser) return;
    try {
      if (selectedUser.isActive) {
        await userService.deactivate(selectedUser.id);
        showSuccess(t('settings.userDeactivated') || 'User deactivated successfully');
      } else {
        await userService.activate(selectedUser.id);
        showSuccess(t('settings.userActivated') || 'User activated successfully');
      }
      loadUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      showError(t('common.error') || 'Failed to update user status');
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      await userService.delete(selectedUser.id);
      showSuccess(t('settings.userDeleted') || 'User deleted successfully');
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      showError(t('common.error') || 'Failed to delete user');
    }
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setFormData(initialFormData);
  };

  const handlePermissionDialogClose = () => {
    setPermissionDialogOpen(false);
    setSelectedUser(null);
    setCustomAdditions([]);
    setCustomRemovals([]);
  };

  const handleFormChange =
    (field: keyof UserFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handlePermissionChange = (additions: Permission[], removals: Permission[]) => {
    setCustomAdditions(additions);
    setCustomRemovals(removals);
  };

  const handleResetPermissions = () => {
    setCustomAdditions([]);
    setCustomRemovals([]);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setPermissionLoading(true);
    try {
      await userService.updateCustomPermissions(selectedUser.id, customAdditions, customRemovals);
      showSuccess(lang === 'en' ? 'Permissions updated successfully' : 'அனுமதிகள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன');
      loadUsers();
      handlePermissionDialogClose();
    } catch (err) {
      console.error('Error updating permissions:', err);
      showError(t('common.error') || 'Failed to update permissions');
    } finally {
      setPermissionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.displayName || !formData.email) {
      showError(t('common.requiredFields') || 'Please fill in all required fields');
      return;
    }
    if (!isEditing && formData.password !== formData.confirmPassword) {
      showError(t('auth.passwordMismatch') || 'Passwords do not match');
      return;
    }
    if (!isEditing && formData.password.length < 6) {
      showError(t('auth.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && selectedUser) {
        await userService.update(selectedUser.id, {
          displayName: formData.displayName,
          phone: formData.phone || undefined,
          role: formData.role,
        });
        // If role changed, clear custom permissions
        if (selectedUser.role !== formData.role) {
          await userService.resetToRoleDefaults(selectedUser.id);
        }
        showSuccess(t('settings.userUpdated') || 'User updated successfully');
      } else {
        await userService.create(formData.email, formData.password, {
          displayName: formData.displayName,
          phone: formData.phone || undefined,
          role: formData.role,
        });
        showSuccess(t('settings.userCreated') || 'User created successfully');
      }
      loadUsers();
      handleDialogClose();
    } catch (err: any) {
      console.error('Error saving user:', err);
      if (err.code === 'auth/email-already-in-use') {
        showError(t('auth.emailExists') || 'Email already in use');
      } else {
        showError(t('common.error') || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return theme.palette.error.main;
      case 'supervisor':
        return theme.palette.primary.main;
      case 'worker':
        return theme.palette.success.main;
      case 'client':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const hasCustomPermissions = (user: User): boolean => {
    return (
      (user.customPermissions?.additions?.length || 0) > 0 ||
      (user.customPermissions?.removals?.length || 0) > 0
    );
  };

  // Calculate current permissions for the permission editor
  const currentPermissions = selectedUser
    ? mergePermissions(
        getPermissionsForRole(selectedUser.role),
        customAdditions,
        customRemovals
      )
    : [];

  if (pageLoading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">{t('settings.users')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddUser}>
          {t('settings.addUser') || 'Add User'}
        </Button>
      </Box>

      {users.length === 0 ? (
        <EmptyState
          icon={PersonIcon}
          title={t('settings.noUsers') || 'No users found'}
          description={t('settings.noUsersDescription') || 'Add your first user to get started'}
          actionLabel={t('settings.addUser') || 'Add User'}
          onAction={handleAddUser}
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('settings.user')}</TableCell>
                <TableCell>{t('common.email')}</TableCell>
                <TableCell>{t('settings.role')}</TableCell>
                <TableCell>{lang === 'en' ? 'Permissions' : 'அனுமதிகள்'}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('common.createdAt')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: getRoleColor(user.role) }}>
                        {generateInitials(user.displayName)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {user.displayName}
                        </Typography>
                        {user.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {user.phone}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={roleLabels[user.role][lang]}
                      size="small"
                      sx={{
                        backgroundColor: getRoleColor(user.role) + '20',
                        color: getRoleColor(user.role),
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      badgeContent={hasCustomPermissions(user) ? '!' : null}
                      color="warning"
                      sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
                    >
                      <Chip
                        label={`${user.permissions.length} ${lang === 'en' ? 'permissions' : 'அனுமதிகள்'}`}
                        size="small"
                        variant="outlined"
                        icon={<PermissionIcon sx={{ fontSize: 14 }} />}
                      />
                    </Badge>
                    {hasCustomPermissions(user) && (
                      <Typography variant="caption" display="block" color="warning.main" sx={{ mt: 0.5 }}>
                        {lang === 'en' ? 'Customized' : 'தனிப்பயனாக்கப்பட்டது'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? t('common.active') : t('common.inactive')}
                      size="small"
                      color={user.isActive ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditUser}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleEditPermissions}>
          <ListItemIcon>
            <PermissionIcon fontSize="small" />
          </ListItemIcon>
          {lang === 'en' ? 'Edit Permissions' : 'அனுமதிகளைத் திருத்து'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleToggleActive}>
          <ListItemIcon>
            {selectedUser?.isActive ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
          </ListItemIcon>
          {selectedUser?.isActive
            ? t('settings.deactivate') || 'Deactivate'
            : t('settings.activate') || 'Activate'}
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          {t('common.delete')}
        </MenuItem>
      </Menu>

      {/* User Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? t('settings.editUser') || 'Edit User' : t('settings.addUser') || 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('settings.fullName') || 'Full Name'}
              value={formData.displayName}
              onChange={handleFormChange('displayName')}
              fullWidth
              required
            />
            <TextField
              label={t('common.email')}
              type="email"
              value={formData.email}
              onChange={handleFormChange('email')}
              fullWidth
              required
              disabled={isEditing}
            />
            <TextField
              label={t('common.phone') || 'Phone'}
              value={formData.phone}
              onChange={handleFormChange('phone')}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>{t('settings.role')}</InputLabel>
              <Select
                value={formData.role}
                label={t('settings.role')}
                onChange={handleFormChange('role') as any}
              >
                <MenuItem value="admin">{t('settings.roles.admin') || 'Administrator'}</MenuItem>
                <MenuItem value="supervisor">{t('settings.roles.supervisor') || 'Supervisor'}</MenuItem>
                <MenuItem value="worker">{t('settings.roles.worker') || 'Worker'}</MenuItem>
                <MenuItem value="client">{t('settings.roles.client') || 'Client'}</MenuItem>
              </Select>
            </FormControl>
            {isEditing && selectedUser?.role !== formData.role && (
              <Typography variant="caption" color="warning.main">
                {lang === 'en'
                  ? 'Changing role will reset custom permissions to role defaults'
                  : 'பங்கை மாற்றுவது தனிப்பயன் அனுமதிகளை பங்கு இயல்புநிலைக்கு மீட்டமைக்கும்'}
              </Typography>
            )}
            {!isEditing && (
              <>
                <TextField
                  label={t('auth.password')}
                  type="password"
                  value={formData.password}
                  onChange={handleFormChange('password')}
                  fullWidth
                  required
                />
                <TextField
                  label={t('auth.confirmPassword') || 'Confirm Password'}
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleFormChange('confirmPassword')}
                  fullWidth
                  required
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDialogClose}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : isEditing ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permission Editor Dialog */}
      <Dialog
        open={permissionDialogOpen}
        onClose={handlePermissionDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: selectedUser ? getRoleColor(selectedUser.role) : 'grey' }}>
              {selectedUser ? generateInitials(selectedUser.displayName) : '?'}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {lang === 'en' ? 'Edit Permissions' : 'அனுமதிகளைத் திருத்து'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUser?.displayName} ({selectedUser ? roleLabels[selectedUser.role][lang] : ''})
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <PermissionEditor
              role={selectedUser.role}
              currentPermissions={currentPermissions}
              customAdditions={customAdditions}
              customRemovals={customRemovals}
              onChange={handlePermissionChange}
              onResetToDefaults={handleResetPermissions}
              disabled={permissionLoading}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handlePermissionDialogClose}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSavePermissions}
            disabled={permissionLoading}
            startIcon={permissionLoading ? <CircularProgress size={16} /> : <PermissionIcon />}
          >
            {lang === 'en' ? 'Save Permissions' : 'அனுமதிகளைச் சேமி'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('settings.deleteUser') || 'Delete User'}
        message={
          t('settings.deleteUserConfirm', { name: selectedUser?.displayName }) ||
          `Are you sure you want to delete "${selectedUser?.displayName}"? This action cannot be undone.`
        }
        confirmLabel={t('common.delete')}
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
      />
    </Box>
  );
};

export default UserManagement;
