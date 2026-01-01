import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Box, useTheme } from '@mui/material';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import type { Ticket, TicketStatus } from '../../types';

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketMove: (ticketId: string, newStatus: TicketStatus) => Promise<void>;
  onTicketClick?: (ticket: Ticket) => void;
  onAddClick?: (status: TicketStatus) => void;
}

interface ColumnConfig {
  status: TicketStatus;
  title: string;
  color: string;
}

const COLUMNS: ColumnConfig[] = [
  { status: 'open', title: 'Open', color: '#FF9800' },
  { status: 'in_progress', title: 'In Progress', color: '#2196F3' },
  { status: 'pending', title: 'Pending', color: '#9C27B0' },
  { status: 'resolved', title: 'Resolved', color: '#4CAF50' },
  { status: 'closed', title: 'Closed', color: '#9E9E9E' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tickets,
  onTicketMove,
  onTicketClick,
  onAddClick,
}) => {
  const theme = useTheme();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [originalStatus, setOriginalStatus] = useState<TicketStatus | null>(null);
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets);

  // Update local tickets when props change
  React.useEffect(() => {
    setLocalTickets(tickets);
  }, [tickets]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tickets by status
  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, Ticket[]> = {
      open: [],
      in_progress: [],
      pending: [],
      resolved: [],
      closed: [],
    };

    localTickets.forEach((ticket) => {
      if (grouped[ticket.status]) {
        grouped[ticket.status].push(ticket);
      }
    });

    return grouped;
  }, [localTickets]);

  const findContainer = (id: string): TicketStatus | null => {
    // Check if id is a column status
    if (COLUMNS.some((col) => col.status === id)) {
      return id as TicketStatus;
    }

    // Find which column the ticket belongs to
    for (const [status, tickets] of Object.entries(ticketsByStatus)) {
      if (tickets.some((t) => t.id === id)) {
        return status as TicketStatus;
      }
    }

    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = localTickets.find((t) => t.id === active.id);
    setActiveTicket(ticket || null);
    // Store the original status before any changes
    if (ticket) {
      setOriginalStatus(ticket.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Move ticket to new column (optimistic update)
    setLocalTickets((prev) => {
      const activeTicket = prev.find((t) => t.id === active.id);
      if (!activeTicket) return prev;

      return prev.map((t) =>
        t.id === active.id ? { ...t, status: overContainer } : t
      );
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedTicketId = active.id as string;

    setActiveTicket(null);

    if (!over) {
      // Revert if dropped outside
      if (originalStatus) {
        setLocalTickets((prev) =>
          prev.map((t) =>
            t.id === draggedTicketId ? { ...t, status: originalStatus } : t
          )
        );
      }
      setOriginalStatus(null);
      return;
    }

    const overContainer = findContainer(over.id as string);
    if (!overContainer) {
      setOriginalStatus(null);
      return;
    }

    // Only trigger API call if status actually changed from original
    if (originalStatus && originalStatus !== overContainer) {
      try {
        await onTicketMove(draggedTicketId, overContainer);
      } catch (error) {
        // Revert on error
        setLocalTickets(tickets);
      }
    }

    setOriginalStatus(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: 400,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.action.hover,
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.action.disabled,
            borderRadius: 4,
            '&:hover': {
              backgroundColor: theme.palette.action.selected,
            },
          },
        }}
      >
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            color={column.color}
            tickets={ticketsByStatus[column.status]}
            onTicketClick={onTicketClick}
            onAddClick={onAddClick}
          />
        ))}
      </Box>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTicket ? (
          <KanbanCard ticket={activeTicket} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
