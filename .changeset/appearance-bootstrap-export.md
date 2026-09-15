---
"@fujiui/react": minor
---

**New: the appearance bootstrap script ships.** `buildAppearanceBootstrapScript()`
returns the small pre-paint script that reads a returning visitor's saved
theme/material/radius/elevation and stamps the `data-fuji-*` attributes before first
paint, so `persist` no longer flashes the default theme on load. It comes with
`APPEARANCE_STORAGE_KEY` (the `localStorage` key `persist` writes) and the
`StoredAppearance` type describing the payload.

It returns a string; the package never injects it. Where it runs is still the
app's decision - `docs/ssr.md` shows the Next.js and Vite placements.

Previously every consumer hand-copied this script out of the documentation,
which meant the storage key and payload shape were duplicated in every app that
used `persist` and drifted silently the moment either changed. `SPEC.md` §3 and
§6 are updated: §6 had stated the package does not ship the script.
