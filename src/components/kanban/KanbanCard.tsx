import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Flag as PriorityIcon,
  AccessTime as DueIcon,
  Attachment as AttachmentIcon,
} from '@mui/icons-material';
import { formatDate } from '../../utils';
import type { Ticket, TicketPriority } from '../../types';

interface KanbanCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  isDragging?: boolean;
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336',
  critical: '#9C27B0',
};

const KanbanCard: React.FC<KanbanCardProps> = ({ ticket, onClick, isDragging }) => {
  const theme = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: ticket.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date();

  const handleClick = (_e: React.MouseEvent) => {
    // Only trigger click if not dragging
    if (!isSortableDragging && onClick) {
      onClick(ticket);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1.5,
        cursor: isSortableDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
        '&:active': {
          cursor: 'grabbing',
        },
        borderLeft: `4px solid ${PRIORITY_COLORS[ticket.priority]}`,
        backgroundColor: isDragging || isSortableDragging
          ? alpha(theme.palette.primary.main, 0.1)
          : theme.palette.background.paper,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {ticket.ticketNumber}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={`Priority: ${ticket.priority}`}>
              <PriorityIcon
                sx={{
                  fontSize: 16,
                  color: PRIORITY_COLORS[ticket.priority],
                }}
              />
            </Tooltip>
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="body2"
          fontWeight={500}
          sx={{
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {ticket.title}
        </Typography>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            {ticket.tags.slice(0, 2).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            ))}
            {ticket.tags.length > 2 && (
              <Chip
                label={`+${ticket.tags.length - 2}`}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            )}
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          {/* Due Date */}
          {ticket.dueDate && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: isOverdue ? 'error.main' : 'text.secondary',
              }}
            >
              <DueIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">
                {formatDate(ticket.dueDate)}
              </Typography>
            </Box>
          )}

          {/* Attachments indicator */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <AttachmentIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">{ticket.attachments.length}</Typography>
            </Box>
          )}

          {/* Assignees */}
          {ticket.assignedTo && ticket.assignedTo.length > 0 && (
            <Box sx={{ display: 'flex', gap: -0.5 }}>
              {ticket.assignedTo.slice(0, 3).map((userId) => (
                <Tooltip key={userId} title={userId}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {userId.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
              {ticket.assignedTo.length > 3 && (
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'grey.500' }}>
                  +{ticket.assignedTo.length - 3}
                </Avatar>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KanbanCard;
