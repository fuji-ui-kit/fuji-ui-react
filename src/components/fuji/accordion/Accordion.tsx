"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Accordion as Base } from "@base-ui/react/accordion";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import type { SlotClassNames } from "../../../types";
function mergeClassName<State>(
  base: string,
  className: string | ((state: State) => string | undefined) | undefined,
): string | ((state: State) => string) {
  return typeof className === "function" ? (state) => cn(base, className(state)) : cn(base, className);
}

export type AccordionRootProps<Value = string> = React.ComponentPropsWithoutRef<typeof Base.Root<Value>>;
export type AccordionProps<Value = string> = AccordionRootProps<Value>;

export const AccordionRoot = React.forwardRef(function AccordionRoot(
  { className, ...props }: AccordionRootProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <Base.Root
      ref={ref}
      className={mergeClassName(
        "fuji-glass-surface fj:box-border fj:flex fj:w-full fj:flex-col fj:divide-y fj:divide-fuji-border fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:shadow-fuji-card",
        className,
      )}
      {...props}
    />
  );
}) as <Value = string>(
  props: AccordionRootProps<Value> & { ref?: React.Ref<HTMLDivElement> },
) => React.JSX.Element;

export type AccordionItemProps = React.ComponentPropsWithoutRef<typeof Base.Item>;

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { className, ...props },
  ref,
) {
  return <Base.Item ref={ref} className={mergeClassName("fj:box-border", className)} {...props} />;
});

export type AccordionHeaderProps = React.ComponentPropsWithoutRef<typeof Base.Header>;

export const AccordionHeader = React.forwardRef<HTMLHeadingElement, AccordionHeaderProps>(
  function AccordionHeader({ className, ...props }, ref) {
    return (
      <Base.Header
        ref={ref}
        className={mergeClassName("fj:m-0 fj:p-0 fj:text-inherit fj:font-normal", className)}
        {...props}
      />
    );
  },
);

export interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof Base.Trigger> {
  /**
   * Drops the rotating chevron, for a trigger that carries its own affordance.
   * @default false
   */
  hideIcon?: boolean;
}

export const AccordionTrigger = React.forwardRef<HTMLElement, AccordionTriggerProps>(
  function AccordionTrigger({ className, children, hideIcon = false, ...props }, ref) {
    const baseClassName = cn(
      NATIVE_CONTROL_RESET,
      "fj:group fj:box-border fj:flex fj:w-full fj:cursor-pointer fj:items-center fj:justify-between fj:gap-3 fj:px-4 fj:py-3 fj:text-left fj:text-[length:var(--fuji-text-sm)] fj:font-medium fj:text-fuji-foreground fj:select-none",
      "fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
      "fj:hover:bg-fuji-surface-subtle fj:data-[disabled]:hover:bg-transparent",
      "fj:focus-visible:relative fj:focus-visible:z-10 fj:focus-visible:outline-2 fj:focus-visible:-outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
      "fj:data-[disabled]:cursor-not-allowed fj:data-[disabled]:opacity-45",
    );
    return (
      <Base.Trigger ref={ref} className={mergeClassName(baseClassName, className)} {...props}>
        {children}
        {!hideIcon && (
          <ChevronDown className="fj:size-4 fj:shrink-0 fj:text-fuji-foreground-muted fj:transition-transform fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)] fj:group-data-[panel-open]:rotate-180" />
        )}
      </Base.Trigger>
    );
  },
);

export interface AccordionPanelProps extends React.ComponentPropsWithoutRef<typeof Base.Panel> {
  /** Extra class names for internal slots. */
  classNames?: SlotClassNames<"content">;
}

export const AccordionPanel = React.forwardRef<HTMLDivElement, AccordionPanelProps>(function AccordionPanel(
  { className, classNames, children, ...props },
  ref,
) {
  return (
    <Base.Panel
      ref={ref}
      className={mergeClassName(
        "fj:box-border fj:h-[var(--accordion-panel-height)] fj:overflow-hidden fj:transition-[height] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)] fj:data-[starting-style]:h-0 fj:data-[ending-style]:h-0 fj:[&[hidden]:not([hidden='until-found'])]:hidden",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "fj:px-4 fj:pt-0 fj:pb-3 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted",
          classNames?.content,
        )}
      >
        {children}
      </div>
    </Base.Panel>
  );
});

/**
 * `<Accordion defaultValue={['a']}><Accordion.Item value="a"><Accordion.Header><Accordion.Trigger>Title</Accordion.Trigger></Accordion.Header><Accordion.Panel>Content</Accordion.Panel></Accordion.Item></Accordion>`
 */
export const Accordion = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
});
