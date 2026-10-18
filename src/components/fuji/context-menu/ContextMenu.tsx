"use client";

import * as React from "react";
import { ContextMenu as Base } from "@base-ui/react/context-menu";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export const ContextMenuRoot = Base.Root;
export const ContextMenuTrigger = Base.Trigger;
export const ContextMenuGroup = Base.Group;

export const ContextMenuGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.GroupLabel>
>(function ContextMenuGroupLabel({ className, ...props }, ref) {
  return (
    <Base.GroupLabel
      ref={ref}
      className={cn(
        "fj:px-3 fj:pt-1.5 fj:pb-1 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground-subtle",
        className,
      )}
      {...props}
    />
  );
});

export const ContextMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Separator>
>(function ContextMenuSeparator({ className, ...props }, ref) {
  return (
    <Base.Separator ref={ref} className={cn("fj:my-1 fj:h-px fj:bg-fuji-border", className)} {...props} />
  );
});

export const ContextMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Base.Item>
>(function ContextMenuItem({ className, ...props }, ref) {
  return (
    <Base.Item
      ref={ref}
      className={cn(
        "fj:flex fj:cursor-default fj:items-center fj:gap-2 fj:rounded-fuji-item fj:px-3 fj:py-2 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground fj:outline-none fj:select-none",
        // Inverted fill/text like other selection indicators: the translucent
        // `--fuji-surface-strong` washed out under glass (measured 3.35:1 here).
        "fj:data-[highlighted]:bg-fuji-contained-default fj:data-[highlighted]:text-fuji-default-foreground",
        "fj:data-[disabled]:pointer-events-none fj:data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    />
  );
});

export interface ContextMenuContentProps extends React.ComponentPropsWithoutRef<typeof Base.Popup> {
  /**
   * Which side of the pointer anchor the menu opens on. Base UI uses bottom
   * placement when omitted, with native-like pointer offsets.
   */
  side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end";
  /**
   * Gap in px between the pointer anchor and the menu. Base UI uses -5 when
   * `side` is omitted, or 0 when an explicit side is supplied.
   */
  sideOffset?: number;
  /** How the menu lines up against the pointer anchor. Default "start". */
  align?: "start" | "center" | "end";
  /**
   * Shift in px along the cross axis. Base UI uses 2 for start/end alignment
   * when `side` is omitted, or 0 when an explicit side is supplied.
   */
  alignOffset?: number;
}

export const ContextMenuContent = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(
  function ContextMenuContent(
    { className, side, sideOffset, align = "start", alignOffset, children, ...props },
    ref,
  ) {
    const portalAttrs = usePortalThemeAttrs();
    return (
      <Base.Portal>
        <Base.Positioner
          {...portalAttrs}
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          className="fj:z-50 fj:outline-none"
        >
          <Base.Popup
            ref={ref}
            {...portalAttrs}
            className={cn(
              "fuji-glass-surface-overlay fuji-motion-popup fj:min-w-[10rem] fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:p-1 fj:shadow-fuji-overlay fj:outline-none",
              className,
            )}
            {...props}
          >
            {children}
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    );
  },
);

/**
 * ContextMenu displays a floating menu at the pointer coordinates on right-click or long-press.
 *
 * Base UI owns right-click, long-press, keyboard navigation and dismissal, focus management,
 * ARIA roles, controlled and uncontrolled open state, positioning, and portal behavior.
 *
 * Usage guideline:
 * Context menus are secondary enhancement affordances and should not be the sole way to
 * perform actions. Users on touch devices, keyboard navigation, or using assistive technologies
 * may not discover or be able to invoke right-click or long-press triggers. Always provide
 * clearly visible fallback controls (such as an actions button, toolbar, or dropdown menu)
 * for the same actions.
 *
 * `<ContextMenu><ContextMenu.Trigger>...</ContextMenu.Trigger><ContextMenu.Content><ContextMenu.Item>...</ContextMenu.Item></ContextMenu.Content></ContextMenu>`
 */
export const ContextMenu = Object.assign(ContextMenuRoot, {
  Trigger: ContextMenuTrigger,
  Content: ContextMenuContent,
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Group: ContextMenuGroup,
  GroupLabel: ContextMenuGroupLabel,
});
