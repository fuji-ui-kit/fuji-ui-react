---
"@fujiui/react": minor
---

Fix the documented-but-missing named sub-exports, the unstyled provider-less
render, and CommonJS type resolution.

**Named compound sub-exports now exist.** `README.md`, `docs/nextjs.md` and
`SPEC.md` §4 all instruct Server Component consumers to import the named form
(`import { DialogContent } from "@fujiui/react"`) because a static property
read (`Dialog.Content`) fails across a `"use client"` boundary. Those exports
were documented but never actually exported, so following the documentation
was a compile error. Every compound now exports its parts by name alongside
the dot-access form, and the two are asserted to be the same reference:

`AlertDialog`, `Card`, `ChatBubble`, `Collapsible`, `Dialog`, `Drawer`,
`DropdownMenu`, `Fieldset`, `FormField`, `List`, `NavigationMenu`, `Popover`,
`RadioGroup`, `Sidebar`, `Table`, `Tabs`, `Tooltip` — e.g. `DialogContent`,
`DialogTrigger`, `CardHeader`, `TableRow`, `TabsList`, `FormFieldLabel`.

Also newly exported: `CarouselHandle` (needed to type a `useRef` for
`Carousel`'s imperative handle), `TableProps`, `TableRowProps`, `LinkColor`,
`ButtonGroupItem`, `CollapsibleTriggerProps`, `NavigationMenuPortalProps`.

**Provider-less and pre-hydration renders are styled.** 17 core tokens
(`--fuji-surface`, `--fuji-foreground`, `--fuji-default`, `--fuji-focus-ring`,
`--fuji-background`, …) existed only under `[data-fuji-theme="…"]`. Because
`FujiProvider` is optional (SPEC §2) and, with `persist`, the scope wrapper
intentionally carries no `data-fuji-*` until the bootstrap script or the mount
effect runs, those tokens resolved to nothing — a provider-less `<Button>`
painted transparent with inherited text color. `:root` now mirrors the
complete light set. The `:root` tone colors, which had drifted from the light
theme's (`--fuji-earth` was `#8b5e3c` vs light's `#b87c4c`), are aligned too,
so a provider-less render is pixel-identical to `theme="light"`.

**CommonJS consumers get CommonJS types.** The `exports` map had no `types`
condition under `require`, so `dist/index.d.cts` was built and published but
unreachable; a `require`-mode TypeScript consumer resolved the ESM-flavoured
`dist/index.d.ts` instead and could hit TS1479 under `moduleResolution:
node16`. Both conditions now declare their own `types`.

**Packaging and docs.** Removed the duplicate `sourceMappingURL` comment tsup
8.5.1 emits for every file in `bundle: false` mode (178 stray lines in the
tarball). Corrected the package name from `@fuji-ui/react` to `@fujiui/react`
in `THIRD_PARTY_NOTICES.md` (which ships) and across the contributor guides,
the packed-tarball filename in `docs/migration.md` and `CONTRIBUTING.md`
(`fujiui-react-<version>.tgz`), and the component count in `README.md`
(79, not ~90).
