import * as React from "react";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export const ListRoot = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  function ListRoot({ className, ...props }, ref) {
    return (
      <ul
        ref={ref}
        className={cn(
          "fuji-glass-surface fj:m-0 fj:flex fj:list-none fj:flex-col fj:divide-y fj:divide-fuji-border fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-0",
          className,
        )}
        {...props}
      />
    );
  },
);

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLElement>, "onClick"> {
  /** Content on the leading edge - an avatar, an icon, a checkbox. */
  startSlot?: React.ReactNode;
  /** Content on the trailing edge - a badge, a chevron, a control. */
  endSlot?: React.ReactNode;
  /** Renders the row as a real `<button>` so it's keyboard- and screen-reader-operable. */
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLLIElement>;
}

const ROW_CLASSNAME =
  "fj:box-border fj:flex fj:w-full fj:items-center fj:gap-3 fj:px-4 fj:py-3 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground";

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  { startSlot, endSlot, className, children, onClick, ...props },
  ref,
) {
  const content = (
    <>
      {startSlot}
      <div className="fj:min-w-0 fj:flex-1">{children}</div>
      {endSlot}
    </>
  );

  if (onClick) {
    return (
      <li ref={ref}>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            NATIVE_CONTROL_RESET,
            ROW_CLASSNAME,
            "fj:cursor-pointer fj:text-left fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
            className,
          )}
          {...props}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li ref={ref} className={cn(ROW_CLASSNAME, className)} {...props}>
      {content}
    </li>
  );
});

/** `<List><List.Item startSlot={...} endSlot={...}>Row content</List.Item></List>` */
export const List = Object.assign(ListRoot, { Item: ListItem });
