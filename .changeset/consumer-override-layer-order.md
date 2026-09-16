---
"@fujiui/react": patch
---

Fixed: a utility passed through `className` could not override a component's
own styling in a Tailwind v4 app. `<Card className="p-0">`,
`<Sidebar className="w-full">`, `<Drawer className="w-[28rem]">` and margins
on `<Typography>` all silently did nothing.

A cascade layer ranks by the first time its name appears on a page, and that
ranking is compared before specificity. `styles.css` only declared its own
`fuji.*` layers, so where they landed depended on which stylesheet the bundler
emitted first. If the app's Tailwind CSS came first, `fuji` ranked above the
app's `utilities` and every override lost. If `styles.css` came first, `fuji`
ranked below the app's `base`, and Tailwind's preflight
(`* { padding: 0; margin: 0; border: 0 solid }`,
`button { background-color: transparent }`) stripped the padding, borders and
fills off every component.

`styles.css` now opens with
`@layer properties, theme, base, fuji, components, utilities;`, which puts
Fuji above the app's preflight and below its own components and utilities
whenever the package stylesheet loads first. To get that order whichever file
loads first, add the same line at the top of your global CSS, above every
`@import`:

```css
@layer properties, theme, base, fuji, components, utilities;
```

Fuji's rules still live only in its own `fuji.*` layers. The bare layer names
are only declared, and stay empty. Apps whose CSS is not in any layer (plain
CSS, Tailwind v3) are unaffected: unlayered CSS already outranks every layer.
See "Overriding a component's styles with `className`" in `docs/theming.md`.

Checked in headless Chrome against a real Tailwind v4.1 build. Without the
line, loading the app's CSS first still loses overrides and loading
`styles.css` first now works. With the line, both orders pass, and so does
importing both files from one `globals.css`. Checked for both orders:
overrides for padding, width, background, margin and display win; Fuji's
padding, border, fill, margin and font weight survive preflight; and
`fuji.components` still beats `fuji.utilities`.
