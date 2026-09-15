// Public package entry for @fujiui/react.

export { FujiProvider, useFujiConfig } from "./provider";
export {
  APPEARANCE_STORAGE_KEY,
  buildAppearanceBootstrapScript,
  type StoredAppearance,
} from "./lib/appearance-storage";
export type { FujiProviderProps } from "./provider";

export type {
  FujiTheme,
  FujiMaterial,
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
