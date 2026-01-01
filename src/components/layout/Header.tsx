import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Badge,
  Tooltip,
  ListItemIcon,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Language as LanguageIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth, useTheme as useAppTheme, useNotification } from '../../contexts';
import { useUnreadNotificationCount } from '../../hooks';
import { ROUTES, STORAGE_KEYS } from '../../config/constants';
import { generateInitials } from '../../utils';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();
  const { userData, logout, currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { count: unreadCount } = useUnreadNotificationCount(currentUser?.uid || null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLangAnchorEl(null);
  };

  const handleLanguageChange = (lang: 'en' | 'ta') => {
    i18n.changeLanguage(lang);
    localStorage.setItem(STORAGE_KEYS.USER_LANGUAGE, lang);
    handleLanguageMenuClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess(t('auth.logoutSuccess'));
      navigate(ROUTES.LOGIN);
    } catch (error) {
      showError(t('common.error'));
    }
    handleProfileMenuClose();
  };

  const handleNavigateToProfile = () => {
    navigate(ROUTES.SETTINGS_PROFILE);
    handleProfileMenuClose();
  };

  const handleNavigateToSettings = () => {
    navigate(ROUTES.SETTINGS);
    handleProfileMenuClose();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2, color: theme.palette.text.primary }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, color: theme.palette.text.primary }}
        >
          {/* Page title can be dynamic based on route */}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Language Switcher */}
          <Tooltip title={t('settings.language')}>
            <IconButton
              onClick={handleLanguageMenuOpen}
              sx={{ color: theme.palette.text.secondary }}
            >
              <LanguageIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={langAnchorEl}
            open={Boolean(langAnchorEl)}
            onClose={handleLanguageMenuClose}
          >
            <MenuItem
              onClick={() => handleLanguageChange('en')}
              selected={i18n.language === 'en'}
            >
              English
            </MenuItem>
            <MenuItem
              onClick={() => handleLanguageChange('ta')}
              selected={i18n.language === 'ta'}
            >
              தமிழ்
            </MenuItem>
          </Menu>

          {/* Theme Toggle */}
          <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
            <IconButton
              onClick={toggleTheme}
              sx={{ color: theme.palette.text.secondary }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title={t('notifications.title')}>
            <IconButton
              onClick={() => navigate(ROUTES.NOTIFICATIONS)}
              sx={{ color: theme.palette.text.secondary }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Tooltip title={userData?.displayName || t('settings.profile')}>
            <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 1 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.875rem',
                }}
                src={userData?.avatarUrl}
              >
                {generateInitials(userData?.displayName || '')}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: { width: 200, mt: 1 },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {userData?.displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {userData?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleNavigateToProfile}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              {t('settings.profile')}
            </MenuItem>
            <MenuItem onClick={handleNavigateToSettings}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              {t('settings.title')}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              {t('auth.logout')}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
