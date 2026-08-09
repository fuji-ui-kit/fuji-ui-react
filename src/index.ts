// Public package entry for @fuji-ui/react.

export { FujiProvider, useFujiConfig } from "./provider";
export type { FujiProviderProps } from "./provider";

export type {
  FujiTheme,
  FujiRadius,
  FujiElevation,
  ComponentSize,
  ComponentTone,
  StatusTone,
  ComponentAppearance,
  OverlayMobileBehavior,
  SlotClassNames,
} from "./types";

export * from "./components/fuji";
