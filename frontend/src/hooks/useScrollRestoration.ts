import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { scroll_history } from './useScrollHistory';

export const useScrollRestoration = (contentReady: boolean): void => {
  const location = useLocation();
  const current_route = location.pathname + location.search;
  const hasRestored = useRef(false);

  useEffect(() => {
    // Reset restoration flag when route changes
    hasRestored.current = false;
  }, [current_route]);

  useEffect(() => {
    if (contentReady && !hasRestored.current) {
      // Find if current route exists in history (position 1 or 2)
      const previous_visit = scroll_history.find((entry, index) => 
        index > 0 && entry.route === current_route
      );
      
      const restore_position = previous_visit?.position || 0;

      if (previous_visit && restore_position > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, restore_position);
          hasRestored.current = true;
        });
      } else {
        hasRestored.current = true;
      }
    }
  }, [contentReady, current_route]);
};