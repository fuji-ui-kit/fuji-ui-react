"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { ComponentAppearance, ComponentSize, ComponentTone } from "../../../types";
import { appearanceClasses } from "../lib/appearance";
import { useRipple } from "../lib/use-ripple";
import { buttonBase } from "./button.styles";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Control height and padding. */
  size?: ComponentSize;
  /** Decorative color. */
  tone?: ComponentTone;
  /** Visual treatment - filled, outlined, dashed, or bare. */
  appearance?: ComponentAppearance;
  /** Stretches to the width of its container. */
  fullWidth?: boolean;
  /** Shows a spinner and disables interaction, keeping the button's width stable. */
  loading?: boolean;
  /** Icon rendered before the label. */
  startIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  endIcon?: React.ReactNode;
  /**
   * Renders Button's visual styling onto its single child element instead of
   * a `<button>` - e.g. `<Button asChild><Link href="/docs">Docs</Link></Button>`.
   * The child must forward its ref and spread the props it receives.
   *
   * The rendered element is frequently a link, which has no native
   * `disabled` attribute, so `disabled`/`loading` are enforced here via
   * `aria-disabled` plus a click/keydown guard rather than relying on the
   * HTML `disabled` attribute.
   */
  asChild?: boolean;
  /**
   * Plays a pointer-origin ripple on press. On by default - the ripple is part
   * of how a button is meant to feel, so it applies to every button rather
   * than being opted into per control. Pass `false` to suppress it. Does
   * nothing under `prefers-reduced-motion: reduce`.
   */
  ripple?: boolean;
}

/** Calls every ref in `refs` with the same node - lets Button forward its own ref without discarding a ref the `asChild` child already carries. */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLElement, ButtonProps>(function Button(
  {
    size = "md",
    tone = "default",
    appearance = "contained",
    fullWidth = false,
    loading = false,
    disabled,
    startIcon,
    endIcon,
    className,
    children,
    type = "button",
    asChild = false,
    // On by default: the press ripple is part of how every button is meant to
    // feel, not an opt-in extra. Pass `ripple={false}` to suppress it.
    ripple = true,
    onClick,
    onPointerDown,
    onKeyDown,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const playRipple = useRipple(ripple && !isDisabled);
  const classes = cn(
    buttonBase({ size, fullWidth }),
    ripple && "fuji-ripple",
    appearanceClasses(tone, appearance),
    "fj:hover:brightness-[1.04] fj:active:brightness-[0.97]",
    // Focus-visible outline now lives in `buttonBase` (button.styles.ts) so
    // IconButton, which shares that recipe module, can't drift out of sync
    // with it again.
    isDisabled && "fj:pointer-events-none fj:cursor-not-allowed fj:opacity-45",
    className,
  );

  if (asChild) {
    const childNodes = React.Children.toArray(children);
    const child = childNodes[0] as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
      onClick?: React.MouseEventHandler;
      onPointerDown?: React.PointerEventHandler;
      onKeyDown?: React.KeyboardEventHandler;
      ref?: React.Ref<HTMLElement>;
    }>;
    if (childNodes.length !== 1 || !React.isValidElement(child)) {
      throw new Error("Button with asChild requires exactly one React element child.");
    }
    // The rendered element (often a link) may have no native `disabled`
    // support, so a disabled/loading state is enforced here instead of
    // relying on the `disabled` HTML attribute reaching the child.
    const guardActivation = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
      if (!isDisabled) return false;
      event.preventDefault();
      event.stopPropagation();
      return true;
    };
    // `type="button"` only means something on an actual <button> - forcing it
    // onto an <a> or a custom component renders a meaningless/invalid attribute.
    const isButtonElement = child.type === "button";
    // React 19 moved `ref` onto `props`; React 18 (still a supported peer)
    // only ever exposed it as the element's own `ref` field. Reading
    // `props.ref` first avoids React 19's "accessing element.ref" warning,
    // falling back to the legacy field so React 18 children keep their ref too.
    const childRef = child.props.ref ?? (child as unknown as { ref?: React.Ref<HTMLElement> }).ref;
    return React.cloneElement(child, {
      ...props,
      ...(isButtonElement ? { type } : {}),
      // cloneElement replaces the child's own `ref` outright; merging keeps
      // both this ref and whatever ref the child element already carried.
      ref: mergeRefs(ref, childRef),
      "aria-disabled": isDisabled || undefined,
      "aria-busy": loading || undefined,
      className: cn(classes, child.props.className),
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        if (!isDisabled) playRipple(event);
        child.props.onPointerDown?.(event);
        onPointerDown?.(event as React.PointerEvent<HTMLButtonElement>);
      },
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        if (guardActivation(event)) return;
        child.props.onClick?.(event);
        onClick?.(event as React.MouseEvent<HTMLButtonElement>);
      },
      onKeyDown: (event: React.KeyboardEvent) => {
        if (guardActivation(event)) return;
        child.props.onKeyDown?.(event);
        onKeyDown?.(event as React.KeyboardEvent<HTMLButtonElement>);
      },
      children: (
        <>
          {startIcon}
          {child.props.children}
          {endIcon}
        </>
      ),
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      onPointerDown={(event) => {
        playRipple(event);
        onPointerDown?.(event);
      }}
      onClick={(event) => {
        onClick?.(event);
      }}
      onKeyDown={onKeyDown}
      {...props}
    >
      {loading ? <Loader2 className="fj:size-4 fj:animate-fuji-spin" aria-hidden="true" /> : startIcon}
      {children}
      {!loading && endIcon}
    </button>
  );
});
