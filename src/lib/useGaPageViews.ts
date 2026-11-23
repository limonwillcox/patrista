import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackSpaPageView } from "./ga";

/**
 * After the HTML tag's first page_view, send one page_view per client-side
 * route change. Production bundle only; pnpm dev does not load gtag.
 */
export function useGaPageViews(): void {
  const location = useLocation();
  const skipFirst = useRef(true);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    trackSpaPageView(window.gtag, {
      pathname: location.pathname,
      search: location.search,
      href: window.location.href,
      title: document.title
    });
  }, [location.pathname, location.search]);
}