---
"@fujiui/react": minor
---

`regular` and `floating` elevation now use **identical** control heights and
panel padding - elevation changes shadow depth only, matching what
SPEC.md/README.md/docs/theming.md already claimed but the tokens didn't
actually deliver.

**The bug:** `[data-fuji-elevation="regular"]` in `tokens.css` overrode
`--fuji-control-h-sm` (29px -> 30px), `--fuji-control-h-md` (38px -> 36px),
and `--fuji-panel-p` (16px -> 14px), while `floating` kept the `:root`
defaults. So switching elevation at runtime silently resized every control
and panel by a couple of pixels - a real, visible layout shift for something
docs describe as "shadow depth only."

**The fix:** removed the `[data-fuji-elevation="regular"]` override block
entirely. Both modes now read the same `:root` control-height/panel-padding
values; only the `[data-fuji-theme="*"][data-fuji-elevation="floating"]`
shadow-token blocks still differ between the two modes, exactly as intended.

This is a visible sizing change for anyone using `floating` (or switching
between the two at runtime): controls and panels in `regular` are now
1-2px taller/more-padded than they were (matching what `floating` already
looked like), since `regular`'s values were the ones removed, not
`floating`'s. Docs (`SPEC.md`, `README.md`, `docs/theming.md`) updated to
match - all three previously described a "regular reads more compact"
distinction that no longer exists.
