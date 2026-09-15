"use client";

import * as React from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cn } from "../../../lib/cn";

export interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof BaseScrollArea.Root> {
  /** Max height/width of the visible viewport before scrolling kicks in. */
  className?: string;
  /** Extra classes for the scrolling viewport inside, rather than the outer frame. */
  viewportClassName?: string;
}

/** Styled wrapper over Base UI's ScrollArea - thin, theme-aware scrollbars. */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { className, viewportClassName, children, ...props },
  ref,
) {
  return (
    <BaseScrollArea.Root ref={ref} className={cn("fj:relative fj:overflow-hidden", className)} {...props}>
      <BaseScrollArea.Viewport className={cn("fj:h-full fj:w-full", viewportClassName)}>
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar
        orientation="vertical"
        className="fj:box-border fj:flex fj:w-2.5 fj:touch-none fj:select-none fj:p-0.5 fj:opacity-0 fj:transition-opacity fj:duration-150 fj:data-[hovering]:opacity-100 fj:data-[scrolling]:opacity-100"
      >
        <BaseScrollArea.Thumb className="fj:flex-1 fj:rounded-full fj:bg-fuji-border-strong" />
      </BaseScrollArea.Scrollbar>
      <BaseScrollArea.Scrollbar
        orientation="horizontal"
        className="fj:flex fj:h-2.5 fj:touch-none fj:select-none fj:p-0.5 fj:opacity-0 fj:transition-opacity fj:duration-150 fj:data-[hovering]:opacity-100 fj:data-[scrolling]:opacity-100"
      >
        <BaseScrollArea.Thumb className="fj:flex-1 fj:rounded-full fj:bg-fuji-border-strong" />
      </BaseScrollArea.Scrollbar>
      <BaseScrollArea.Corner />
    </BaseScrollArea.Root>
  );
});
