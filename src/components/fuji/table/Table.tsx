import * as React from "react";
import { cn } from "../../../lib/cn";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Wraps the table in a bordered panel. Defaults to on - pass `false` for a borderless table. */
  bordered?: boolean;
}

const TableRoot = React.forwardRef<HTMLTableElement, TableProps>(function TableRoot(
  { className, bordered = true, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        // `w-full` (a percentage) plus a border needs border-box sizing or
        // the border pushes this wrapper past 100% of its container.
        "fj:box-border fuji-glass-surface fuji-scrollbar fj:w-full fj:overflow-x-auto fj:rounded-fuji-panel",
        bordered && "fj:border fj:border-fuji-border",
      )}
    >
      <table
        ref={ref}
        className={cn("fj:w-full fj:border-collapse fj:text-[length:var(--fuji-text-base)]", className)}
        {...props}
      />
    </div>
  );
});

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  function TableHeader({ className, ...props }, ref) {
    return <thead ref={ref} className={cn("fj:bg-fuji-surface-subtle", className)} {...props} />;
  },
);

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  function TableBody({ className, ...props }, ref) {
    return (
      <tbody
        ref={ref}
        className={cn("fj:divide-y fj:divide-fuji-border fj:bg-fuji-surface", className)}
        {...props}
      />
    );
  },
);

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * Row responds to hover/click, e.g. a selectable or navigable row. Defaults
   * to off - plain rows show no hover feedback and stay out of the tab order.
   * When combined with `onClick`, the row also becomes focusable and
   * activatable with Enter/Space so it isn't pointer-only.
   */
  interactive?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, interactive = false, tabIndex, onClick, onKeyDown, ...props },
  ref,
) {
  const clickable = interactive && Boolean(onClick);
  return (
    <tr
      ref={ref}
      tabIndex={clickable ? (tabIndex ?? 0) : tabIndex}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (event) => {
              onKeyDown?.(event);
              if (!event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                event.currentTarget.click();
              }
            }
          : onKeyDown
      }
      className={cn(
        "fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
        interactive && "fj:cursor-pointer fj:hover:bg-fuji-surface-subtle",
        clickable &&
          "fj:focus-visible:outline-none fj:focus-visible:-outline-offset-2 fj:focus-visible:ring-2 fj:focus-visible:ring-fuji-focus-ring",
        className,
      )}
      {...props}
    />
  );
});

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  function TableHead({ className, ...props }, ref) {
    return (
      <th
        ref={ref}
        className={cn(
          "fj:px-4 fj:py-2.5 fj:text-left fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:uppercase fj:tracking-wide fj:text-fuji-foreground-subtle",
          className,
        )}
        {...props}
      />
    );
  },
);

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  function TableCell({ className, ...props }, ref) {
    return <td ref={ref} className={cn("fj:px-4 fj:py-3 fj:text-fuji-foreground", className)} {...props} />;
  },
);

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  function TableFooter({ className, ...props }, ref) {
    return (
      <tfoot
        ref={ref}
        className={cn(
          "fj:border-t fj:border-fuji-border fj:bg-fuji-surface-subtle fj:font-medium",
          className,
        )}
        {...props}
      />
    );
  },
);

/** `<Table><Table.Header><Table.Row><Table.Head/></Table.Row></Table.Header><Table.Body>...</Table.Body></Table>` */
export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Footer: TableFooter,
});
