import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Add as AddIcon } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = React.memo(({
  title,
  subtitle,
  breadcrumbs,
  actionLabel,
  onAction,
  actionIcon = <AddIcon />,
  action,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((item, index) =>
            item.path ? (
              <Link
                key={index}
                component={RouterLink}
                to={item.path}
                color="inherit"
                underline="hover"
                sx={{ fontSize: '0.875rem' }}
              >
                {item.label}
              </Link>
            ) : (
              <Typography
                key={index}
                color="text.primary"
                sx={{ fontSize: '0.875rem' }}
              >
                {item.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      {/* Title Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {action}

        {actionLabel && onAction && (
          <Button
            variant="contained"
            startIcon={actionIcon}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
