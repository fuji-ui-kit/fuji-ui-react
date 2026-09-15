"use client";

import * as React from "react";
import { Tabs as Base } from "@base-ui/react/tabs";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export const TabsRoot = Base.Root;

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof Base.List> {
  /**
   * `"underline"` (default): a 2px bar under the active tab. `"pill"`: the
   * list is a white pill container and the active tab is a raised black
   * tile that slides between positions - the same selected-object language
   * as SegmentedControl, for tab bars that are navigation rather than
   * document sections.
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
        // Base UI keeps an inactive panel mounted until its exit animation
        // finishes, which it detects via requestAnimationFrame. This panel
        // has no exit animation, but on a tab whose rAF is throttled (a
        // backgrounded tab, some automated browsers) that detection never
        // resolves and the inactive panel stays visible indefinitely. Its
        // `tabindex` is set to -1 synchronously with the tab switch, so hide
        // on that instead of waiting on Base UI's animation-driven unmount.
        className={cn("fj:pt-4 fj:outline-none fj:[&[tabindex='-1']]:hidden", className)}
        {...props}
      />
    );
  },
);

/** `<Tabs defaultValue="a"><Tabs.List><Tabs.Tab value="a"/></Tabs.List><Tabs.Panel value="a"/></Tabs>` */
export const Tabs = Object.assign(TabsRoot, { List: TabsList, Tab: TabsTab, Panel: TabsPanel });
