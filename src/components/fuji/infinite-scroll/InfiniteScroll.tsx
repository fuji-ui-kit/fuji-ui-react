"use client";

import * as React from "react";
import { cn } from "../../../lib/cn";
import { Spinner } from "../spinner/Spinner";

export interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Called when the sentinel scrolls into view and there is more to fetch. Never re-called while a
   * previous call is in flight or once `hasMore` is false.
   */
  onLoadMore: () => void | Promise<void>;
  /** Whether another page exists. When false the sentinel stops observing. */
  hasMore: boolean;
  /** Whether a fetch is in flight. Drives the footer and suppresses re-entry. */
  loading?: boolean;
  /**
   * How far before the sentinel reaches the viewport to fire, e.g. "200px", so a fast scroll
   * doesn't show a gap at the bottom.
   */
  rootMargin?: string;
  /** Scroll container, when the list scrolls inside an element rather than the page. */
  root?: React.RefObject<HTMLElement | null>;
  /** Rendered under the children once `hasMore` is false. */
  endMessage?: React.ReactNode;
  /** Shown while a page is loading. A small `Spinner` when not given. */
  loader?: React.ReactNode;
}

/**
 * Loads the next page via an IntersectionObserver on a zero-height sentinel (scroll handlers jank).
 * `onLoadMore` is gated by a ref cleared when `loading` ends, or one scroll fires 3-4 fetches.
 */
export const InfiniteScroll = React.forwardRef<HTMLDivElement, InfiniteScrollProps>(function InfiniteScroll(
  {
    onLoadMore,
    hasMore,
    loading = false,
    rootMargin = "200px",
    root,
    endMessage,
    loader,
    className,
    children,
    ...props
  },
  ref,
) {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  // Latest callback without re-creating the observer on every render.
  const loadMoreRef = React.useRef(onLoadMore);
  loadMoreRef.current = onLoadMore;
  const pending = React.useRef(false);

  if (!loading && pending.current) pending.current = false;

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    // SSR and older jsdom have no IntersectionObserver; the list still
    // renders everything it already has, it just never auto-extends.
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (pending.current || loading) return;
        pending.current = true;
        void loadMoreRef.current();
      },
      { root: root?.current ?? null, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, rootMargin, root]);

  return (
    <div ref={ref} className={cn("fj:flex fj:flex-col", className)} {...props}>
      {children}
      {/* Zero-height and aria-hidden: it is a scroll probe, not content. */}
      <div ref={sentinelRef} aria-hidden="true" className="fj:h-px fj:shrink-0" />
      {hasMore ? (
        <div
          // Announced politely so a screen-reader user hears that more is
          // arriving rather than silently gaining rows.
          role="status"
          aria-live="polite"
          className="fj:flex fj:items-center fj:justify-center fj:gap-2 fj:py-4 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted"
        >
          {/* The spinner is decorative: its own `role="status"` nested a second live region and
                the load was announced twice. This region owns the announcement. */}
          {loading ? (
            <span aria-hidden="true" className="fj:flex fj:items-center">
              {loader ?? <Spinner size="sm" />}
            </span>
          ) : null}
          {loading ? <span>Loading more…</span> : null}
        </div>
      ) : (
        endMessage && (
          <div className="fj:py-4 fj:text-center fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted">
            {endMessage}
          </div>
        )
      )}
    </div>
  );
});
