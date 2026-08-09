import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../../../lib/cn";
import { IconButton } from "../button/IconButton";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
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
    <nav ref={ref} aria-label="Pagination" className={cn("fj:flex fj:items-center fj:gap-1", className)}>
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
                ? "fj:bg-fuji-default fj:text-fuji-default-foreground fj:shadow-fuji-control"
                : "fj:text-fuji-foreground-muted fj:hover:scale-105 fj:hover:bg-fuji-surface-strong fj:hover:text-fuji-foreground",
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
