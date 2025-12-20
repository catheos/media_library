import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

type RouteScroll = {
  route: string;
  position: number;
};

export const scroll_history: RouteScroll[] = []

export const useScrollHistory = () => {
  const location = useLocation();
  const current_route = location.pathname + location.search;

  useEffect(() => {
    // Add current route to the front, keep last 3
    scroll_history.unshift({ route: current_route, position: window.scrollY });
    if (scroll_history.length > 3) {
      scroll_history.pop();
    }

    // Scroll listener function
    const handle_scroll = () => {
      if (scroll_history[0]) {
        scroll_history[0].position = window.scrollY;
      }
    };

    window.addEventListener('scroll', handle_scroll);

    return () => {
      window.removeEventListener('scroll', handle_scroll);
    }
  }, [current_route]);
};