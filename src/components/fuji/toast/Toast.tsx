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
            {/* Same tone wash and icon tile as `Alert` - the two carry the same
                four variants, so a success toast and a success alert have to be
                recognisable as the same thing. `overflow-hidden` above is what
                clips the wash to the panel's corners.

                Centred, where `Alert` top-aligns: a toast is short by design
                (the description is clamped to two lines), so the icon tile is
                about as tall as the text beside it and top-aligning the two
                just reads as the text sitting high. An alert's body is
                arbitrary-length content, where centring would drift. */}
            <span aria-hidden="true" className={cn(STATUS_WASH_CLASS, STATUS_WASH[variant])} />
            {Icon && (
              <span className={STATUS_ICON_TILE_CLASS}>
                <Icon className={cn("fj:size-[18px]", STATUS_ICON_TONE[variant])} aria-hidden="true" />
              </span>
            )}
            <div className="fj:relative fj:min-w-0 fj:flex-1">
              {/* `m-0` matters here specifically: Base.Title/Description render
                  native heading/paragraph elements, and this package ships no
                  preflight (see SPEC.md §8) - without it their native ~0.83em
                  top margin pushed the title down and out of vertical
                  alignment with the icon next to it (measured ~11px off). */}
              <Base.Title className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:leading-snug fj:font-semibold fj:text-fuji-foreground" />
              <Base.Description className="fj:m-0 fj:mt-0.5 fj:line-clamp-2 fj:text-[length:var(--fuji-text-sm)] fj:leading-snug fj:text-fuji-foreground-muted" />
            </div>
            {/* Base UI's `Toast.Close` computes its own `aria-hidden` (`!expanded
                && !hasFocus` - true whenever this toast isn't the one being
                hovered/focused), but leaves `tabIndex`/keyboard activation
                untouched: a Tab press moves real DOM focus onto a button a
                screen reader's accessibility tree has already pruned, exactly
                the "focusable content inside aria-hidden" failure WCAG 4.1.2
                flags. That heuristic exists for collapsed background toasts
                in a stack, but Fuji's dismiss control must always be
                reachable the same way `Alert`'s identical button already is
                - never conditionally hidden. `aria-hidden={false}` here is a
                render-prop override, not a DOM default: `mergeProps` gives
                explicit props on the `render` element precedence over Base
                UI's computed ones, so this wins regardless of stack state. */}
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
 * Place once near the app root, inside `ToastProvider`. Call
 * `useToast().add(...)` anywhere to show one. Toasts stack - newest in
 * front, older ones pushed back, scaled and faded - and hovering or focusing
 * the stack fans it out so every toast can be read. The provider's `limit`
 * (default 3) caps how many are shown.
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
