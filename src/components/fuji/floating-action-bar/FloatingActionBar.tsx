"use client";

import * as React from "react";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface FloatingActionBarAction {
  /** Icon element. Sized by the bar, so pass an unsized icon. */
  icon: React.ReactNode;
  /** Accessible name, and the label shown beside the action when open. */
  label: string;
  onSelect?: () => void;
  /** Marks a destructive action so it reads in the danger tone. */
  destructive?: boolean;
}

export interface FloatingActionBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** The actions, ordered outwards from the trigger. */
  actions: FloatingActionBarAction[];
  /** Icon for the trigger. Defaults to a plus that rotates into a close. */
  icon?: React.ReactNode;
  /** Accessible name for the trigger. Default "Actions". */
  label?: string;
  /** Controlled expanded state. Omit + use `defaultOpen` for uncontrolled. */
  open?: boolean;
  /** Renders already expanded - for a bar that is the primary control on a screen. */
  defaultOpen?: boolean;
  /** Called whenever the dial opens or closes, including via Escape or an outside press. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Which way the actions fan out.
   *
   * `"auto"` (default) picks the side with room: a dial near the top of the
   * viewport opens downwards, one near the bottom opens upwards. Set `"up"` or
   * `"down"` to force it.
   */
  direction?: "up" | "down" | "auto";
}

/**
 * A speed dial: a circular trigger that fans a column of labelled actions out
 * from itself (the reference is motion.dev's floating action button).
 *
 * The column is absolutely positioned against the trigger, never part of the
 * layout flow. That is load-bearing, not an implementation detail: while it
 * was a flex sibling, opening the dial grew the container and shoved the
 * trigger across the page - the one element that must stay put, since the
 * pointer is already on it. Positioning it out of flow means opening changes
 * nothing about the trigger's box, and the dial can be dropped anywhere
 * without reserving space for its own expansion.
 *
 * Two details carry the animation, and both are easy to leave out:
 *
 * 1. **The stagger.** Actions animate in nearest-the-trigger first, so the
 *    column unfurls from the button rather than appearing at once. On close
 *    the order reverses, so it furls back into the trigger.
 * 2. **The taper.** Each step further out is slightly smaller. That gradient
 *    is what gives the column depth; without it a stack of identical circles
 *    reads as a list.
 *
 * Not built on Popover deliberately: the actions belong to the trigger, and a
 * portaled popup would cross-fade a separate surface in and lose that.
 */

/** Per-step delay of the stagger. Long enough to read, short enough not to drag. */
const STAGGER_MS = 45;
/** Size lost per step away from the trigger, as a scale factor. */
const TAPER = 0.06;
/** Rough height of one action row plus its gap, for the auto-direction probe. */
const ROW_HEIGHT = 60;

export const FloatingActionBar = React.forwardRef<HTMLDivElement, FloatingActionBarProps>(
  function FloatingActionBar(
    {
      actions,
      icon,
      label = "Actions",
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      direction = "auto",
      className,
      ...props
    },
    ref,
  ) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    // Only consulted when `direction` is "auto". Resolved when the dial opens,
    // and held while it is open so the column cannot flip mid-animation.
    const [autoSide, setAutoSide] = React.useState<"up" | "down">("up");
    const resolved = direction === "auto" ? autoSide : direction;

    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const setOpen = React.useCallback(
      (next: boolean) => {
        // Measure before opening: whichever side has room for the column wins,
        // preferring up (the conventional direction) when both do.
        if (next && direction === "auto" && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const needed = actions.length * ROW_HEIGHT;
          const above = rect.top;
          const below = window.innerHeight - rect.bottom;
          setAutoSide(above >= needed || above >= below ? "up" : "down");
        }
        if (!isControlled) setUncontrolledOpen(next);
        onOpenChange?.(next);
      },
      [actions.length, direction, isControlled, onOpenChange],
    );

    React.useEffect(() => {
      if (!open) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false);
      };
      const onPointerDown = (event: PointerEvent) => {
        if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
      };
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("pointerdown", onPointerDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("pointerdown", onPointerDown);
      };
    }, [open, setOpen]);

    const up = resolved === "up";

    return (
      <div
        ref={setRefs}
        data-open={open ? "" : undefined}
        data-side={resolved}
        // Sized to the trigger alone. The column below is out of flow, so this
        // box never changes size and the trigger never moves.
        className={cn("fj:relative fj:inline-flex fj:w-fit", className)}
        {...props}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-label={label}
          data-open={open ? "" : undefined}
          onClick={() => setOpen(!open)}
          className={cn(
            NATIVE_CONTROL_RESET,
            "fuji-fab-trigger fj:relative fj:z-10 fj:flex fj:size-14 fj:shrink-0 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full",
            "fj:bg-fuji-contained-default fj:text-fuji-default-foreground",
            "fj:transition-[rotate,scale] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease-spring)]",
            // The plus becomes a close by rotating, so there is nothing to
            // cross-fade and the glyph stays one continuous object.
            "fj:data-[open]:rotate-45 fj:active:scale-95",
            "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
            "fj:motion-reduce:transition-none",
          )}
        >
          {icon ?? <PlusIcon />}
        </button>

        <div
          // `inert` as a DOM property in a ref callback, not a JSX prop -
          // React 18 and 19 disagree about serialising it. See AGENTS.md.
          ref={(node) => {
            if (node) node.inert = !open;
          }}
          aria-hidden={open ? undefined : true}
          className={cn(
            // Always absolute, open or closed. `right-1` centres the 48px
            // action circles on the 56px trigger ((56-48)/2 = 4px).
            "fj:absolute fj:right-1 fj:flex fj:items-end fj:gap-3",
            up ? "fj:bottom-full fj:mb-3 fj:flex-col-reverse" : "fj:top-full fj:mt-3 fj:flex-col",
            !open && "fj:pointer-events-none",
          )}
        >
          {actions.map((action, index) => (
            <div
              key={action.label}
              className="fuji-fab-action fj:flex fj:items-center fj:gap-2.5"
              style={
                {
                  // Nearest-first on open, reversed on close so the column
                  // furls back into the trigger.
                  transitionDelay: `${(open ? index : actions.length - 1 - index) * STAGGER_MS}ms`,
                  "--fuji-fab-scale": 1 - index * TAPER,
                } as React.CSSProperties
              }
            >
              <span className="fuji-fab-label fj:rounded-fuji-control fj:bg-fuji-surface fj:px-2.5 fj:py-1 fj:text-[length:var(--fuji-text-sm)] fj:font-medium fj:whitespace-nowrap fj:text-fuji-foreground fj:shadow-fuji-control">
                {action.label}
              </span>
              <button
                type="button"
                onClick={() => {
                  action.onSelect?.();
                  setOpen(false);
                }}
                aria-label={action.label}
                className={cn(
                  NATIVE_CONTROL_RESET,
                  "fj:flex fj:size-12 fj:shrink-0 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full",
                  "fj:border fj:border-fuji-border fj:bg-fuji-surface fj:shadow-fuji-card",
                  "fj:transition-[background-color,scale] fj:duration-[var(--fuji-duration-fast)]",
                  "fj:hover:scale-105",
                  action.destructive
                    ? "fj:text-fuji-fire fj:hover:bg-fuji-fire-soft"
                    : "fj:text-fuji-foreground fj:hover:bg-fuji-surface-subtle",
                  "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
                  "fj:[&_svg]:size-5",
                )}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

/** Default trigger glyph. Inline so the component needs no icon dependency. */
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fj:size-6">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
