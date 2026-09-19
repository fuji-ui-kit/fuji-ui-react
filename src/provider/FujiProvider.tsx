"use client";

import * as React from "react";
import { useControllableState } from "../hooks/useControllableState";
import { readStoredAppearance, writeStoredAppearance } from "../lib/appearance-storage";
import type { FujiElevation, FujiMaterial, FujiRadius, FujiTheme } from "../types";

interface FujiContextValue {
  theme: FujiTheme;
  material: FujiMaterial;
  radius: FujiRadius;
  elevation: FujiElevation;
  setTheme: (theme: FujiTheme) => void;
  setMaterial: (material: FujiMaterial) => void;
  setRadius: (radius: FujiRadius) => void;
  setElevation: (elevation: FujiElevation) => void;
}

const FujiContext = React.createContext<FujiContextValue>({
  theme: "light",
  material: "solid",
  radius: "cornered",
  elevation: "regular",
  setTheme: () => {},
  setMaterial: () => {},
  setRadius: () => {},
  setElevation: () => {},
});

/** Read the active theme/material/radius/elevation. Safe without a FujiProvider ancestor (defaults apply). */
export function useFujiConfig(): FujiContextValue {
  return React.useContext(FujiContext);
}

// Runs before paint on the client (so applying persisted appearance never
// flashes) and falls back to the no-op passive effect during SSR.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export interface FujiProviderProps {
  /** The tree this appearance applies to. */
  children: React.ReactNode;
  /** Controlled theme. Omit + use `defaultTheme` for uncontrolled usage. */
  theme?: FujiTheme;
  /** Starting theme when uncontrolled. With `persist`, storage wins over this. */
  defaultTheme?: FujiTheme;
  /** Called whenever the theme changes, however it changed. */
  onThemeChange?: (theme: FujiTheme) => void;
  /** Controlled material. Omit + use `defaultMaterial` for uncontrolled usage. */
  material?: FujiMaterial;
  /** Starting material when uncontrolled. With `persist`, storage wins over this. */
  defaultMaterial?: FujiMaterial;
  /** Called whenever the material changes, however it changed. */
  onMaterialChange?: (material: FujiMaterial) => void;
  /** Controlled radius. Omit + use `defaultRadius` for uncontrolled usage. */
  radius?: FujiRadius;
  /** Starting radius when uncontrolled. With `persist`, storage wins over this. */
  defaultRadius?: FujiRadius;
  /** Called whenever the radius changes, however it changed. */
  onRadiusChange?: (radius: FujiRadius) => void;
  /** Controlled elevation. Omit + use `defaultElevation` for uncontrolled usage. */
  elevation?: FujiElevation;
  /** Starting elevation when uncontrolled. With `persist`, storage wins over this. */
  defaultElevation?: FujiElevation;
  /** Called whenever the elevation changes, however it changed. */
  onElevationChange?: (elevation: FujiElevation) => void;
  /**
   * Persist the appearance to storage and hydrate initial values from it. Only the root app
   * provider should set this; nested/demo providers stay isolated.
   */
  persist?: boolean;
  /** Extra classes merged onto the wrapper element that carries the `data-fuji-*` attributes. */
  className?: string;
}

/**
 * Root provider for Fuji. Theme, material, radius and elevation are global (components take no
 * props for them); runtime changes only flip `data-fuji-*` attributes, so children never remount.
 */
