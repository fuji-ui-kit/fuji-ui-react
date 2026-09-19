---
"@fujiui/react": patch
---

**Fixed: `BottomNavigation` reported the wrong index for items after a centre
`action`.** With an `action`, the bar splits its items around the raised
button, and the second half was numbered from 0 again - so in a four-item bar
`onItemSelect` reported "Friends" as index 1 and "Playing" as index 0, and an
app switching screens by index opened the wrong one. Each item now reports its
own position in `items`.
