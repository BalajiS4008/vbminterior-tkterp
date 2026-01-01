import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  useTheme,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ConfirmationNumber as TicketIcon,
  Receipt as InvoiceIcon,
  Folder as ProjectIcon,
  CheckCircle as ReadIcon,
  Circle as UnreadIcon,
  Description as QuotationIcon,
  Comment as CommentIcon,
  DeleteSweep as ClearAllIcon,
} from '@mui/icons-material';
import { PageHeader, EmptyState } from '../../components/common';
import { formatRelativeTime } from '../../utils';
import { useAuth } from '../../contexts';
import { useRealtimeNotifications } from '../../hooks';
import { notificationService } from '../../services';
import { ROUTES } from '../../config/constants';
import type { Notification, NotificationType } from '../../types';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'ticket_assigned':
    case 'ticket_status_changed':
      return <TicketIcon />;
    case 'ticket_comment':
      return <CommentIcon />;
    case 'invoice_generated':
    case 'invoice_overdue':
      return <InvoiceIcon />;
    case 'project_deadline':
      return <ProjectIcon />;
    case 'quotation_approved':
    case 'quotation_rejected':
      return <QuotationIcon />;
    default:
      return <NotificationsIcon />;
  }
};

const getNotificationRoute = (notification: Notification): string | null => {
  const { type, data } = notification;

  switch (type) {
    case 'ticket_assigned':
    case 'ticket_status_changed':
    case 'ticket_comment':
      return data?.ticketId ? `${ROUTES.TICKETS}/${data.ticketId}` : null;
    case 'invoice_generated':
    case 'invoice_overdue':
      return data?.invoiceId ? `${ROUTES.INVOICES}/${data.invoiceId}` : null;
    case 'project_deadline':
      return data?.projectId ? `${ROUTES.PROJECTS}/${data.projectId}` : null;
    case 'quotation_approved':
    case 'quotation_rejected':
      return data?.quotationId ? `${ROUTES.QUOTATIONS}/${data.quotationId}` : null;
    default:
      return null;
  }
};

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: notificationsData, loading, error } = useRealtimeNotifications(currentUser?.uid || null);

  // Cast the data to proper Notification type
  const notifications = notificationsData as Notification[];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.uid) return;
    try {
      await notificationService.markAllAsRead(currentUser.uid);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleClearAll = async () => {
    if (!currentUser?.uid) return;
    try {
      await notificationService.deleteAllForUser(currentUser.uid);
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate to related item
    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader title={t('notifications.title')} />
        <Card>
          <CardContent>
            <Typography color="error">
              {t('common.error')}: {error.message}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={t('notifications.title')}
        subtitle={unreadCount > 0 ? `${unreadCount} ${t('notifications.unread')}` : undefined}
        actionLabel={unreadCount > 0 ? t('notifications.markAllRead') : undefined}
        onAction={unreadCount > 0 ? handleMarkAllAsRead : undefined}
        actionIcon={<ReadIcon />}
      />

      {notifications.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            color="error"
            startIcon={<ClearAllIcon />}
            onClick={handleClearAll}
          >
            {t('notifications.clearAll')}
          </Button>
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <EmptyState
              icon={NotificationsIcon}
              title={t('notifications.noNotifications')}
            />
          ) : (
            <List disablePadding>
              {notifications.map((notification, index) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    borderBottom:
                      index < notifications.length - 1
                        ? `1px solid ${theme.palette.divider}`
                        : 'none',
                    backgroundColor: notification.isRead
                      ? 'transparent'
                      : theme.palette.primary.main + '08',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  secondaryAction={
                    !notification.isRead && (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        aria-label="mark as read"
                      >
                        <ReadIcon fontSize="small" color="primary" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[100],
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!notification.isRead && (
                          <UnreadIcon
                            sx={{
                              fontSize: 8,
                              color: theme.palette.primary.main,
                            }}
                          />
                        )}
                        <Typography variant="subtitle2">
                          {notification.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatRelativeTime(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationsPage;
