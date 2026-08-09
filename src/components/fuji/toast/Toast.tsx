"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { Toast as Base } from "@base-ui/react/toast";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";
import { DismissButton } from "../lib/dismiss-button";

export const ToastProvider = Base.Provider;
export const useToast = Base.useToastManager;

const ICONS: Partial<Record<StatusTone, React.ElementType>> = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
  info: Info,
};

function ToastList() {
  const { toasts } = useToast();
  return (
    <>
      {toasts.map((toast) => {
        const variant = (toast.data as { variant?: StatusTone } | undefined)?.variant ?? "default";
        const Icon = ICONS[variant];
        return (
          <Base.Root
            key={toast.id}
            toast={toast}
            className={cn(
              "fuji-glass-surface-overlay fj:relative fj:flex fj:w-full fj:items-start fj:gap-2.5 fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:p-3.5 fj:shadow-fuji-overlay",
              "fj:transition-[transform,opacity] fj:duration-[var(--fuji-duration-slow)] fj:ease-[var(--fuji-ease)]",
              "fj:data-[starting-style]:translate-y-2 fj:data-[starting-style]:opacity-0",
              "fj:data-[ending-style]:opacity-0",
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "fj:mt-0.5 fj:size-4 fj:shrink-0",
                  // `glass`'s surface-overlay panel composites to a
                  // medium-brightness tint (unlike light/dark, whose overlay
                  // panels are close to their page background), so the plain
                  // `text-fuji-{tone}` accent - tuned for the page/atmosphere,
                  // not this panel - falls well under WCAG's 3:1 floor here.
                  // `fuji-toast-icon-*` (see base.css) swaps in the matching
                  // `-foreground` token (designed for a same-tone solid fill,
                  // but incidentally dark enough to read on this panel too)
                  // under glass only; light/dark keep the classes below as-is.
                  variant === "success" && "fuji-toast-icon-success fj:text-fuji-forest",
                  variant === "warning" && "fuji-toast-icon-warning fj:text-fuji-sun",
                  variant === "danger" && "fuji-toast-icon-danger fj:text-fuji-fire",
                  variant === "info" && "fuji-toast-icon-info fj:text-fuji-water",
                )}
              />
            )}
            <div className="fj:min-w-0 fj:flex-1">
              {/* `m-0` matters here specifically: Base.Title/Description render
                  native heading/paragraph elements, and this package ships no
                  preflight (see SPEC.md §8) - without it their native ~0.83em
                  top margin pushed the title down and out of vertical
                  alignment with the icon next to it (measured ~11px off). */}
              <Base.Title className="fuji-toast-title fj:m-0 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:text-fuji-foreground" />
              <Base.Description className="fuji-toast-description fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted" />
            </div>
            <Base.Close
              render={<DismissButton aria-label="Dismiss" className="fuji-toast-dismiss fj:-mt-1 fj:-mr-1" />}
            />
          </Base.Root>
        );
      })}
    </>
  );
}

/** Place once near the app root, inside `ToastProvider`. Call `useToast().add(...)` anywhere to show one. */
export function Toaster() {
  const portalAttrs = usePortalThemeAttrs();
  return (
    <Base.Portal>
      <Base.Viewport
        {...portalAttrs}
        className="fj:fixed fj:right-4 fj:bottom-4 fj:z-50 fj:flex fj:w-[calc(100vw-2rem)] fj:max-w-sm fj:flex-col fj:gap-2 fj:sm:right-6 fj:sm:bottom-6"
      >
        <ToastList />
      </Base.Viewport>
    </Base.Portal>
  );
}
