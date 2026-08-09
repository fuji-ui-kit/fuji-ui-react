import * as React from "react";
import type { Preview, Decorator } from "@storybook/react";
// Real, compiled output - the exact stylesheet consumers import as
// `@fuji-ui/react/styles.css`. Never hand-write or duplicate Fuji styles
// here; if this file is missing, run `npm run build:css` (the `storybook`
// and `storybook:build` npm scripts already do this before starting).
import "./generated/storybook.css";
import "../dist/styles.css";
// Storybook-only utilities for classes used solely in `stories/`/`.storybook/`
// (e.g. `max-w-3xl`) - dist/styles.css deliberately excludes these so they
// never leak into the published package. See storybook-entry.css and
// scripts/build-storybook-css.mjs. Loaded after dist/styles.css so it can
// never override real Fuji component styling, only add layout utilities.
// Storybook-only typography baseline (Inter / Zen Kaku Gothic New / Mochiy
// Pop One + font smoothing) - see fonts.css and preview-head.html for why.
import "./fonts.css";
import { FujiProvider } from "@fuji-ui/react";
import type { FujiElevation, FujiRadius, FujiTheme } from "@fuji-ui/react";

const THEMES: FujiTheme[] = ["light", "dark", "glass"];
const RADII: FujiRadius[] = ["cornered", "soft"];
const ELEVATIONS: FujiElevation[] = ["regular", "floating"];

/**
 * Wraps every story in one `FujiProvider`, controlled from Storybook's own
 * theme/radius/elevation toolbar globals (`context.globals`) rather than
 * component-local state. Controlled props update in place - React never
 * remounts this subtree when a toolbar value changes, so switching theme
 * mid-story preserves whatever the story's own components are doing
 * (an open dialog, typed input, a controlled step) instead of resetting it.
 *
 * `persist={false}`: a real app's root provider persists to `localStorage`
 * with a `fuji-appearance` key shared across the whole origin - Storybook's
 * preview iframe must never write there, and every story should start from
 * exactly the toolbar's current selection, not a stale saved value.
 *
 * The wrapper's own height/padding depend on `context.viewMode`:
 * - `"story"` (a story opened on its own, canvas tab or full-screen link)
 *   gets `min-h-screen` plus real padding, so background/glass-atmosphere
 *   fills the isolated preview the way it would fill a real page.
 * - `"docs"` (the same story embedded in an Autodocs page) gets a smaller
 *   fixed floor (`min-h-48`) plus modest padding instead. Storybook's own
 *   docs-canvas `<iframe>` paints a plain white background behind whatever
 *   this wrapper doesn't cover - a shrink-to-content wrapper (no min-height)
 *   left that white iframe background exposed below/around short components
 *   in glass/dark themes (verified in-browser). `min-h-48` is tall enough to
 *   show the atmosphere/theme clearly without ballooning every embedded
 *   example on a Docs page the way `min-h-screen` would.
 */
const withFujiProvider: Decorator = (Story, context) => {
  const theme = context.globals.theme as FujiTheme;
  const radius = context.globals.radius as FujiRadius;
  const elevation = context.globals.elevation as FujiElevation;
  const isDocs = context.viewMode === "docs";

  return (
    <FujiProvider theme={theme} radius={radius} elevation={elevation} persist={false}>
      {/*
        `.fuji-glass-atmosphere` is the same shipped utility class the real
        website uses behind glass-theme content (see tokens.css) - reused
        here, not recreated, per the "no duplicated tokens/styles" rule. Its
        selector is scoped to `[data-fuji-theme="glass"] .fuji-glass-atmosphere`,
        so it is visually inert under light/dark and only paints the
        atmospheric gradient when the glass theme is actually active - safe to
        render unconditionally.
      */}
      <div className={`fuji-glass-atmosphere ${isDocs ? "min-h-48 p-6" : "min-h-screen p-4 sm:p-8"}`}>
        <Story />
      </div>
    </FujiProvider>
  );
};

const preview: Preview = {
  tags: ["autodocs"],
  decorators: [withFujiProvider],
  globalTypes: {
    theme: {
      description: "Fuji theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: THEMES.map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
    radius: {
      description: "Fuji radius",
      toolbar: {
        title: "Radius",
        icon: "component",
        items: RADII.map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
    elevation: {
      description: "Fuji elevation",
      toolbar: {
        title: "Elevation",
        icon: "box",
        items: ELEVATIONS.map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
    radius: "cornered",
    elevation: "regular",
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Fuji's own theme controls the canvas color (see the decorator above) -
    // Storybook's separate background-swatch tool would fight it, so it's
    // switched off rather than left to conflict.
    backgrounds: { disable: true },
    viewport: {
      viewports: {
        mobile: { name: "Mobile (375)", styles: { width: "375px", height: "812px" } },
        tablet: { name: "Tablet (768)", styles: { width: "768px", height: "1024px" } },
        laptop: { name: "Laptop (1024)", styles: { width: "1024px", height: "768px" } },
        desktop: { name: "Desktop (1440)", styles: { width: "1440px", height: "900px" } },
      },
    },
    options: {
      storySort: {
        order: [
          "Overview",
          "Inputs",
          ["Button", "IconButton", "Input", "Textarea", "Select", "Combobox"],
          "Data Display",
          ["Card", "Statistic", "Table", "DataTable", "Chart", "Carousel", "Calendar", "DatePicker"],
          "Navigation",
          ["Navbar", "Tabs", "Pagination"],
          "Overlays",
          ["Dialog", "Drawer", "Popover", "Tooltip"],
          "Feedback",
          ["Toast", "Alert"],
        ],
      },
    },
  },
};

export default preview;
