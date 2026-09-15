import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../../../lib/cn";
import { IconButton } from "../button/IconButton";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface PaginationProps {
  /** The current page, 1-based. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Called with the requested 1-based page number. */
  onPageChange: (page: number) => void;
  /**
   * How many pages to show either side of the current one before the range
   * collapses to an ellipsis. The first and last page are always shown, so
   * this controls the middle run only.
   */
  siblingCount?: number;
  /** Extra classes merged onto the `<nav>`. */
  className?: string;
}

function getPageList(page: number, pageCount: number, siblingCount: number): (number | "ellipsis")[] {
  const totalVisible = siblingCount * 2 + 5;
  if (pageCount <= totalVisible) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const left = Math.max(2, page - siblingCount);
  const right = Math.min(pageCount - 1, page + siblingCount);
  const pages: (number | "ellipsis")[] = [1];
  if (left > 2) pages.push("ellipsis");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < pageCount - 1) pages.push("ellipsis");
  pages.push(pageCount);
  return pages;
}

/** Numbered page navigation with collapsing ellipsis for large ranges. */
export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { page, pageCount, onPageChange, siblingCount = 1, className },
  ref,
) {
  const pages = getPageList(page, pageCount, siblingCount);

  return (
    // A white pill container with the page numbers as tiles inside it: the
    // inactive ones soft grey wells, the current one a raised black tile -
    // the reference pagination, and the same selected/unselected language as
    // SegmentedControl and Checkbox.
    <nav
      ref={ref}
      aria-label="Pagination"
      className={cn(
        "fuji-glass-surface fj:box-border fj:inline-flex fj:items-center fj:gap-1 fj:rounded-full fj:bg-fuji-surface fj:p-1.5 fj:shadow-fuji-card",
        className,
      )}
    >
      <IconButton
        aria-label="Previous page"
        appearance="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="fj:size-4" />
      </IconButton>
      {pages.map((entry, index) =>
        entry === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="fj:flex fj:size-[var(--fuji-control-h-sm)] fj:items-center fj:justify-center fj:text-fuji-foreground-subtle"
          >
            <MoreHorizontal className="fj:size-4" />
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            aria-current={entry === page ? "page" : undefined}
            onClick={() => onPageChange(entry)}
            className={cn(
              NATIVE_CONTROL_RESET,
              "fj:flex fj:size-[var(--fuji-control-h-sm)] fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-fuji-control fj:text-[length:var(--fuji-text-sm)] fj:font-medium",
              // No background/color transition: edge page numbers mount/unmount
              // fresh (no animation) as the window shifts, so fading only the
              // persisting buttons looked out of sync - instant swap matches
              // how compact (siblingCount=0) always looks.
              "fj:transition-[box-shadow,transform] fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)] fj:active:scale-[var(--fuji-press-scale)]",
              entry === page
                ? "fuji-raised fj:bg-fuji-contained-default fj:text-fuji-default-foreground"
                : "fj:bg-fuji-surface-raised fj:text-fuji-foreground-muted fj:hover:scale-105 fj:hover:text-fuji-foreground",
            )}
          >
            {entry}
          </button>
        ),
      )}
      <IconButton
        aria-label="Next page"
        appearance="ghost"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="fj:size-4" />
      </IconButton>
    </nav>
  );
});
