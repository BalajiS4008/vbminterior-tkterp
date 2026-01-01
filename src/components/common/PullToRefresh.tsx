import React from 'react';
import { Box, CircularProgress, alpha, useTheme } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
}) => {
  const theme = useTheme();
  const { isRefreshing, pullProgress, handlers } = usePullToRefresh({
    onRefresh,
    threshold,
    disabled,
  });

  const indicatorHeight = Math.min(pullProgress * threshold, threshold);
  const rotation = pullProgress * 180;
  const scale = 0.5 + pullProgress * 0.5;

  return (
    <Box
      {...handlers}
      sx={{
        position: 'relative',
        minHeight: '100%',
        touchAction: 'pan-x pan-y',
      }}
    >
      {/* Pull indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: indicatorHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          overflow: 'hidden',
          transition: isRefreshing ? 'height 0.3s' : 'none',
          zIndex: 1,
        }}
      >
        {isRefreshing ? (
          <CircularProgress size={28} thickness={4} />
        ) : (
          <Box
            sx={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              color: pullProgress >= 1
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
              opacity: pullProgress,
              transition: 'color 0.2s',
            }}
          >
            <RefreshIcon />
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box
        sx={{
          transform: `translateY(${indicatorHeight}px)`,
          transition: isRefreshing ? 'transform 0.3s' : 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PullToRefresh;
