"use client";

import * as React from "react";
import { Check, ChevronRight, Copy } from "lucide-react";
import { Collapsible as Base } from "@base-ui/react/collapsible";
import { cn } from "../../../lib/cn";
import { IconButton } from "../button/IconButton";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  /** Shows the copy-to-clipboard control. Defaults to true. */
  copyable?: boolean;
  /** Renders as a collapsed-by-default accordion instead of always-expanded. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/** Plain, dependency-free code block. No syntax highlighting by design (see docs: Customization). */
export const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { code, language, copyable = true, collapsible = false, defaultOpen = false, className, ...props },
  ref,
) {
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<number | undefined>(undefined);

  // Clear any pending "copied" reset on unmount so it never fires after the
  // component is gone and repeated clicks never stack timers.
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const handleCopy = React.useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 1500);
    },
    [code],
  );

  const copyButton = copyable && (
    <IconButton
      aria-label={copied ? "Copied" : "Copy code"}
      size="sm"
      appearance="ghost"
      onClick={handleCopy}
    >
      {copied ? <Check className="fj:size-4" /> : <Copy className="fj:size-4" />}
    </IconButton>
  );

  const codeBody = (
    <pre className="fuji-scrollbar fj:overflow-x-auto fj:p-4 fj:text-[length:var(--fuji-text-sm)] fj:leading-relaxed">
      <code className="fj:font-[var(--fuji-font-mono)] fj:text-fuji-foreground">{code}</code>
    </pre>
  );

  if (collapsible) {
    return (
      <Base.Root
        ref={ref}
        defaultOpen={defaultOpen}
        className={cn(
          "fuji-glass-surface fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:shadow-fuji-card",
          className,
        )}
        {...props}
      >
        <div className="fj:flex fj:items-center fj:justify-between fj:px-4 fj:py-2">
          <Base.Trigger
            className={cn(
              NATIVE_CONTROL_RESET,
              "fj:group fj:flex fj:flex-1 fj:cursor-pointer fj:items-center fj:gap-2 fj:py-1 fj:text-left",
            )}
          >
            <ChevronRight className="fj:size-3.5 fj:shrink-0 fj:text-fuji-foreground-subtle fj:transition-transform fj:duration-[var(--fuji-duration-base)] fj:group-data-[panel-open]:rotate-90" />
            <span className="fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:uppercase fj:tracking-wide fj:text-fuji-foreground-subtle">
              {language || "Code"}
            </span>
          </Base.Trigger>
          {copyButton}
        </div>
        <Base.Panel className="fj:h-[var(--collapsible-panel-height)] fj:overflow-hidden fj:border-t fj:border-fuji-border fj:transition-[height] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)] fj:data-[starting-style]:h-0 fj:data-[ending-style]:h-0">
          {codeBody}
        </Base.Panel>
      </Base.Root>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "fuji-glass-surface fj:group fj:relative fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:shadow-fuji-card",
        className,
      )}
      {...props}
    >
      {(language || copyable) && (
        <div className="fj:flex fj:items-center fj:justify-between fj:border-b fj:border-fuji-border fj:px-4 fj:py-2">
          <span className="fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:uppercase fj:tracking-wide fj:text-fuji-foreground-subtle">
            {language}
          </span>
          {copyButton}
        </div>
      )}
      {codeBody}
    </div>
  );
});
