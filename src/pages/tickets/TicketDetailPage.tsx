import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Card, CardContent, Typography, Divider, Chip, Avatar, TextField, List, ListItem, ListItemAvatar, ListItemText, IconButton, useTheme, CircularProgress } from '@mui/material';
import { Edit as EditIcon, LocationOn as LocationIcon, CalendarMonth as CalendarIcon, Category as CategoryIcon, Flag as PriorityIcon, AttachFile as AttachIcon, Send as SendIcon, Image as ImageIcon } from '@mui/icons-material';
import { PageHeader, StatusChip, EmptyState, LoadingSpinner } from '../../components/common';
import { useAuth, useNotification } from '../../contexts';
import { useRealtimeTicketWithComments } from '../../hooks';
import { ticketService, notificationService } from '../../services';
import { ROUTES } from '../../config/constants';
import { formatDate, formatRelativeTime, generateInitials } from '../../utils';
import type { Ticket, TicketComment } from '../../types';

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.5 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  </Box>
);

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { hasPermission, userData } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const { ticket: ticketData, ticketLoading, ticketError, comments, commentsLoading } = useRealtimeTicketWithComments(id || null);
  const ticket = ticketData as Ticket | null;

  const handleEdit = () => { navigate(`/tickets/${id}/edit`); };

  const handleAddComment = async () => {
    if (!newComment.trim() || !id || !userData || !ticket) return;
    setCommentLoading(true);
    try {
      await ticketService.addComment({
        ticketId: id,
        userId: userData.id,
        userName: userData.displayName || 'User',
        content: newComment.trim(),
      });

      // Notify assigned users about the new comment (excluding the commenter)
      const usersToNotify = (ticket.assignedTo || []).filter(
        (userId: string) => userId !== userData.id
      );
      if (usersToNotify.length > 0) {
        await notificationService.notifyTicketComment(
          usersToNotify,
          id,
          ticket.title,
          userData.displayName || 'User'
        );
      }

      setNewComment('');
      showSuccess(t('tickets.commentAdded') || 'Comment added');
    } catch (err) {
      console.error('Error adding comment:', err);
      showError(t('common.error') || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  if (ticketLoading) return <LoadingSpinner />;

  if (ticketError || !ticket) {
    return (
      <Box>
        <PageHeader title={t('tickets.ticketDetails')} breadcrumbs={[{ label: t('tickets.title'), path: ROUTES.TICKETS }, { label: 'Not Found' }]} />
        <Card><CardContent><EmptyState icon={AttachIcon} title={t('common.error')} description={ticketError?.message || 'Ticket not found'} /></CardContent></Card>
      </Box>
    );
  }
  return (
    <Box>
      <PageHeader
        title={ticket.ticketNumber}
        breadcrumbs={[{ label: t('tickets.title'), path: ROUTES.TICKETS }, { label: ticket.ticketNumber }]}
        actionLabel={hasPermission('tickets.edit') ? t('common.edit') : undefined}
        onAction={hasPermission('tickets.edit') ? handleEdit : undefined}
        actionIcon={<EditIcon />}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StatusChip type="ticket" value={ticket.status} label={t(`tickets.status.${ticket.status}`)} />
                <StatusChip type="priority" value={ticket.priority} label={t(`tickets.priority_labels.${ticket.priority}`)} />
                <Chip label={t(`tickets.categories.${ticket.category}`)} size="small" variant="outlined" />
              </Box>

              <Typography variant="h5" gutterBottom>{ticket.title}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>{ticket.description}</Typography>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>{t('tickets.attachments')} ({ticket.attachments.length})</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {ticket.attachments.map((attachment: any) => (
                      <Chip key={attachment.id} icon={attachment.type === 'image' ? <ImageIcon /> : <AttachIcon />} label={attachment.name} variant="outlined" onClick={() => window.open(attachment.url, '_blank')} />
                    ))}
                  </Box>
                </>
              )}

              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>{t('tickets.comments')} ({commentsLoading ? '..' : comments.length})</Typography>

              {commentsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
              ) : (
                <List disablePadding>
                  {comments.map((comment: TicketComment) => (
                    <ListItem key={comment.id} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>{generateInitials(comment.userName)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">{comment.userName}</Typography>
                            <Typography variant="caption" color="text.secondary">{formatRelativeTime(comment.createdAt)}</Typography>
                          </Box>
                        }
                        secondary={<Typography variant="body2" sx={{ mt: 0.5 }}>{comment.content}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>{generateInitials(userData?.displayName || '')}</Avatar>
                <TextField
                  fullWidth
                  placeholder={t('tickets.addComment')}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  size="small"
                  multiline
                  maxRows={4}
                  disabled={commentLoading}
                  InputProps={{
                    endAdornment: (
                      <IconButton color="primary" onClick={handleAddComment} disabled={!newComment.trim() || commentLoading}>
                        {commentLoading ? <CircularProgress size={20} /> : <SendIcon />}
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('tickets.ticketDetails')}</Typography>

              <DetailRow icon={<LocationIcon fontSize="small" />} label={t('tickets.location')} value={ticket.location} />
              <DetailRow icon={<CategoryIcon fontSize="small" />} label={t('tickets.category')} value={t(`tickets.categories.${ticket.category}`)} />
              <DetailRow icon={<PriorityIcon fontSize="small" />} label={t('tickets.priority')} value={t(`tickets.priority_labels.${ticket.priority}`)} />
              <DetailRow icon={<CalendarIcon fontSize="small" />} label={t('tickets.dueDate')} value={ticket.dueDate ? formatDate(ticket.dueDate) : '-'} />
              <DetailRow icon={<CalendarIcon fontSize="small" />} label={t('common.createdAt')} value={formatDate(ticket.createdAt)} />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>{t('tickets.assignedTo')}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(ticket.assignedTo || []).map((userId: string, index: number) => (
                  <Chip
                    key={userId}
                    avatar={<Avatar sx={{ bgcolor: theme.palette.primary.main }}>{generateInitials(`User ${index + 1}`)}</Avatar>}
                    label={`User ${index + 1}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TicketDetailPage;