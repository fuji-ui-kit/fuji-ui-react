"use client";

import * as React from "react";
import { Tabs as Base } from "@base-ui/react/tabs";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export const TabsRoot = Base.Root;

export const TabsList = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Base.List>>(
  function TabsList({ className, children, ...props }, ref) {
    return (
      <Base.List
        ref={ref}
        className={cn(
          "fuji-scrollbar fj:relative fj:z-0 fj:flex fj:gap-1 fj:overflow-x-auto fj:border-b fj:border-fuji-border",
          className,
        )}
        {...props}
      >
        {children}
        <Base.Indicator className="fj:absolute fj:bottom-0 fj:left-0 fj:-z-10 fj:h-[2px] fj:w-(--active-tab-width) fj:translate-x-(--active-tab-left) fj:bg-fuji-foreground fj:transition-[translate,width] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]" />
      </Base.List>
    );
  },
);

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
          "fj:flex fj:h-[var(--fuji-control-h-sm)] fj:cursor-pointer fj:items-center fj:justify-center fj:whitespace-nowrap fj:px-3 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:text-fuji-foreground-muted fj:select-none",
          "fj:transition-colors fj:duration-[var(--fuji-duration-fast)] fj:hover:text-fuji-foreground",
          "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
          "fj:data-[active]:text-fuji-foreground",
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
