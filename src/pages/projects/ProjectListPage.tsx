import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { PageHeader, StatusChip, EmptyState, ConfirmDialog, LoadingSpinner } from '../../components/common';
import { useAuth, useNotification } from '../../contexts';
import { useDebounce, useRealtimeProjects } from '../../hooks';
import { ROUTES, DEFAULT_PAGE_SIZE } from '../../config/constants';
import { formatDate, formatCurrency } from '../../utils';
import { projectService } from '../../services';
import type { Project } from '../../types';

const ProjectListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Use real-time projects from Firebase
  const { data: projects, loading } = useRealtimeProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const filteredProjects = useMemo(() =>
    (projects as Project[]).filter(
      (project) =>
        project.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        project.clientName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        project.location?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ),
    [projects, debouncedSearchQuery]
  );

  const paginatedProjects = useMemo(() =>
    filteredProjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredProjects, page, rowsPerPage]
  );

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedProject(null);
  }, []);

  const handleView = useCallback(() => {
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}`);
    }
    handleMenuClose();
  }, [selectedProject, navigate, handleMenuClose]);

  const handleEdit = useCallback(() => {
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}/edit`);
    }
    handleMenuClose();
  }, [selectedProject, navigate, handleMenuClose]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedProject) return;

    try {
      await projectService.delete(selectedProject.id);
      showSuccess('Project deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete project');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  }, [selectedProject, showSuccess, showError]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <PageHeader
        title={t('projects.title')}
        subtitle={`${projects.length} projects`}
        actionLabel={t('projects.createProject')}
        onAction={() => navigate(ROUTES.PROJECT_CREATE)}
      />

      <Card>
        <CardContent>
          {/* Search & Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Table */}
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon={FolderIcon}
              title={t('common.noData')}
              description="No projects found matching your criteria"
              actionLabel={t('projects.createProject')}
              onAction={() => navigate(ROUTES.PROJECT_CREATE)}
            />
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('projects.projectName')}</TableCell>
                      <TableCell>{t('projects.clientName')}</TableCell>
                      <TableCell>{t('projects.location')}</TableCell>
                      <TableCell>{t('projects.budget')}</TableCell>
                      <TableCell>{t('projects.progress')}</TableCell>
                      <TableCell>{t('common.status')}</TableCell>
                      <TableCell>{t('projects.endDate')}</TableCell>
                      <TableCell align="right">{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProjects.map((project) => (
                        <TableRow
                          key={project.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <TableCell>
                            <Box sx={{ fontWeight: 500 }}>{project.name}</Box>
                          </TableCell>
                          <TableCell>{project.clientName}</TableCell>
                          <TableCell>{project.location}</TableCell>
                          <TableCell>{formatCurrency(project.budget)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={project.progress}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                              />
                              <Box sx={{ minWidth: 40, textAlign: 'right' }}>
                                {project.progress}%
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <StatusChip
                              type="project"
                              value={project.status}
                              label={t(`projects.status.${project.status}`)}
                            />
                          </TableCell>
                          <TableCell>{formatDate(project.endDate)}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e, project);
                              }}
                            >
                              <MoreIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredProjects.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          View
        </MenuItem>
        {hasPermission('projects.edit') && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            {t('common.edit')}
          </MenuItem>
        )}
        {hasPermission('projects.delete') && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            {t('common.delete')}
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${selectedProject?.name}"? This action cannot be undone.`}
        confirmLabel={t('common.delete')}
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedProject(null);
        }}
      />
    </Box>
  );
};

export default ProjectListPage;