export function FujiProvider({
  children,
  theme,
  defaultTheme = "light",
  onThemeChange,
  material,
  defaultMaterial = "solid",
  onMaterialChange,
  radius,
  defaultRadius = "cornered",
  onRadiusChange,
  elevation,
  defaultElevation = "regular",
  onElevationChange,
  persist = false,
  className,
}: FujiProviderProps) {
  // Initial state uses only SSR-safe defaults, never `readStoredAppearance()`: storage is readable
  // on the first client render, so reading it here would mismatch the server (docs/ssr.md). The
  // persisted value is applied after mount, in the layout effect below.
  const [activeTheme, setTheme] = useControllableState<FujiTheme>({
    value: theme,
    defaultValue: defaultTheme,
    onChange: onThemeChange,
  });
  const [activeMaterial, setMaterial] = useControllableState<FujiMaterial>({
    value: material,
    defaultValue: defaultMaterial,
    onChange: onMaterialChange,
  });
  const [activeRadius, setRadius] = useControllableState<FujiRadius>({
    value: radius,
    defaultValue: defaultRadius,
    onChange: onRadiusChange,
  });
  const [activeElevation, setElevation] = useControllableState<FujiElevation>({
    value: elevation,
    defaultValue: defaultElevation,
    onChange: onElevationChange,
  });

  // Persist a selection at the same moment it changes. The effect below still
  // reconciles the complete preference, but the synchronous write prevents a
  // fast client navigation from carrying the old theme into the next route.
  const updateTheme = React.useCallback(
    (next: FujiTheme) => {
      setTheme(next);
      if (persist) {
        writeStoredAppearance({
          theme: next,
          material: activeMaterial,
          radius: activeRadius,
          elevation: activeElevation,
        });
      }
    },
    [activeElevation, activeMaterial, activeRadius, persist, setTheme],
  );
  const updateMaterial = React.useCallback(
    (next: FujiMaterial) => {
      setMaterial(next);
      if (persist) {
        writeStoredAppearance({
          theme: activeTheme,
          material: next,
          radius: activeRadius,
          elevation: activeElevation,
        });
      }
    },
    [activeElevation, activeRadius, activeTheme, persist, setMaterial],
  );
  const updateRadius = React.useCallback(
    (next: FujiRadius) => {
      setRadius(next);
      if (persist) {
        writeStoredAppearance({
          theme: activeTheme,
          material: activeMaterial,
          radius: next,
          elevation: activeElevation,
        });
      }
    },
    [activeElevation, activeMaterial, activeTheme, persist, setRadius],
  );
  const updateElevation = React.useCallback(
    (next: FujiElevation) => {
      setElevation(next);
      if (persist) {
        writeStoredAppearance({
          theme: activeTheme,
          material: activeMaterial,
          radius: activeRadius,
          elevation: next,
        });
      }
    },
    [activeMaterial, activeRadius, activeTheme, persist, setElevation],
  );

  // Hydrate from storage before the first paint. Initial render uses the SSR
  // defaults (so hydration never mismatches), then this synchronously applies
  // the persisted appearance the bootstrap script already put on <html>.
  const hydratedFromStorage = React.useRef(false);
  useIsomorphicLayoutEffect(() => {
    if (!persist || hydratedFromStorage.current) return;
    hydratedFromStorage.current = true;
    const s = readStoredAppearance();
    if (s.theme && theme === undefined) setTheme(s.theme);
    if (s.material && material === undefined) setMaterial(s.material);
    if (s.radius && radius === undefined) setRadius(s.radius);
    if (s.elevation && elevation === undefined) setElevation(s.elevation);
  }, [persist, theme, material, radius, elevation, setTheme, setMaterial, setRadius, setElevation]);

  // Mirror onto <html> so color-scheme and native form controls follow too.
  React.useEffect(() => {
    // Only the persistent root provider owns the document-wide appearance.
    // Nested providers are isolated preview scopes and must never overwrite
    // the active application theme while their page is mounted.
    if (!persist) return;
    const root = document.documentElement;
    const prev = {
      theme: root.getAttribute("data-fuji-theme"),
      material: root.getAttribute("data-fuji-material"),
      radius: root.getAttribute("data-fuji-radius"),
      elevation: root.getAttribute("data-fuji-elevation"),
    };
    root.setAttribute("data-fuji-theme", activeTheme);
    root.setAttribute("data-fuji-material", activeMaterial);
    root.setAttribute("data-fuji-radius", activeRadius);
    root.setAttribute("data-fuji-elevation", activeElevation);
    return () => {
      if (prev.theme) root.setAttribute("data-fuji-theme", prev.theme);
      else root.removeAttribute("data-fuji-theme");
      if (prev.material) root.setAttribute("data-fuji-material", prev.material);
      else root.removeAttribute("data-fuji-material");
      if (prev.radius) root.setAttribute("data-fuji-radius", prev.radius);
      else root.removeAttribute("data-fuji-radius");
      if (prev.elevation) root.setAttribute("data-fuji-elevation", prev.elevation);
      else root.removeAttribute("data-fuji-elevation");
    };
  }, [persist, activeTheme, activeMaterial, activeRadius, activeElevation]);

  // Persist the combined appearance preference (root provider only). Waits for
  // the storage hydration pass so it never writes defaults over a saved value.
  const skippedInitialPersist = React.useRef(false);
  React.useEffect(() => {
    if (!persist || !hydratedFromStorage.current) return;
    if (!skippedInitialPersist.current) {
      skippedInitialPersist.current = true;
      return;
    }
    writeStoredAppearance({
      theme: activeTheme,
      material: activeMaterial,
      radius: activeRadius,
      elevation: activeElevation,
    });
  }, [persist, activeTheme, activeMaterial, activeRadius, activeElevation]);

  const value = React.useMemo<FujiContextValue>(
    () => ({
      theme: activeTheme,
      material: activeMaterial,
      radius: activeRadius,
      elevation: activeElevation,
      setTheme: updateTheme,
      setMaterial: updateMaterial,
      setRadius: updateRadius,
      setElevation: updateElevation,
    }),
    [
      activeTheme,
      activeMaterial,
      activeRadius,
      activeElevation,
      updateTheme,
      updateMaterial,
      updateRadius,
      updateElevation,
    ],
  );

  // The persistent root mirrors onto <html>; a default-valued wrapper scope would override the
  // bootstrapped appearance and flatten persisted glass to solid. Nested providers get an isolated
  // scope, with `data-fuji-material` stamped even at `"solid"` because tokens.css's glass `:not()`
  // exclusion needs every element to carry an explicit material attribute.
  const scopeAttributes = persist
    ? {}
    : {
        "data-fuji-theme": activeTheme,
        "data-fuji-material": activeMaterial,
        "data-fuji-radius": activeRadius,
        "data-fuji-elevation": activeElevation,
      };

  return (
    <FujiContext.Provider value={value}>
      <div
        {...scopeAttributes}
        className={className ? `fuji-theme-scope ${className}` : "fuji-theme-scope"}
        suppressHydrationWarning
      >
        {children}
      </div>
    </FujiContext.Provider>
  );
}
