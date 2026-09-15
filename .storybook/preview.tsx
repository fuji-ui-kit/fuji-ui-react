import * as React from "react";
import type { Preview, Decorator } from "@storybook/react";
// Real, compiled output - the exact stylesheet consumers import as
// `@fujiui/react/styles.css`. Never hand-write or duplicate Fuji styles
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
import { FujiProvider } from "@fujiui/react";
import type { FujiElevation, FujiMaterial, FujiRadius, FujiTheme } from "@fujiui/react";

const THEMES: FujiTheme[] = ["light", "dark"];
const MATERIALS: FujiMaterial[] = ["solid", "glass"];

/**
 * What sits BEHIND the glass. Glass is a material - HIG's point is that it
 * only means anything over content - so this single toolbar covers every
 * demo backdrop: the default (`"none"`: just the theme background), the
 * opt-in decorative `.fuji-glass-atmosphere` gradient canvas (`"atmosphere"`,
 * the same shipped utility class real consumers apply themselves), or a
 * concrete scene (a light page, a dark page, a mixed light/dark scene, a
 * photograph) to test translucency against real content. `"atmosphere"` and
 * the concrete scenes are mutually exclusive by construction now - they're
 * one control, not two fighting over the wrapper's background. Inert under
 * the `solid` material (that paints its own page background over it).
 */
const BACKDROPS: Record<string, React.CSSProperties> = {
  none: {},
  atmosphere: {},
  light: { background: "linear-gradient(135deg, #f6f5f2 0%, #e6e9ef 60%, #d9dde6 100%)" },
  dark: { background: "linear-gradient(135deg, #0f1115 0%, #1b1f27 60%, #262b36 100%)" },
  mixed: {
    background:
      "radial-gradient(60% 80% at 18% 22%, #ffffff 0%, rgb(255 255 255 / 0) 70%), radial-gradient(50% 60% at 82% 78%, #05070a 0%, rgb(5 7 10 / 0) 70%), radial-gradient(40% 40% at 70% 20%, #f5b64a 0%, rgb(245 182 74 / 0) 70%), radial-gradient(45% 45% at 25% 80%, #3b7bd6 0%, rgb(59 123 214 / 0) 70%), linear-gradient(135deg, #eef0f4 0%, #5f6775 50%, #11141a 100%)",
  },
  // `photo` is built per-theme by `backdropStyle` below, not stored flat here:
  // it needs a scrim, and which way the scrim goes depends on the theme.
  photo: {},
};

const PHOTO_URL = "url(https://picsum.photos/id/1018/1600/1000)";

/**
 * The photo backdrop, scrimmed toward the active theme.
 *
 * Unscrimmed, this was the one backdrop that made CORRECT components look
 * broken. A photograph can present any brightness under the same panel, and no
 * genuinely translucent material survives that - measured on
 * `data-display-statistic--as-card` in dark glass, its value text sat at
 * 1.69:1 over the bright sky in this image while measuring 6.58:1 over Fuji's
 * own atmosphere. Nothing in the library is wrong there; the demo was simply
 * asking glass to do something opacity alone can do.
 *
 * A scrim is what a real product does with a hero image behind content, so
 * this now demos the realistic case: 55% toward the theme's own ground, which
 * keeps the photograph plainly visible (it is still a translucency test - you
 * can see the hillside through the panels) while bounding how bright or dark
 * the pixels under a panel can get. Re-measured, the same statistic clears AA
 * against even a pure-white or pure-black source pixel.
 *
 * The unbounded worst case is NOT lost: `mixed` spans pure #ffffff to #05070a
 * by construction and remains the deliberate stress test.
 */
function backdropStyle(backdrop: string, theme: FujiTheme): React.CSSProperties | undefined {
  if (backdrop !== "photo") return BACKDROPS[backdrop];
  const scrim =
    theme === "dark"
      ? "linear-gradient(rgb(12 14 18 / 55%), rgb(12 14 18 / 55%))"
      : "linear-gradient(rgb(255 255 255 / 55%), rgb(255 255 255 / 55%))";
  return {
    backgroundImage: `${scrim}, ${PHOTO_URL}`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
const BACKDROP_TITLES: Record<string, string> = {
  none: "None (theme only)",
  atmosphere: "Atmosphere",
  light: "Light",
  dark: "Dark",
  mixed: "Mixed",
  photo: "Photo",
};
const RADII: FujiRadius[] = ["cornered", "soft"];
const ELEVATIONS: FujiElevation[] = ["regular", "floating"];

/**
 * Wraps every story in one `FujiProvider`, controlled from Storybook's own
 * theme/material/radius/elevation toolbar globals (`context.globals`) rather
 * than component-local state. Controlled props update in place - React never
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
  const material = context.globals.material as FujiMaterial;
  const radius = context.globals.radius as FujiRadius;
  const elevation = context.globals.elevation as FujiElevation;
  const backdrop = (context.globals.backdrop as string) || "none";
  const isDocs = context.viewMode === "docs";

  // The decorative canvas only has something to contribute when glass is
  // active AND `Backdrop` picked it - see the comment above `BACKDROPS`.
  const showAtmosphere = material === "glass" && backdrop === "atmosphere";

  return (
    <FujiProvider theme={theme} material={material} radius={radius} elevation={elevation} persist={false}>
      {/*
        `.fuji-glass-atmosphere` is the same shipped utility class real
        consumers apply themselves (see tokens.css and docs/theming.md) -
        reused here, not recreated, per the "no duplicated tokens/styles"
        rule. It is opt-in, not automatic: glass no longer paints its own
        background, so leaving `Backdrop` at its default (`"none"`) shows the
        plain theme background through translucent glass. Picking
        `"atmosphere"` on the same `Backdrop` toolbar turns the class on to
        demo that decorative canvas instead of a concrete scene - one control
        now owns the wrapper's background, so there's nothing left to fight
        over it.
      */}
      <div
        className={`${showAtmosphere ? "fuji-glass-atmosphere " : ""}${isDocs ? "min-h-48 p-6" : "min-h-screen p-4 sm:p-8"}`}
        data-backdrop={
          material === "glass" && backdrop !== "none" && backdrop !== "atmosphere" ? backdrop : undefined
        }
        style={material === "glass" ? backdropStyle(backdrop, theme) : undefined}
      >
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
    material: {
      description: "Fuji material",
      toolbar: {
        title: "Material",
        icon: "mirror",
        items: MATERIALS.map((value) => ({ value, title: value })),
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
    backdrop: {
      description:
        "What sits behind the glass material - the plain theme (default), the opt-in `.fuji-glass-atmosphere` decorative canvas, or a concrete scene for testing translucency against real content",
      toolbar: {
        title: "Backdrop",
        icon: "photo",
        items: Object.keys(BACKDROPS).map((value) => ({
          value,
          title: BACKDROP_TITLES[value] ?? value,
        })),
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
    material: "solid",
    radius: "cornered",
    elevation: "regular",
    backdrop: "none",
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
