"use client";

import * as React from "react";
import { Tabs as Base } from "@base-ui/react/tabs";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export const TabsRoot = Base.Root;

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof Base.List> {
  /**
   * `"underline"` (default): a 2px bar under the active tab. `"pill"`: a white pill list with a
   * sliding raised black tile, as in SegmentedControl; for tab bars that navigate.
   */
  variant?: "underline" | "pill";
}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { variant = "underline", className, children, ...props },
  ref,
) {
  const pill = variant === "pill";
  return (
    <Base.List
      ref={ref}
      data-variant={variant}
      className={cn(
        "fuji-scrollbar fj:relative fj:z-0 fj:flex fj:overflow-x-auto",
        pill
          ? "fuji-glass-surface fj:box-border fj:inline-flex fj:gap-0.5 fj:rounded-full fj:bg-fuji-surface fj:p-1 fj:shadow-fuji-card"
          : "fj:gap-1 fj:border-b fj:border-fuji-border",
        className,
      )}
      {...props}
    >
      {children}
      {pill ? (
        <Base.Indicator className="fuji-raised fuji-motion-indicator fj:absolute fj:top-0 fj:left-0 fj:-z-10 fj:h-(--active-tab-height) fj:w-(--active-tab-width) fj:translate-x-(--active-tab-left) fj:translate-y-(--active-tab-top) fj:rounded-full fj:bg-fuji-contained-default" />
      ) : (
        <Base.Indicator className="fuji-motion-indicator fj:absolute fj:bottom-0 fj:left-0 fj:-z-10 fj:h-[2px] fj:w-(--active-tab-width) fj:translate-x-(--active-tab-left) fj:bg-fuji-foreground" />
      )}
    </Base.List>
  );
});

export const TabsTab = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Base.Tab>>(
  function TabsTab({ className, ...props }, ref) {
    return (
      <Base.Tab
        ref={ref}
        className={cn(
          // Base UI's Tab renders a real <button> (nativeButton defaults to
          // true) with no border/background of its own, so without
          // preflight it would otherwise show native OS button chrome.
          NATIVE_CONTROL_RESET,
          "fj:box-border fj:flex fj:h-[var(--fuji-control-h-sm)] fj:cursor-pointer fj:items-center fj:justify-center fj:whitespace-nowrap fj:px-3 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:text-fuji-foreground-muted fj:select-none",
          "fj:transition-colors fj:duration-[var(--fuji-duration-fast)] fj:hover:text-fuji-foreground",
          "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
          "fj:data-[active]:text-fuji-foreground",
          // Inside a pill list the active tab sits on the raised black tile.
          "fj:[[data-variant=pill]_&]:rounded-full fj:[[data-variant=pill]_&]:h-8 fj:[[data-variant=pill]_&]:px-4 fj:[[data-variant=pill]_&]:data-[active]:text-fuji-default-foreground",
          "fj:data-[disabled]:pointer-events-none fj:data-[disabled]:cursor-not-allowed fj:data-[disabled]:opacity-45",
          className,
        )}
        {...props}
      />
    );
  },
);

export const TabsPanel = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Base.Panel>>(
  function TabsPanel({ className, ...props }, ref) {
    return (
      <Base.Panel
        ref={ref}
        // Base UI unmounts inactive panels after an rAF-detected exit animation, which never
        // resolves when rAF is throttled (background tabs, some automated browsers). `tabindex`
        // turns -1 synchronously on switch, so hide on that instead.
        className={cn("fj:pt-4 fj:outline-none fj:[&[tabindex='-1']]:hidden", className)}
        {...props}
      />
    );
  },
);

/** `<Tabs defaultValue="a"><Tabs.List><Tabs.Tab value="a"/></Tabs.List><Tabs.Panel value="a"/></Tabs>` */
export const Tabs = Object.assign(TabsRoot, { List: TabsList, Tab: TabsTab, Panel: TabsPanel });
