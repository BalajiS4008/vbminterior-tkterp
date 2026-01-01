import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface EmptyStateProps {
  icon: SvgIconComponent;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Icon
        sx={{
          fontSize: 64,
          color: 'text.disabled',
          mb: 2,
        }}
      />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.disabled" sx={{ mb: 3, maxWidth: 400 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
