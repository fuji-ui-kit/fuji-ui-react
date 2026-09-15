---
"@fujiui/react": minor
---

Make `--fuji-glass-atmosphere-image` hold the light scene under light theme, and
lighten `--fuji-fire` on dark glass.

The atmosphere token had a single unqualified declaration holding the dark
scene. The light scene existed only as a literal inside
`[data-fuji-material="glass"][data-fuji-theme="light"] .fuji-glass-atmosphere`,
a rule specific enough (0,3,0) to outrank the `var(--fuji-glass-atmosphere-image)`
rule (0,2,0) that is supposed to drive that class. So the class painted
correctly in both themes and nothing looked wrong - but the token itself was the
dark scene under light theme, and its own documentation invites consumers to
reference it when building their own backdrop. Anyone who did got a dark scene
under a light app.

The light scene now lives in the token, byte-for-byte the gradient that rule
painted, and the rule is gone. One source of truth; the rendered output is
unchanged in both themes. A regression guard now rejects any theme-specific rule
that hardcodes this background-image behind the token's back - the same drift
the neighbouring parity test already guarded against one specificity level down.

`--fuji-fire` on dark glass goes `#ffa8a8` -> `#ffb4b4`. Used as text on a glass
surface over the atmosphere's brightest pixels it measured 4.32:1, the only one
of the four accents to miss AA there (forest 4.87, water 5.04, sun 5.09). It is
now 4.70:1, and unchanged at the scene's dark end, which stays above 9:1.
