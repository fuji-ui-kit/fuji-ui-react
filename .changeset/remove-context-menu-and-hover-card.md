---
"@fujiui/react": minor
---

Remove `ContextMenu` and `HoverCard` from the public API.

**Migration notes:**

- `ContextMenu` (and `ContextMenuRoot`/`ContextMenuTrigger`/`ContextMenuContent`/`ContextMenuItem`/`ContextMenuSeparator`)
  is removed. It was a thin wrapper around Base UI's `@base-ui/react/context-menu`
  primitive. Consumers who need custom right-click behavior can depend on
  `@base-ui/react/context-menu` directly - it is unaffected, it's just no
  longer wrapped/exported by Fuji.
- `HoverCard` (and `HoverCardRoot`/`HoverCardTrigger`/`HoverCardContent`/`HoverCardContentProps`)
  is removed. It was a thin wrapper around Base UI's `@base-ui/react/preview-card`
  primitive. Consumers who need hover/focus preview behavior can depend on
  `@base-ui/react/preview-card` directly - it is unaffected, it's just no
  longer wrapped/exported by Fuji.
