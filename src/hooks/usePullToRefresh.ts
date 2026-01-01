import { useRef, useState, useCallback, useEffect } from 'react';

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  disabled?: boolean;
}

export interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullProgress: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export const usePullToRefresh = (
  options: UsePullToRefreshOptions
): UsePullToRefreshReturn => {
  const {
    onRefresh,
    threshold = 80,
    resistance = 2.5,
    disabled = false,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  const isScrolledToTop = useRef(true);

  // Check if scrolled to top
  useEffect(() => {
    const handleScroll = () => {
      isScrolledToTop.current = window.scrollY === 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      // Only trigger if at top of scroll
      if (!isScrolledToTop.current) return;

      startY.current = e.touches[0].clientY;
      currentY.current = e.touches[0].clientY;
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startY.current || disabled || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      // Only trigger for downward swipe
      if (deltaY <= 0) {
        setPullProgress(0);
        return;
      }

      // Apply resistance to pull
      const adjustedDelta = deltaY / resistance;
      const progress = Math.min(adjustedDelta / threshold, 1);

      setPullProgress(progress);
    },
    [disabled, isRefreshing, threshold, resistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!startY.current || disabled || isRefreshing) {
      startY.current = null;
      currentY.current = null;
      return;
    }

    if (pullProgress >= 1) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullProgress(0);
    startY.current = null;
    currentY.current = null;
  }, [disabled, isRefreshing, pullProgress, onRefresh]);

  return {
    isRefreshing,
    pullProgress,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

export default usePullToRefresh;
