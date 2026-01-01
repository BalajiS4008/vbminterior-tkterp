import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Zoom,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ConfirmationNumber as TicketsIcon,
  Add as AddIcon,
  Receipt as InvoicesIcon,
  Menu as MenuIcon,
  Folder as ProjectsIcon,
  People as ClientsIcon,
  Description as QuotationsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { ROUTES } from '../../config/constants';

const MobileBottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  const getCurrentValue = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 0;
    if (path.startsWith('/tickets')) return 1;
    if (path.startsWith('/invoices')) return 3;
    return -1;
  };

  const handleNavigation = (newValue: number) => {
    switch (newValue) {
      case 0:
        navigate(ROUTES.DASHBOARD);
        break;
      case 1:
        navigate(ROUTES.TICKETS);
        break;
      case 3:
        navigate(ROUTES.INVOICES);
        break;
    }
  };

  const handleAddClick = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  const addMenuItems = [
    { label: 'New Ticket', icon: <TicketsIcon />, path: ROUTES.TICKET_CREATE },
    { label: 'New Project', icon: <ProjectsIcon />, path: ROUTES.PROJECT_CREATE },
    { label: 'New Client', icon: <ClientsIcon />, path: ROUTES.CLIENT_CREATE },
    { label: 'New Invoice', icon: <InvoicesIcon />, path: ROUTES.INVOICE_CREATE },
    { label: 'New Quotation', icon: <QuotationsIcon />, path: ROUTES.QUOTATION_CREATE },
  ];

  const moreMenuItems = [
    { label: 'Projects', icon: <ProjectsIcon />, path: ROUTES.PROJECTS },
    { label: 'Clients', icon: <ClientsIcon />, path: ROUTES.CLIENTS },
    { label: 'Quotations', icon: <QuotationsIcon />, path: ROUTES.QUOTATIONS },
    { label: 'Notifications', icon: <NotificationsIcon />, path: ROUTES.NOTIFICATIONS },
    { label: 'Settings', icon: <SettingsIcon />, path: ROUTES.SETTINGS },
  ];

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          display: { xs: 'block', md: 'none' },
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
        elevation={8}
      >
        <MuiBottomNavigation
          value={getCurrentValue()}
          onChange={(_, newValue) => {
            if (newValue !== 2 && newValue !== 4) {
              handleNavigation(newValue);
            }
          }}
          sx={{
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 0',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              '&.Mui-selected': {
                fontSize: '0.75rem',
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Dashboard"
            icon={<DashboardIcon />}
          />
          <BottomNavigationAction
            label="Tickets"
            icon={<TicketsIcon />}
          />
          <BottomNavigationAction
            label=""
            icon={<Box sx={{ width: 56 }} />}
            disabled
          />
          <BottomNavigationAction
            label="Invoices"
            icon={<InvoicesIcon />}
          />
          <BottomNavigationAction
            label="More"
            icon={<MenuIcon />}
            onClick={handleMoreClick}
          />
        </MuiBottomNavigation>

        {/* Floating Action Button */}
        <Zoom in={true}>
          <Fab
            color="primary"
            sx={{
              position: 'absolute',
              top: -28,
              left: '50%',
              transform: 'translateX(-50%)',
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
            onClick={handleAddClick}
          >
            <AddIcon />
          </Fab>
        </Zoom>
      </Paper>

      {/* Add Menu */}
      <Menu
        anchorEl={addMenuAnchor}
        open={Boolean(addMenuAnchor)}
        onClose={handleAddMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 200,
            mb: 1,
          },
        }}
      >
        {addMenuItems.map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => {
              navigate(item.path);
              handleAddMenuClose();
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* More Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 200,
            mb: 1,
          },
        }}
      >
        {moreMenuItems.map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => {
              navigate(item.path);
              handleMoreMenuClose();
            }}
            selected={location.pathname.startsWith(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default MobileBottomNavigation;
