import * as React from "react";
import { Check, CheckCheck, Paperclip } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { SlotClassNames } from "../../../types";
import type { IconComponent } from "../icon/Icon";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

/** Delivery/read state for an outgoing message - never the only signal, always paired with a text label. */
export type ChatBubbleStatus = "sent" | "delivered" | "read";

const STATUS_META: Record<ChatBubbleStatus, { icon: IconComponent; label: string; className: string }> = {
  sent: { icon: Check, label: "Sent", className: "fj:text-fuji-foreground-subtle" },
  delivered: { icon: CheckCheck, label: "Delivered", className: "fj:text-fuji-foreground-subtle" },
  read: { icon: CheckCheck, label: "Read", className: "fj:text-fuji-water" },
};

export interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which side the message renders on: "incoming" (left, neutral surface) or "outgoing" (right, the accent-filled surface). Default "incoming". */
  align?: "incoming" | "outgoing";
  /** Avatar slot - typically an `<Avatar />`. Hidden (but its footprint reserved, so bubbles stay aligned) when `grouped`. */
  avatar?: React.ReactNode;
  /** Sender name, shown above the bubble. Hidden when `grouped`. */
  sender?: React.ReactNode;
  /** Timestamp string/node, shown below the bubble in a de-emphasized style so it never reads as the primary content. Hidden when `grouped`. */
  timestamp?: React.ReactNode;
  /** Delivery/read status, shown next to the timestamp as an icon + text label. Hidden when `grouped`. */
  status?: ChatBubbleStatus;
  /**
   * Marks a bubble inside a same-sender run: hides avatar/sender/timestamp/status and tightens the
   * gap. Leave the run's last message ungrouped (the default); the consumer decides what groups.
   */
  grouped?: boolean;
  /** Per-slot class overrides, for styling one part without wrapping the whole bubble. */
  classNames?: SlotClassNames<"avatar" | "sender" | "bubble" | "meta">;
}

