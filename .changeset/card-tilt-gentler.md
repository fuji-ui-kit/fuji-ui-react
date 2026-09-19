---
"@fujiui/react": patch
---

`Card effect="tilt"` leans more gently: at most 3deg at the corners (was 7deg), under a 1200px perspective (was 500px), with a 4px push-back (was 10px). A large card no longer swings visibly out of plane.
