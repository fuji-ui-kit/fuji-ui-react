"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { Toast as Base } from "@base-ui/react/toast";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";
import { DismissButton } from "../lib/dismiss-button";
import {
  STATUS_ICON_TILE_CLASS,
  STATUS_ICON_TONE,
  STATUS_WASH,
  STATUS_WASH_CLASS,
} from "../lib/status-surface";

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
              // Stacked: every toast is absolutely positioned at the bottom of
              // the viewport and `.fuji-motion-toast` pushes it back by its
              // `--toast-index` (see base.css).
              "fuji-glass-surface-overlay fuji-motion-toast fj:box-border fj:absolute fj:bottom-0 fj:left-0 fj:flex fj:w-full fj:items-center fj:gap-3 fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:px-4 fj:py-3.5 fj:shadow-fuji-overlay fj:outline-none fj:focus-visible:ring-2 fj:focus-visible:ring-fuji-focus-ring",
            )}
          >
            {/* Same tone wash + icon tile as `Alert` so variants read alike (`overflow-hidden` clips
                the wash). Centred, unlike `Alert`: the description is clamped to two lines, so
                top-aligning reads as text sitting high; centring only drifts on long alert bodies. */}
            <span aria-hidden="true" className={cn(STATUS_WASH_CLASS, STATUS_WASH[variant])} />
            {Icon && (
              <span className={STATUS_ICON_TILE_CLASS}>
                <Icon className={cn("fj:size-[18px]", STATUS_ICON_TONE[variant])} aria-hidden="true" />
              </span>
            )}
            <div className="fj:relative fj:min-w-0 fj:flex-1">
              {/* `m-0`: Base.Title/Description are native h/p and there is no preflight (SPEC.md §8);
                  their ~0.83em top margin pushed the title ~11px out of line with the icon. */}
              <Base.Title className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:leading-snug fj:font-semibold fj:text-fuji-foreground" />
              <Base.Description className="fj:m-0 fj:mt-0.5 fj:line-clamp-2 fj:text-[length:var(--fuji-text-sm)] fj:leading-snug fj:text-fuji-foreground-muted" />
            </div>
            {/* Base UI sets `aria-hidden` (`!expanded && !hasFocus`) but keeps it tabbable: focusable
                content inside aria-hidden fails WCAG 4.1.2. Like `Alert`, dismiss must always be
                reachable; `mergeProps` lets this `render` prop's `aria-hidden={false}` win. */}
            <Base.Close
              render={
                <DismissButton aria-label="Dismiss" aria-hidden={false} className="fj:relative fj:-mr-1.5" />
              }
            />
          </Base.Root>
        );
      })}
    </>
  );
}

export type ToasterPosition = "bottom-right" | "bottom-center" | "bottom-left";

const POSITION: Record<ToasterPosition, string> = {
  "bottom-right": "fj:right-4 fj:bottom-4 fj:sm:right-6 fj:sm:bottom-6",
  "bottom-center": "fj:bottom-4 fj:left-1/2 fj:-translate-x-1/2 fj:sm:bottom-6",
  "bottom-left": "fj:bottom-4 fj:left-4 fj:sm:bottom-6 fj:sm:left-6",
};

export interface ToasterProps {
  /** Which bottom corner (or the bottom centre) the stack grows from. Default `"bottom-right"`. */
  position?: ToasterPosition;
}

/**
 * Place once near the app root, inside `ToastProvider`; call `useToast().add(...)` anywhere. Toasts
 * stack newest in front; hover/focus fans them out. The provider's `limit` (default 3) caps them.
 */
export function Toaster({ position = "bottom-right" }: ToasterProps) {
  const portalAttrs = usePortalThemeAttrs();
  return (
    <Base.Portal>
      <Base.Viewport
        {...portalAttrs}
        // The toasts are absolutely positioned (stacked), so the viewport's
        // own height is the front toast's - Base UI measures it for us.
        style={{ height: "var(--toast-frontmost-height, 0px)" }}
        className={cn(
          "fuji-toast-viewport fj:fixed fj:z-50 fj:w-[min(22rem,calc(100vw-2rem))] fj:outline-none",
          POSITION[position],
        )}
      >
        <ToastList />
      </Base.Viewport>
    </Base.Portal>
  );
}
