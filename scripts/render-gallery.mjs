#!/usr/bin/env node
/*
 * Renders real built components to static HTML for all 16 appearance combinations, since token
 * edits restyle all 79 components and only real output shows "this broke Badge". Build first.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
// Deliberately NOT under dist/: `files: ["dist", ...]` would publish the
// whole gallery to npm (it added 36 kB and 13 files before this moved).
const OUT = ".gallery";

if (!existsSync("dist/index.cjs") || !existsSync("dist/styles.css")) {
  console.error("Run `npm run build` first - dist/index.cjs or dist/styles.css is missing.");
  process.exit(1);
}

const F = require("../dist/index.cjs");

const THEMES = ["light", "dark"];
const MATERIALS = ["solid", "glass"];
const RADII = ["cornered", "soft"];
const ELEVATIONS = ["regular", "floating"];

/** A labelled block in the gallery grid. */
function Spec(label, ...children) {
  return h(
    "div",
    { key: label, style: { display: "flex", flexDirection: "column", gap: 10, minWidth: 0 } },
    h(
      "div",
      {
        style: {
          font: "600 10px ui-monospace, monospace",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          opacity: 0.5,
        },
      },
      label,
    ),
    h("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" } }, ...children),
  );
}

const TONES = ["default", "fire", "water", "forest", "sun"];

function gallery() {
  return h(
    Fragment,
    null,
    Spec("Button / tones", ...TONES.map((tone) => h(F.Button, { key: tone, tone }, tone))),
    Spec(
      "Button / appearance",
      ...["contained", "bordered", "dashed", "ghost"].map((appearance) =>
        h(F.Button, { key: appearance, appearance }, appearance),
      ),
    ),
    Spec(
      "Button / sizes + states",
      ...["sm", "md", "lg"].map((size) => h(F.Button, { key: size, size }, size)),
      h(F.Button, { loading: true }, "loading"),
      h(F.Button, { disabled: true }, "disabled"),
    ),
    Spec("Badge", ...TONES.map((tone) => h(F.Badge, { key: tone, tone }, tone))),
    Spec(
      "Fields",
      h(F.Input, { placeholder: "Email address", defaultValue: "" }),
      h(F.Input, { placeholder: "Disabled", disabled: true }),
      h(F.Textarea, { placeholder: "Notes", rows: 2 }),
    ),
    Spec(
      "Toggles",
      h(F.Checkbox, { defaultChecked: true, label: "Checked" }),
      h(F.Checkbox, { label: "Unchecked" }),
      h(F.Switch, { defaultChecked: true }),
      h(F.Switch, {}),
    ),
    Spec(
      "Surfaces",
      h(
        F.Card,
        { style: { width: 240 } },
        h(F.CardHeader, null, h(F.CardTitle, null, "Card title")),
        h(F.CardContent, null, h(F.Typography, { variant: "body" }, "Body copy on a card surface.")),
      ),
      h(
        F.Card,
        { style: { width: 200 } },
        h(F.CardContent, null, h(F.Statistic, { label: "Revenue", value: 12480, prefix: "$" })),
      ),
    ),
    Spec(
      "Alert",
      ...["info", "success", "warning", "danger"].map((variant) =>
        h(F.Alert, { key: variant, variant, title: variant, style: { width: 210 } }, `${variant} message`),
      ),
    ),
    Spec(
      "Table",
      h(
        F.Table,
        { style: { width: 320 } },
        h(
          F.TableHeader,
          null,
          h(F.TableRow, null, h(F.TableHead, null, "Name"), h(F.TableHead, null, "Role")),
        ),
        h(
          F.TableBody,
          null,
          h(F.TableRow, null, h(F.TableCell, null, "Lyka"), h(F.TableCell, null, "Designer")),
          h(F.TableRow, null, h(F.TableCell, null, "Kenji"), h(F.TableCell, null, "Engineer")),
        ),
      ),
    ),
    Spec(
      "Feedback",
      h(F.Progress, { value: 62, style: { width: 160 } }),
      h(F.Spinner, {}),
      h(F.Skeleton, { variant: "text", style: { width: 120 } }),
      h(F.StatusIndicator, { variant: "success", label: "Online" }),
    ),
    Spec(
      "Avatar",
      h(F.Avatar, { fallback: "GL" }),
      h(F.Avatar, { fallback: "KS", tone: "forest" }),
      h(F.Avatar, { fallback: "PN", size: "lg" }),
    ),
    Spec(
      "Timeline",
      h(F.Timeline, {
        style: { width: 300 },
        items: [
          { title: "Order confirmed", variant: "success", timestamp: "9:02 AM" },
          { title: "Out for delivery", variant: "info", timestamp: "8:00 AM" },
          { title: "Delivered", timestamp: "Pending" },
        ],
      }),
    ),
  );
}

function page(theme, material, radius, elevation) {
  const body = renderToStaticMarkup(
    h(
      F.FujiProvider,
      { theme, material, radius, elevation },
      h("div", { style: { display: "flex", flexDirection: "column", gap: 22, padding: 24 } }, gallery()),
    ),
  );
  // `<html>` is outside the provider's tree, so its data-fuji-* attrs are set by hand: `body`'s
  // `--fuji-page-background` only sees tokens on its own ancestors. Glass tint follows theme.
  const glassTint = theme === "dark" ? "dark" : "light";
  return `<!doctype html><meta charset="utf-8">
<title>${theme} / ${material} / ${radius} / ${elevation}</title>
<link rel="stylesheet" href="../dist/styles.css">
<style>
  html,body{margin:0}
  body{background:var(--fuji-page-background,var(--fuji-background));min-height:100vh}
</style>
<html data-fuji-theme="${theme}" data-fuji-material="${material}" data-fuji-glass="${glassTint}" data-fuji-radius="${radius}" data-fuji-elevation="${elevation}">
${body}`;
}

mkdirSync(OUT, { recursive: true });
const combos = [];
for (const theme of THEMES)
  for (const material of MATERIALS)
    for (const radius of RADII)
      for (const elevation of ELEVATIONS) {
        const name = `${theme}-${material}-${radius}-${elevation}.html`;
        writeFileSync(`${OUT}/${name}`, page(theme, material, radius, elevation), "utf8");
        combos.push({ theme, material, radius, elevation, name });
      }

writeFileSync(
  `${OUT}/index.html`,
  `<!doctype html><meta charset="utf-8"><title>Fuji appearance gallery</title>
<style>
 body{margin:0;font:13px system-ui;background:#fff;color:#111}
 h1{font-size:15px;padding:14px 16px;margin:0;border-bottom:1px solid #e5e5e5}
 .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:16px}
 figure{margin:0}
 figcaption{font:600 11px ui-monospace,monospace;padding:0 0 6px;color:#666}
 iframe{width:100%;height:640px;border:1px solid #e0e0e0;border-radius:8px;background:#fff}
</style>
<h1>Fuji appearance gallery — ${combos.length} combinations</h1>
<div class="grid">
${combos.map((c) => `<figure><figcaption>${c.theme} / ${c.material} / ${c.radius} / ${c.elevation}</figcaption><iframe loading="lazy" src="${c.name}"></iframe></figure>`).join("\n")}
</div>`,
  "utf8",
);

console.log(`Rendered ${combos.length} appearance combinations to ${OUT}/index.html`);
