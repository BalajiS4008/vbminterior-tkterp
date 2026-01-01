import React from 'react';
import { Box, alpha, useTheme } from '@mui/material';
import { useSwipeActions, type SwipeAction } from '../../hooks/useSwipeActions';

export interface SwipeableListItemProps {
  children: React.ReactNode;
  leftAction?: Omit<SwipeAction, 'direction'>;
  rightAction?: Omit<SwipeAction, 'direction'>;
  disabled?: boolean;
  threshold?: number;
}

const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
  children,
  leftAction,
  rightAction,
  disabled = false,
  threshold = 80,
}) => {
  const theme = useTheme();

  const actions: SwipeAction[] = [];

  if (leftAction) {
    actions.push({
      ...leftAction,
      direction: 'left',
      threshold,
    });
  }

  if (rightAction) {
    actions.push({
      ...rightAction,
      direction: 'right',
      threshold,
    });
  }

  const { state, handlers } = useSwipeActions(actions, {
    threshold,
    disabled,
    preventScroll: true,
  });

  const getBackgroundColor = () => {
    if (!state.isSwiping || !state.direction) return 'transparent';

    const action = state.direction === 'left' ? leftAction : rightAction;
    const color = action?.color || theme.palette.primary.main;

    return alpha(color, Math.min(state.progress * 0.8, 0.8));
  };

  const getActionContent = () => {
    if (!state.isSwiping || !state.direction) return null;

    const action = state.direction === 'left' ? leftAction : rightAction;
    if (!action) return null;

    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [state.direction === 'left' ? 'right' : 'left']: 0,
          width: Math.abs(state.offset),
          display: 'flex',
          alignItems: 'center',
          justifyContent: state.direction === 'left' ? 'flex-start' : 'flex-end',
          px: 2,
          color: 'white',
          opacity: state.progress,
          transition: 'opacity 0.1s',
        }}
      >
        {action.icon && (
          <Box sx={{ mr: action.label ? 1 : 0 }}>{action.icon}</Box>
        )}
        {action.label && state.progress >= 0.5 && (
          <Box
            component="span"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
            }}
          >
            {action.label}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: getBackgroundColor(),
        transition: state.isSwiping ? 'none' : 'background-color 0.3s',
      }}
    >
      {/* Background action indicator */}
      {getActionContent()}

      {/* Main content */}
      <Box
        {...handlers}
        sx={{
          position: 'relative',
          transform: `translateX(${state.offset}px)`,
          transition: state.isSwiping ? 'none' : 'transform 0.3s ease-out',
          bgcolor: theme.palette.background.paper,
          touchAction: 'pan-y pinch-zoom',
          userSelect: 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default SwipeableListItem;
