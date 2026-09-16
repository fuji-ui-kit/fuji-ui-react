## Conversation

align='incoming' (default) renders on the left with a neutral surface; align='outgoing' renders on the right with the accent-filled surface.

```tsx
<ChatBubble avatar={<Avatar fallback="PN" size="sm" />} sender="Priya Nair" timestamp="9:41 AM">
  Can you review the PR before standup?
</ChatBubble>
<ChatBubble align="outgoing" timestamp="9:42 AM" status="delivered">
  On it now, give me ten minutes.
</ChatBubble>
```

## Delivery status

status renders as an icon plus a text label next to the timestamp - never color alone.

```tsx
<ChatBubble align="outgoing" status="sent">Deploying now</ChatBubble>
<ChatBubble align="outgoing" status="delivered">Build passed</ChatBubble>
<ChatBubble align="outgoing" status="read">Live on production</ChatBubble>
```

## Grouped runs

grouped suppresses the avatar/sender/timestamp/status and tightens spacing. Render the last bubble in a run with grouped={false} (the default) so metadata surfaces once per run.

```tsx
<ChatBubble sender="Kenji Sato" grouped>Pushed the fix to main</ChatBubble>
<ChatBubble sender="Kenji Sato" timestamp="2:14 PM" status="delivered">
  CI is green, ready to deploy
</ChatBubble>
```

## With an attachment

ChatBubble.Attachment is a small file/media chip for use inside children - pass onClick to make it a real, keyboard-accessible button.

```tsx
<ChatBubble align="outgoing" status="read">
  Here's the signed contract.
  <ChatBubble.Attachment name="contract-v2.pdf" meta="1.2 MB" onClick={openFile} />
</ChatBubble>
```

## Image attachment with a preview

preview replaces the icon with artwork - an image thumbnail, a video poster - cropped into a small rounded square. Without onClick the chip is a plain element, so it can sit inside your own link.

```tsx
<ChatBubble align="outgoing" status="read">
  Photos from the site visit
  <ChatBubble.Attachment
    preview={<img src={thumbnailUrl} alt="" />}
    name="IMG_2041.jpg"
    meta="3.1 MB"
    onClick={openPhoto}
  />
</ChatBubble>
```

## Typing indicator

ChatBubble.Typing renders three pulsing dots with a visually hidden status label (default "Typing"). The pulse stops under prefers-reduced-motion.

```tsx
<ChatBubble avatar={<Avatar fallback="PN" size="sm" />} sender="Priya Nair">
  <ChatBubble.Typing label="Priya is typing" />
</ChatBubble>
```
