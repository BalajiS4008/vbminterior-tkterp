import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
  Grid,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  ViewKanban as KanbanIcon,
  ViewList as ListIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { PageHeader, LoadingSpinner } from '../../components/common';
import { KanbanBoard } from '../../components/kanban';
import { useNotification, useAuth } from '../../contexts';
import { ROUTES } from '../../config/constants';
import { ticketService, projectService } from '../../services';
import type { Ticket, TicketStatus, Project } from '../../types';

const KanbanBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showError } = useNotification();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState(searchParams.get('projectId') || '');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Fetch data once on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ticketResult, projectResult] = await Promise.all([
          ticketService.getAll(undefined, { page: 1, limit: 1000 }),
          projectService.getAll(),
        ]);
        setTickets(ticketResult.tickets);
        setProjects(projectResult.projects);
      } catch (error) {
        console.error('Error fetching data:', error);
        showError('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showError]);

  // Filter tickets client-side
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      !searchQuery ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject = !projectFilter || ticket.projectId === projectFilter;

    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;

    return matchesSearch && matchesProject && matchesPriority;
  });

  // Handle ticket status change (drag & drop)
  const handleTicketMove = useCallback(
    async (ticketId: string, newStatus: TicketStatus) => {
      try {
        await ticketService.update(ticketId, { status: newStatus });
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
        );
        showSuccess(`Ticket moved to ${newStatus.replace('_', ' ')}`);
      } catch (error) {
        console.error('Error updating ticket:', error);
        showError('Failed to update ticket status');
        throw error; // Re-throw to trigger revert in KanbanBoard
      }
    },
    [showSuccess, showError]
  );

  // Handle ticket click
  const handleTicketClick = useCallback(
    (ticket: Ticket) => {
      navigate(`${ROUTES.TICKETS}/${ticket.id}`);
    },
    [navigate]
  );

  // Handle add ticket
  const handleAddTicket = useCallback(
    (status: TicketStatus) => {
      const params = new URLSearchParams();
      if (projectFilter) params.set('projectId', projectFilter);
      params.set('status', status);
      navigate(`${ROUTES.TICKET_CREATE}?${params.toString()}`);
    },
    [navigate, projectFilter]
  );

  // Handle project filter change
  const handleProjectChange = (newProjectId: string) => {
    setProjectFilter(newProjectId);
    if (newProjectId) {
      setSearchParams({ projectId: newProjectId });
    } else {
      setSearchParams({});
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader
        title="Kanban Board"
        subtitle={`${filteredTickets.length} tickets`}
        actionLabel={hasPermission('tickets.create') ? 'Create Ticket' : undefined}
        actionIcon={<AddIcon />}
        onAction={() => navigate(ROUTES.TICKET_CREATE)}
      />

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Project</InputLabel>
                <Select
                  value={projectFilter}
                  label="Project"
                  onChange={(e) => handleProjectChange(e.target.value)}
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <ToggleButtonGroup
                  size="small"
                  value="kanban"
                  exclusive
                >
                  <ToggleButton
                    value="kanban"
                    onClick={() => {}}
                  >
                    <KanbanIcon />
                  </ToggleButton>
                  <ToggleButton
                    value="list"
                    onClick={() => navigate(ROUTES.TICKETS)}
                  >
                    <ListIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {isMobile ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <KanbanIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Box sx={{ mb: 2, color: 'text.secondary' }}>
            Kanban board works best on larger screens.
          </Box>
          <Button
            variant="contained"
            startIcon={<ListIcon />}
            onClick={() => navigate(ROUTES.TICKETS)}
          >
            Switch to List View
          </Button>
        </Box>
      ) : (
        <KanbanBoard
          tickets={filteredTickets}
          onTicketMove={handleTicketMove}
          onTicketClick={handleTicketClick}
          onAddClick={handleAddTicket}
        />
      )}
    </Box>
  );
};

export default KanbanBoardPage;
