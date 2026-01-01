import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import KanbanCard from './KanbanCard';
import type { Ticket, TicketStatus } from '../../types';

interface KanbanColumnProps {
  status: TicketStatus;
  title: string;
  tickets: Ticket[];
  color: string;
  onTicketClick?: (ticket: Ticket) => void;
  onAddClick?: (status: TicketStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tickets,
  color,
  onTicketClick,
  onAddClick,
}) => {
  const theme = useTheme();
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <Paper
      sx={{
        width: 300,
        minWidth: 300,
        maxHeight: 'calc(100vh - 280px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: alpha(theme.palette.background.default, 0.6),
        borderTop: `3px solid ${color}`,
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {title}
          </Typography>
          <Chip
            label={tickets.length}
            size="small"
            sx={{
              height: 20,
              minWidth: 20,
              backgroundColor: alpha(color, 0.15),
              color: color,
              fontWeight: 600,
            }}
          />
        </Box>
        <IconButton size="small" onClick={() => onAddClick?.(status)}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Column Content */}
      <Box
        ref={setNodeRef}
        sx={{
          flex: 1,
          p: 1,
          overflowY: 'auto',
          minHeight: 100,
          backgroundColor: isOver
            ? alpha(color, 0.1)
            : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
      >
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              onClick={onTicketClick}
            />
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 100,
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              color: 'text.disabled',
            }}
          >
            <Typography variant="body2">
              Drop tickets here
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default KanbanColumn;
