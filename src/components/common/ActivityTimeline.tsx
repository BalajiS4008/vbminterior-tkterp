import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as StatusIcon,
  PersonAdd as AssignIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AttachFile as AttachIcon,
  Payment as PaymentIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  FolderOpen as ProjectIcon,
  ConfirmationNumber as TicketIcon,
  Receipt as InvoiceIcon,
  RequestQuote as QuotationIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityLog, ActivityType } from '../../services/activityService';

interface ActivityTimelineProps {
  activities: ActivityLog[];
  loading?: boolean;
  showEntityLink?: boolean;
  onEntityClick?: (entityType: string, entityId: string) => void;
}

const getActivityIcon = (type: ActivityType) => {
  const iconMap: Record<string, React.ReactNode> = {
    project_created: <AddIcon />,
    project_updated: <EditIcon />,
    project_deleted: <DeleteIcon />,
    project_status_changed: <StatusIcon />,
    ticket_created: <AddIcon />,
    ticket_updated: <EditIcon />,
    ticket_deleted: <DeleteIcon />,
    ticket_status_changed: <StatusIcon />,
    ticket_assigned: <AssignIcon />,
    ticket_comment_added: <CommentIcon />,
    quotation_created: <AddIcon />,
    quotation_updated: <EditIcon />,
    quotation_sent: <SendIcon />,
    quotation_approved: <ApproveIcon />,
    quotation_rejected: <RejectIcon />,
    invoice_created: <AddIcon />,
    invoice_updated: <EditIcon />,
    invoice_sent: <SendIcon />,
    invoice_paid: <PaymentIcon />,
    user_login: <LoginIcon />,
    user_logout: <LogoutIcon />,
    user_created: <AddIcon />,
    user_updated: <EditIcon />,
    user_role_changed: <StatusIcon />,
    attachment_uploaded: <AttachIcon />,
    attachment_deleted: <DeleteIcon />,
  };
  return iconMap[type] || <EditIcon />;
};

const getActivityColor = (type: ActivityType): string => {
  if (type.includes('created') || type.includes('approved') || type.includes('paid')) {
    return '#4caf50'; // green
  }
  if (type.includes('deleted') || type.includes('rejected')) {
    return '#f44336'; // red
  }
  if (type.includes('status') || type.includes('assigned')) {
    return '#2196f3'; // blue
  }
  if (type.includes('sent')) {
    return '#9c27b0'; // purple
  }
  return '#ff9800'; // orange
};

const getEntityIcon = (entityType: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    project: <ProjectIcon fontSize="small" />,
    ticket: <TicketIcon fontSize="small" />,
    invoice: <InvoiceIcon fontSize="small" />,
    quotation: <QuotationIcon fontSize="small" />,
    user: <UserIcon fontSize="small" />,
  };
  return iconMap[entityType] || null;
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = React.memo(({
  activities,
  loading = false,
  showEntityLink = true,
  onEntityClick,
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  if (activities.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No activity recorded yet</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Timeline line */}
      <Box
        sx={{
          position: 'absolute',
          left: 19,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: theme.palette.divider,
        }}
      />

      {activities.map((activity) => (
        <Box
          key={activity.id}
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            position: 'relative',
          }}
        >
          {/* Icon */}
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: getActivityColor(activity.type),
              zIndex: 1,
            }}
          >
            {getActivityIcon(activity.type)}
          </Avatar>

          {/* Content */}
          <Box sx={{ flex: 1, pt: 0.5 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {activity.description}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
              </Typography>

              {showEntityLink && activity.entityName && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: onEntityClick ? 'pointer' : 'default',
                    color: theme.palette.primary.main,
                    '&:hover': onEntityClick
                      ? { textDecoration: 'underline' }
                      : {},
                  }}
                  onClick={() =>
                    onEntityClick?.(activity.entityType, activity.entityId)
                  }
                >
                  {getEntityIcon(activity.entityType)}
                  <Typography variant="caption">
                    {activity.entityName}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Metadata */}
            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  mt: 1,
                  p: 1,
                  backgroundColor: theme.palette.grey[50],
                }}
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(activity.metadata).map(([key, value]) => (
                    <Typography
                      key={key}
                      variant="caption"
                      sx={{
                        backgroundColor: theme.palette.grey[200],
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                      }}
                    >
                      {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
});

ActivityTimeline.displayName = 'ActivityTimeline';

export default ActivityTimeline;
