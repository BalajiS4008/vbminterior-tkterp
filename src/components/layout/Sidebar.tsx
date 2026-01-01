import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Folder as ProjectsIcon,
  ConfirmationNumber as TicketsIcon,
  ViewKanban as KanbanIcon,
  AccessTime as TimesheetIcon,
  CalendarMonth as CalendarIcon,
  People as ClientsIcon,
  Description as QuotationsIcon,
  Receipt as InvoicesIcon,
  Payment as PaymentsIcon,
  MoneyOff as ExpensesIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ROUTES } from '../../config/constants';

const DRAWER_WIDTH = 280;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  createPath?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const mainNavItems: NavItem[] = [
    {
      label: t('dashboard.title'),
      icon: <DashboardIcon />,
      path: ROUTES.DASHBOARD,
    },
  ];

  const managementNavItems: NavItem[] = [
    {
      label: t('projects.title'),
      icon: <ProjectsIcon />,
      path: ROUTES.PROJECTS,
      createPath: ROUTES.PROJECT_CREATE,
    },
    {
      label: t('tickets.title'),
      icon: <TicketsIcon />,
      path: ROUTES.TICKETS,
      createPath: ROUTES.TICKET_CREATE,
    },
    {
      label: 'Kanban Board',
      icon: <KanbanIcon />,
      path: ROUTES.TICKET_KANBAN,
    },
    {
      label: 'Timesheet',
      icon: <TimesheetIcon />,
      path: ROUTES.TIMESHEET,
      createPath: ROUTES.TIMESHEET_CREATE,
    },
    {
      label: 'Calendar',
      icon: <CalendarIcon />,
      path: ROUTES.CALENDAR,
    },
    {
      label: 'Clients',
      icon: <ClientsIcon />,
      path: ROUTES.CLIENTS,
      createPath: ROUTES.CLIENT_CREATE,
    },
  ];

  const financeNavItems: NavItem[] = [
    {
      label: t('quotations.title'),
      icon: <QuotationsIcon />,
      path: ROUTES.QUOTATIONS,
      createPath: ROUTES.QUOTATION_CREATE,
    },
    {
      label: t('invoices.title'),
      icon: <InvoicesIcon />,
      path: ROUTES.INVOICES,
      createPath: ROUTES.INVOICE_CREATE,
    },
    {
      label: 'Payments',
      icon: <PaymentsIcon />,
      path: ROUTES.PAYMENTS,
      createPath: ROUTES.PAYMENT_CREATE,
    },
    {
      label: 'Expenses',
      icon: <ExpensesIcon />,
      path: ROUTES.EXPENSES,
      createPath: ROUTES.EXPENSE_CREATE,
    },
    {
      label: 'Reports',
      icon: <ReportsIcon />,
      path: ROUTES.REPORTS,
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      label: t('notifications.title'),
      icon: <NotificationsIcon />,
      path: ROUTES.NOTIFICATIONS,
    },
    {
      label: t('settings.title'),
      icon: <SettingsIcon />,
      path: ROUTES.SETTINGS,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    if (path === ROUTES.DASHBOARD) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path);
    return (
      <ListItem
        key={item.path}
        disablePadding
        sx={{ mb: 0.5 }}
        secondaryAction={
          item.createPath ? (
            <Tooltip title="Create New" placement="right">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation(item.createPath!);
                }}
                sx={{
                  opacity: 0,
                  transition: 'all 0.2s',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  },
                  '.MuiListItem-root:hover &': {
                    opacity: 1,
                  },
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null
        }
      >
        <ListItemButton
          onClick={() => handleNavigation(item.path)}
          selected={active}
          sx={{
            borderRadius: 2,
            py: 1.2,
            mr: item.createPath ? 5 : 0,
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.light, 0.15)} 100%)`,
              },
              '& .MuiListItemIcon-root': {
                color: theme.palette.primary.main,
              },
              '& .MuiListItemText-primary': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
            },
            '&:hover': {
              bgcolor: alpha(theme.palette.action.hover, 0.08),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 44, color: active ? theme.palette.primary.main : 'inherit' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: active ? 600 : 500,
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderNavSection = (items: NavItem[], sectionTitle?: string) => (
    <>
      {sectionTitle && (
        <Typography
          variant="overline"
          sx={{
            px: 3,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            letterSpacing: 1.2,
            fontSize: '0.7rem',
          }}
        >
          {sectionTitle}
        </Typography>
      )}
      <List sx={{ px: 1.5, py: 0 }}>
        {items.map((item) => renderNavItem(item))}
      </List>
    </>
  );

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark'
          ? theme.palette.background.paper
          : `linear-gradient(180deg, #ffffff 0%, ${alpha(theme.palette.grey[50], 0.8)} 100%)`,
      }}
    >
      {/* Logo / Brand */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
        }}
        onClick={() => handleNavigation(ROUTES.DASHBOARD)}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
          }}
        >
          CT
        </Box>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Construction
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            Ticket Manager
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.6 }} />

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, py: 1, overflowY: 'auto' }}>
        {renderNavSection(mainNavItems)}

        <Box sx={{ mt: 1 }}>
          {renderNavSection(managementNavItems, 'Management')}
        </Box>

        <Box sx={{ mt: 1 }}>
          {renderNavSection(financeNavItems, 'Finance')}
        </Box>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.6 }} />

      {/* Bottom Navigation */}
      <Box sx={{ py: 1 }}>{renderNavSection(bottomNavItems)}</Box>

      {/* Version Info */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            display: 'block',
            textAlign: 'center',
          }}
        >
          v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={isMobile ? open : true}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          boxShadow: theme.palette.mode === 'dark'
            ? 'none'
            : `2px 0 8px ${alpha(theme.palette.common.black, 0.04)}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
