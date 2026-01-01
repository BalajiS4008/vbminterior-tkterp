import React from 'react';
import { Chip, type ChipProps } from '@mui/material';
import {
  PROJECT_STATUS_COLORS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_COLORS,
  DOCUMENT_STATUS_COLORS,
} from '../../config/constants';
import type { ProjectStatus, TicketStatus, TicketPriority, DocumentStatus } from '../../types';

type StatusType = 'project' | 'ticket' | 'priority' | 'document';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  type: StatusType;
  value: ProjectStatus | TicketStatus | TicketPriority | DocumentStatus;
}

const StatusChip: React.FC<StatusChipProps> = React.memo(({ type, value, label, ...props }) => {
  const getColor = (): string => {
    switch (type) {
      case 'project':
        return PROJECT_STATUS_COLORS[value as ProjectStatus] || '#9E9E9E';
      case 'ticket':
        return TICKET_STATUS_COLORS[value as TicketStatus] || '#9E9E9E';
      case 'priority':
        return TICKET_PRIORITY_COLORS[value as TicketPriority] || '#9E9E9E';
      case 'document':
        return DOCUMENT_STATUS_COLORS[value as DocumentStatus] || '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const color = getColor();

  return (
    <Chip
      label={label || value}
      size="small"
      sx={{
        backgroundColor: color + '20',
        color: color,
        fontWeight: 500,
        border: `1px solid ${color}40`,
        ...props.sx,
      }}
      {...props}
    />
  );
});

StatusChip.displayName = 'StatusChip';

export default StatusChip;