export const ChatBubbleRoot = React.forwardRef<HTMLDivElement, ChatBubbleProps>(function ChatBubble(
  {
    align = "incoming",
    avatar,
    sender,
    timestamp,
    status,
    grouped = false,
    classNames,
    className,
    children,
    ...props
  },
  ref,
) {
  const outgoing = align === "outgoing";
  const showMeta = !grouped;
  const StatusIcon = status ? STATUS_META[status].icon : null;

  // A grid, not flex `items-end`, so the avatar sits level with the *bubble's* bottom edge rather
  // than the whole column (a 32px `size="sm"` avatar ended up almost below the bubble). Rhythm uses
  // margins, not `gap-y`: a grid gap applies even to empty tracks, costing 4px with no sender.
  const contentColumn = avatar && !outgoing ? "fj:col-start-2" : "fj:col-start-1";

  return (
    <div
      ref={ref}
      data-align={align}
      className={cn(
        "fj:grid fj:w-full fj:gap-x-2.5",
        avatar
          ? outgoing
            ? "fj:grid-cols-[minmax(0,1fr)_auto] fj:justify-items-end"
            : "fj:grid-cols-[auto_minmax(0,1fr)] fj:justify-items-start"
          : outgoing
            ? "fj:grid-cols-[minmax(0,1fr)] fj:justify-items-end"
            : "fj:grid-cols-[minmax(0,1fr)] fj:justify-items-start",
        grouped ? "fj:mt-0.5" : "fj:mt-3 fj:first:mt-0",
        className,
      )}
      {...props}
    >
      {avatar && (
        // Grouped bubbles hide the avatar in place rather than use a placeholder: only the avatar's
        // own footprint is guaranteed to match (a hard-coded 32px misaligned the default 40px one).
        <span
          aria-hidden={showMeta ? undefined : "true"}
          className={cn(
            "fj:row-start-2 fj:self-end fj:shrink-0",
            outgoing ? "fj:col-start-2" : "fj:col-start-1",
            !showMeta && "fj:invisible",
            classNames?.avatar,
          )}
        >
          {avatar}
        </span>
      )}
      {/* `display: contents` makes sender/bubble/meta grid items of the root so the avatar can align
          to the bubble's row, while keeping the root's child count for consumer selectors. */}
      <div className="fj:contents">
        {sender &&
          (showMeta ? (
            <span
              className={cn(
                "fj:row-start-1 fj:mb-1 fj:px-1 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground-subtle",
                contentColumn,
                classNames?.sender,
              )}
            >
              {sender}
            </span>
          ) : (
            // Sighted readers infer a grouped run's sender from its shape; a linear screen-reader
            // pass cannot ("they said it" vs "you said it"), so it stays announced but hidden.
            <span className="fj:sr-only">{sender}</span>
          ))}
        <div
          className={cn(
            "fuji-chat-bubble-shadow fj:row-start-2 fj:relative fj:min-w-0 fj:max-w-[75%]",
            contentColumn,
          )}
        >
          {/* Tail on the speaker-facing bottom corner, last message of a run only. Opaque fills,
              not glass: two translucent fills seam visibly even without blur or shadow. It also
              overlaps the bubble by 1px, since touching edges seam on fractional pixels (the
              arithmetic is in base.css beside `.fuji-chat-bubble-tail`). */}
          {showMeta && (
            <span
              aria-hidden="true"
              className={cn(
                "fuji-chat-bubble-tail",
                outgoing
                  ? "fuji-chat-bubble-outgoing fuji-chat-bubble-tail-outgoing"
                  : "fuji-chat-bubble-incoming fuji-chat-bubble-tail-incoming",
              )}
            />
          )}
          <div
            className={cn(
              "fj:relative fj:box-border fj:min-w-0 fj:break-words fj:rounded-fuji-panel fj:px-3.5 fj:py-2.5 fj:text-[length:var(--fuji-text-base)] fj:leading-snug",
              // Square off the corner the tail joins while it is shown, or it leaves a notch.
              showMeta && (outgoing ? "fj:rounded-br-none" : "fj:rounded-bl-none"),
              // No shadow on either bubble: a box-shadow paints over the tail and cuts the join.
              outgoing
                ? "fuji-chat-bubble-outgoing fj:text-fuji-default-foreground"
                : "fuji-chat-bubble-incoming fj:text-fuji-foreground",
              classNames?.bubble,
            )}
          >
            {children}
          </div>
        </div>
        {(timestamp || status) && showMeta && (
          <div
            className={cn(
              "fj:row-start-3 fj:mt-1 fj:flex fj:items-center fj:gap-1.5 fj:px-1 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle",
              contentColumn,
              classNames?.meta,
            )}
          >
            {timestamp && <span>{timestamp}</span>}
            {status && StatusIcon && (
              <span
                className={cn("fj:inline-flex fj:items-center fj:gap-0.5", STATUS_META[status].className)}
              >
                <StatusIcon aria-hidden="true" className="fj:size-3" />
                <span>{STATUS_META[status].label}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export interface ChatBubbleAttachmentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** Icon shown before the name - defaults to a generic paperclip. Ignored when `preview` is given. */
  icon?: IconComponent;
  /**
   * Artwork in place of the icon (thumbnail, poster), cropped to a 40px square (`classNames.preview`
   * resizes it). Give it an empty `alt` when `name` already describes the file.
   */
  preview?: React.ReactNode;
  /** File/attachment name. */
  name: React.ReactNode;
  /** Secondary detail, e.g. a file size or an audio duration ("2.4 MB", "0:42"). */
  meta?: React.ReactNode;
  /**
   * Renders a keyboard-accessible `<button type="button">` (e.g. open/download). Without it the
   * chip is a static `<div>`, so it can sit inside a consumer's own `<a>` without nesting.
   */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Per-slot class overrides. `preview` is the artwork box. */
  classNames?: SlotClassNames<"preview">;
}

const ATTACHMENT_ROW_CLASSNAME =
  "fj:box-border fj:flex fj:w-full fj:max-w-64 fj:items-center fj:gap-2 fj:rounded-fuji-control fj:border fj:border-current/15 fj:bg-current/5 fj:px-2.5 fj:py-1.5 fj:text-[length:var(--fuji-text-sm)]";

/** Small file/media chip for use inside `ChatBubble` children - an attachment, voice note, or similar rich-content row. */
const ChatBubbleAttachment = React.forwardRef<HTMLDivElement, ChatBubbleAttachmentProps>(
  function ChatBubbleAttachment(
    { icon: Glyph = Paperclip, preview, name, meta, onClick, classNames, className, ...props },
    ref,
  ) {
    const content = (
      <>
        {preview ? (
          <span
            className={cn(
              "fj:flex fj:size-10 fj:shrink-0 fj:items-center fj:justify-center fj:overflow-hidden fj:rounded-fuji-item fj:bg-current/10",
              "fj:[&>img]:size-full fj:[&>img]:object-cover fj:[&>video]:size-full fj:[&>video]:object-cover",
              classNames?.preview,
            )}
          >
            {preview}
          </span>
        ) : (
          <Glyph aria-hidden="true" className="fj:size-4 fj:shrink-0" />
        )}
        <span className="fj:min-w-0 fj:flex-1">
          <span className="fj:block fj:truncate fj:text-left fj:font-medium">{name}</span>
          {meta && (
            <span className="fj:block fj:truncate fj:text-left fj:text-[length:var(--fuji-text-xs)] fj:opacity-75">
              {meta}
            </span>
          )}
        </span>
      </>
    );

    if (onClick) {
      return (
        <div ref={ref} {...props}>
          <button
            type="button"
            onClick={onClick}
            className={cn(
              NATIVE_CONTROL_RESET,
              ATTACHMENT_ROW_CLASSNAME,
              "fj:cursor-pointer fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
              className,
            )}
          >
            {content}
          </button>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(ATTACHMENT_ROW_CLASSNAME, className)} {...props}>
        {content}
      </div>
    );
  },
);

export interface ChatBubbleTypingProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Text announced in place of the hidden animated dots. Default "Typing". Pass a name for group
   * threads ("Priya is typing") or a translated string.
   */
  label?: string;
}

/**
 * "Someone is typing" dots, as a bubble's only child; `role="status"` announces `label`. The pulse
 * stops under `prefers-reduced-motion: reduce`. Pure CSS, so it stays server-renderable.
 */
const ChatBubbleTyping = React.forwardRef<HTMLSpanElement, ChatBubbleTypingProps>(function ChatBubbleTyping(
  { label = "Typing", className, ...props },
  ref,
) {
  const dot =
    "fj:size-1.5 fj:rounded-full fj:bg-current fj:animate-fuji-pulse fj:[animation-duration:1.2s] fj:motion-reduce:animate-none";
  return (
    <span
      ref={ref}
      role="status"
      className={cn("fj:inline-flex fj:h-[1lh] fj:items-center fj:gap-1 fj:align-middle", className)}
      {...props}
    >
      <span aria-hidden="true" className="fj:inline-flex fj:items-center fj:gap-1">
        {/* Staggered left to right. Full class strings - Tailwind's scanner is static. */}
        <span className={dot} />
        <span className={cn(dot, "fj:[animation-delay:200ms]")} />
        <span className={cn(dot, "fj:[animation-delay:400ms]")} />
      </span>
      <span className="fj:sr-only">{label}</span>
    </span>
  );
});

export { ChatBubbleAttachment, ChatBubbleTyping };

/** `<ChatBubble align="outgoing" avatar={...} timestamp="..." status="read"><ChatBubble.Attachment name="..." /></ChatBubble>` */
export const ChatBubble = Object.assign(ChatBubbleRoot, {
  Attachment: ChatBubbleAttachment,
  Typing: ChatBubbleTyping,
});
