import { useRef, useCallback, useState, type RefObject } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeAction {
  direction: SwipeDirection;
  threshold?: number;
  onSwipe: () => void;
  color?: string;
  icon?: React.ReactNode;
  label?: string;
}

export interface SwipeState {
  isSwiping: boolean;
  direction: SwipeDirection | null;
  progress: number;
  offset: number;
}

export interface UseSwipeActionsOptions {
  threshold?: number;
  preventScroll?: boolean;
  disabled?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export interface UseSwipeActionsReturn {
  ref: RefObject<HTMLDivElement | null>;
  state: SwipeState;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
  };
  reset: () => void;
}

export const useSwipeActions = (
  actions: SwipeAction[],
  options: UseSwipeActionsOptions = {}
): UseSwipeActionsReturn => {
  const {
    threshold = 80,
    preventScroll = true,
    disabled = false,
    onSwipeStart,
    onSwipeEnd,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const [state, setState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    progress: 0,
    offset: 0,
  });

  const reset = useCallback(() => {
    setState({
      isSwiping: false,
      direction: null,
      progress: 0,
      offset: 0,
    });
    startPos.current = null;
    isDragging.current = false;
  }, []);

  const getSwipeDirection = (
    deltaX: number,
    deltaY: number
  ): SwipeDirection | null => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < 10 && absY < 10) return null;

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  };

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;

      startPos.current = { x: clientX, y: clientY };
      isDragging.current = true;
      onSwipeStart?.();
    },
    [disabled, onSwipeStart]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!startPos.current || !isDragging.current || disabled) return;

      const deltaX = clientX - startPos.current.x;
      const deltaY = clientY - startPos.current.y;
      const direction = getSwipeDirection(deltaX, deltaY);

      if (!direction) return;

      // Check if this direction has an action
      const action = actions.find((a) => a.direction === direction);
      if (!action) {
        reset();
        return;
      }

      const isHorizontal = direction === 'left' || direction === 'right';
      const offset = isHorizontal ? deltaX : deltaY;
      const actionThreshold = action.threshold || threshold;
      const progress = Math.min(Math.abs(offset) / actionThreshold, 1);

      setState({
        isSwiping: true,
        direction,
        progress,
        offset,
      });
    },
    [disabled, actions, threshold, reset]
  );

  const handleEnd = useCallback(() => {
    if (!state.isSwiping || disabled) {
      reset();
      return;
    }

    const action = actions.find((a) => a.direction === state.direction);
    if (action && state.progress >= 1) {
      action.onSwipe();
    }

    onSwipeEnd?.();
    reset();
  }, [state, disabled, actions, onSwipeEnd, reset]);

  // Touch event handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    [handleStart]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (preventScroll && state.isSwiping) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove, preventScroll, state.isSwiping]
  );

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse event handlers (for desktop testing)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const onMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const onMouseLeave = useCallback(() => {
    if (isDragging.current) {
      reset();
    }
  }, [reset]);

  return {
    ref,
    state,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
    reset,
  };
};

// Hook for simple swipe detection
export interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  disabled?: boolean;
}

export const useSwipe = (options: UseSwipeOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    disabled = false,
  } = options;

  const startPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
    },
    [disabled]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!startPos.current || disabled) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startPos.current.x;
      const deltaY = touch.clientY - startPos.current.y;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > threshold && absX > absY) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else if (absY > threshold && absY > absX) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }

      startPos.current = null;
    },
    [disabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};

export default useSwipeActions;
