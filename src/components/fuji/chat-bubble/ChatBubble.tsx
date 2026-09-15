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
   * Marks this bubble as part of a consecutive run of messages from the same
   * sender: suppresses the avatar/sender/timestamp/status and tightens the
   * vertical gap before it. Render the last message of each run with
   * `grouped={false}` (the default) to surface that metadata once per run,
   * the way Messages/Slack-style threads do. ChatBubble itself does not know
   * about a list of messages - the consumer decides which bubbles group.
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

  return (
    <div
      ref={ref}
      data-align={align}
      className={cn(
        "fj:flex fj:w-full fj:items-end fj:gap-2.5",
        outgoing && "fj:flex-row-reverse",
        grouped ? "fj:mt-0.5" : "fj:mt-3 fj:first:mt-0",
        className,
      )}
      {...props}
    >
      {avatar &&
        (showMeta ? (
          <span className={cn("fj:shrink-0", classNames?.avatar)}>{avatar}</span>
        ) : (
          // Reserves the avatar's footprint so grouped bubbles stay aligned
          // with the run's other messages instead of drifting outward.
          <span className="fj:size-8 fj:shrink-0" aria-hidden="true" />
        ))}
      <div
        className={cn(
          "fj:flex fj:min-w-0 fj:max-w-[75%] fj:flex-col fj:gap-1",
          outgoing ? "fj:items-end" : "fj:items-start",
        )}
      >
        {sender &&
          (showMeta ? (
            <span
              className={cn(
                "fj:px-1 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground-subtle",
                classNames?.sender,
              )}
            >
              {sender}
            </span>
          ) : (
            // Grouped messages hide the sender because a sighted reader infers
            // it from the run's shape and the shared avatar column. There is
            // no equivalent inference in a linear screen-reader pass: a run of
            // five grouped messages announced five unattributed bubbles, and
            // in a two-party thread that is the difference between "they said
            // it" and "you said it". Visually suppressed, still announced.
            <span className="fj:sr-only">{sender}</span>
          ))}
        <div className="fuji-chat-bubble-shadow fj:relative fj:min-w-0">
          {/* Speech-bubble tail, anchored at the bubble's bottom corner on the
              side that faces the speaker - bottom-right when outgoing,
              bottom-left when incoming - which is where a chat client puts it.
              Shown only on the last message of a run (same rule as the
              sender/timestamp/status metadata) so a thread reads as one
              connected shape per run, not a tail per message.

              The tail carries the bubble's exact fill and no border, and the
              bubble squares off the corner it joins (`rounded-b*-none` below)
              so the two read as one shape rather than a triangle stuck to a
              rounded box.

              Both use the opaque `fuji-chat-bubble-*` fills (see base.css)
              rather than the glass material, and that took three attempts to
              get right, so it is worth recording what actually mattered.
              Removing the blur was not enough, and neither was removing the
              shadow: bubble and tail are two separate elements, and two
              *translucent* fills of the same declared colour still do not meet
              cleanly at their seam - under glass the tail read as a visibly
              darker wedge. Forcing both opaque removed the seam completely
              with nothing else changed, which is what pinned the cause down.
              Opaque is also how chat clients draw bubbles, and matches the
              HIG's rule that the content layer uses plain surfaces. */}
          {showMeta && (
            <span
              aria-hidden="true"
              className={cn(
                "fj:pointer-events-none fj:absolute fj:bottom-0 fj:h-3 fj:w-2",
                outgoing
                  ? "fuji-chat-bubble-outgoing fj:-right-2 fj:[clip-path:polygon(0_0,100%_100%,0_100%)]"
                  : "fuji-chat-bubble-incoming fj:-left-2 fj:[clip-path:polygon(100%_0,100%_100%,0_100%)]",
              )}
            />
          )}
          <div
            className={cn(
              "fj:relative fj:box-border fj:min-w-0 fj:break-words fj:rounded-fuji-panel fj:px-3.5 fj:py-2.5 fj:text-[length:var(--fuji-text-base)] fj:leading-snug",
              // Square off only the corner the tail joins, and only while it
              // is shown - otherwise the rounded corner leaves a visible
              // notch between bubble and tail.
              showMeta && (outgoing ? "fj:rounded-br-none" : "fj:rounded-bl-none"),
              // No shadow on either bubble, deliberately: a box-shadow paints
              // over the tail that sits outside the bubble's box, so the
              // darkened area cut across the join. The fill carries the shape.
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
              "fj:flex fj:items-center fj:gap-1.5 fj:px-1 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle",
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
  /** Icon shown before the name - defaults to a generic paperclip. */
  icon?: IconComponent;
  /** File/attachment name. */
  name: React.ReactNode;
  /** Secondary detail, e.g. a file size or an audio duration ("2.4 MB", "0:42"). */
  meta?: React.ReactNode;
  /** Renders as a real, keyboard-accessible `<button type="button">` (e.g. to open/download the attachment) instead of a static chip. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const ATTACHMENT_ROW_CLASSNAME =
  "fj:box-border fj:flex fj:w-full fj:max-w-64 fj:items-center fj:gap-2 fj:rounded-fuji-control fj:border fj:border-current/15 fj:bg-current/5 fj:px-2.5 fj:py-1.5 fj:text-[length:var(--fuji-text-sm)]";

/** Small file/media chip for use inside `ChatBubble` children - an attachment, voice note, or similar rich-content row. */
const ChatBubbleAttachment = React.forwardRef<HTMLDivElement, ChatBubbleAttachmentProps>(
  function ChatBubbleAttachment({ icon: Glyph = Paperclip, name, meta, onClick, className, ...props }, ref) {
    const content = (
      <>
        <Glyph aria-hidden="true" className="fj:size-4 fj:shrink-0" />
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

export { ChatBubbleAttachment };

/** `<ChatBubble align="outgoing" avatar={...} timestamp="..." status="read"><ChatBubble.Attachment name="..." /></ChatBubble>` */
export const ChatBubble = Object.assign(ChatBubbleRoot, { Attachment: ChatBubbleAttachment });
