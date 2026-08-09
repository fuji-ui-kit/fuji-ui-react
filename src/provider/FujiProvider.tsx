"use client";

import * as React from "react";
import { useControllableState } from "../hooks/useControllableState";
import { readStoredAppearance, writeStoredAppearance } from "../lib/appearance-storage";
import type { FujiElevation, FujiRadius, FujiTheme } from "../types";

interface FujiContextValue {
  theme: FujiTheme;
  radius: FujiRadius;
  elevation: FujiElevation;
  setTheme: (theme: FujiTheme) => void;
  setRadius: (radius: FujiRadius) => void;
  setElevation: (elevation: FujiElevation) => void;
}

const FujiContext = React.createContext<FujiContextValue>({
  theme: "light",
  radius: "cornered",
  elevation: "regular",
  setTheme: () => {},
  setRadius: () => {},
  setElevation: () => {},
});

/** Read the active theme/radius/elevation. Safe without a FujiProvider ancestor (defaults apply). */
export function useFujiConfig(): FujiContextValue {
  return React.useContext(FujiContext);
}

// Runs before paint on the client (so applying persisted appearance never
// flashes) and falls back to the no-op passive effect during SSR.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export interface FujiProviderProps {
  children: React.ReactNode;
  /** Controlled theme. Omit + use `defaultTheme` for uncontrolled usage. */
  theme?: FujiTheme;
  defaultTheme?: FujiTheme;
  onThemeChange?: (theme: FujiTheme) => void;
  /** Controlled radius. Omit + use `defaultRadius` for uncontrolled usage. */
  radius?: FujiRadius;
  defaultRadius?: FujiRadius;
  onRadiusChange?: (radius: FujiRadius) => void;
  /** Controlled elevation. Omit + use `defaultElevation` for uncontrolled usage. */
  elevation?: FujiElevation;
  defaultElevation?: FujiElevation;
  onElevationChange?: (elevation: FujiElevation) => void;
  /**
   * When true this provider persists theme/radius/elevation to storage and
   * hydrates its initial values from it. Only the root app provider should set
   * this; nested/demo providers stay isolated.
   */
  persist?: boolean;
  className?: string;
}

/**
 * Root provider for the Fuji design system. Theme, radius, and elevation are
 * global - components never accept their own props for them. Runtime changes
 * only flip the `data-fuji-theme` / `data-fuji-radius` / `data-fuji-elevation`
 * attributes; children never remount.
 */
export function FujiProvider({
  children,
  theme,
  defaultTheme = "light",
  onThemeChange,
  radius,
  defaultRadius = "cornered",
  onRadiusChange,
  elevation,
  defaultElevation = "regular",
  onElevationChange,
  persist = false,
  className,
}: FujiProviderProps) {
  // Initial state uses only the SSR-safe defaults - never `readStoredAppearance()`
  // here. `localStorage` is available on the client's very first render (before
  // hydration reconciles), so reading it in this initial state computation would
  // make that first client render disagree with the server's, which is exactly
  // the mismatch `docs/ssr.md` promises can't happen. The persisted value is
  // applied afterward, inside the layout effect below, which is the "after
  // mount" hydration step both the docs and `persist`'s own doc comment describe.
  const [activeTheme, setTheme] = useControllableState<FujiTheme>({
    value: theme,
    defaultValue: defaultTheme,
    onChange: onThemeChange,
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
        writeStoredAppearance({ theme: next, radius: activeRadius, elevation: activeElevation });
      }
    },
    [activeElevation, activeRadius, persist, setTheme],
  );
  const updateRadius = React.useCallback(
    (next: FujiRadius) => {
      setRadius(next);
      if (persist) {
        writeStoredAppearance({ theme: activeTheme, radius: next, elevation: activeElevation });
      }
    },
    [activeElevation, activeTheme, persist, setRadius],
  );
  const updateElevation = React.useCallback(
    (next: FujiElevation) => {
      setElevation(next);
      if (persist) {
        writeStoredAppearance({ theme: activeTheme, radius: activeRadius, elevation: next });
      }
    },
    [activeRadius, activeTheme, persist, setElevation],
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
    if (s.radius && radius === undefined) setRadius(s.radius);
    if (s.elevation && elevation === undefined) setElevation(s.elevation);
  }, [persist, theme, radius, elevation, setTheme, setRadius, setElevation]);

  // Mirror onto <html> so color-scheme and native form controls follow too.
  React.useEffect(() => {
    // Only the persistent root provider owns the document-wide appearance.
    // Nested providers are isolated preview scopes and must never overwrite
    // the active application theme while their page is mounted.
    if (!persist) return;
    const root = document.documentElement;
    const prev = {
      theme: root.getAttribute("data-fuji-theme"),
      radius: root.getAttribute("data-fuji-radius"),
      elevation: root.getAttribute("data-fuji-elevation"),
    };
    root.setAttribute("data-fuji-theme", activeTheme);
    root.setAttribute("data-fuji-radius", activeRadius);
    root.setAttribute("data-fuji-elevation", activeElevation);
    return () => {
      if (prev.theme) root.setAttribute("data-fuji-theme", prev.theme);
      else root.removeAttribute("data-fuji-theme");
      if (prev.radius) root.setAttribute("data-fuji-radius", prev.radius);
      else root.removeAttribute("data-fuji-radius");
      if (prev.elevation) root.setAttribute("data-fuji-elevation", prev.elevation);
      else root.removeAttribute("data-fuji-elevation");
    };
  }, [persist, activeTheme, activeRadius, activeElevation]);

  // Persist the combined appearance preference (root provider only). Waits for
  // the storage hydration pass so it never writes defaults over a saved value.
  const skippedInitialPersist = React.useRef(false);
  React.useEffect(() => {
    if (!persist || !hydratedFromStorage.current) return;
    if (!skippedInitialPersist.current) {
      skippedInitialPersist.current = true;
      return;
    }
    writeStoredAppearance({ theme: activeTheme, radius: activeRadius, elevation: activeElevation });
  }, [persist, activeTheme, activeRadius, activeElevation]);

  const value = React.useMemo<FujiContextValue>(
    () => ({
      theme: activeTheme,
      radius: activeRadius,
      elevation: activeElevation,
      setTheme: updateTheme,
      setRadius: updateRadius,
      setElevation: updateElevation,
    }),
    [activeTheme, activeRadius, activeElevation, updateTheme, updateRadius, updateElevation],
  );

  // The persistent root provider mirrors its state onto <html>. Keeping a
  // second default-valued attribute scope on the wrapper would override the
  // bootstrapped appearance before hydration and flatten Glass back to Light.
  // Nested, non-persistent providers still get an isolated attribute scope
  // for documentation previews and component examples.
  const scopeAttributes = persist
    ? {}
    : {
        "data-fuji-theme": activeTheme,
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
