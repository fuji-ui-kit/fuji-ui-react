import * as React from "react";
import type { Preview, Decorator } from "@storybook/react";
// `generated/storybook.css`: story-only utilities (e.g. `max-w-3xl`) kept out of the package; it
// only adds layout, never overrides Fuji. `dist/styles.css` is the real stylesheet consumers import
// - never duplicate Fuji styles here. If either is missing, run `npm run build:css`.
import "./generated/storybook.css";
import "../dist/styles.css";
// Storybook-only typography baseline - see fonts.css and preview-head.html for why.
import "./fonts.css";
import { FujiProvider } from "@fujiui/react";
import type { FujiElevation, FujiMaterial, FujiRadius, FujiTheme } from "@fujiui/react";

const THEMES: FujiTheme[] = ["light", "dark"];
const MATERIALS: FujiMaterial[] = ["solid", "glass"];

/**
 * What sits BEHIND the glass (glass only means something over content): the theme background,
 * the shipped `.fuji-glass-atmosphere` canvas, or a concrete scene. Inert under `solid`.
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
  // Built per-theme by `backdropStyle`: its scrim direction depends on the theme.
  photo: {},
};

const PHOTO_URL = "url(https://picsum.photos/id/1018/1600/1000)";

/**
 * The photo, scrimmed 55% toward the theme: unscrimmed, dark-glass text hit 1.69:1 over the sky
 * (6.58:1 over atmosphere); now it clears AA. `mixed` stays the unbounded stress test.
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
 * One `FujiProvider` on toolbar globals (no remounts); `persist={false}` keeps the iframe off the
 * origin-wide storage key. Docs embeds get `min-h-48`, else the iframe's white shows through.
 */
const withFujiProvider: Decorator = (Story, context) => {
  const theme = context.globals.theme as FujiTheme;
  const material = context.globals.material as FujiMaterial;
  const radius = context.globals.radius as FujiRadius;
  const elevation = context.globals.elevation as FujiElevation;
  const backdrop = (context.globals.backdrop as string) || "none";
  const isDocs = context.viewMode === "docs";

  // Only when glass is active AND `Backdrop` picked it.
  const showAtmosphere = material === "glass" && backdrop === "atmosphere";

  return (
    <FujiProvider theme={theme} material={material} radius={radius} elevation={elevation} persist={false}>
      {/* `.fuji-glass-atmosphere` is the shipped opt-in utility (docs/theming.md), reused rather
        than recreated; only the `Backdrop` toolbar sets the wrapper's background. */}
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
    // Fuji's theme owns the canvas color; Storybook's swatch tool would fight it.
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
