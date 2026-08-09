---
"@fuji-ui/react": minor
---

Add `ChatBubble`, a Fuji-native chat message bubble for messaging/inbox-style
UI, alongside `Notification` and `List`.

- `align` (`"incoming" | "outgoing"`, default `"incoming"`) picks left-aligned
  neutral styling vs. right-aligned contained/accent styling, reusing the same
  tokens as `Button`/`Badge` - no new colors.
- `avatar` accepts any `React.ReactNode` (typically an `<Avatar />`); `sender`,
  `timestamp`, and `status` (`"sent" | "delivered" | "read"`, rendered as an
  icon **and** a text label, never color alone) round out the message metadata.
- `grouped` suppresses the avatar/sender/timestamp/status and tightens spacing
  for consecutive messages from the same sender, while still reserving the
  avatar's footprint so the run stays aligned. `ChatBubble` itself does not own
  any list/collection state - the consumer decides which bubbles are grouped.
- `children` is a free-form content area (text, an attachment chip, a
  typing-dots indicator, an audio-row composition, ...); `ChatBubble.Attachment`
  (also exported as `ChatBubbleAttachment`) is a small file/media chip
  sub-component for the common case, renderable as a static chip or - with
  `onClick` - a real, keyboard-accessible button.
- Server-renderable (no `"use client"`), theme/radius/elevation-aware, and
  capped at `max-w-[75%]` with `break-words` so it stays usable at 375px
  widths.
