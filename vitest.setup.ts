import "@testing-library/jest-dom/vitest";
import { toHaveNoViolations } from "jest-axe";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

expect.extend(toHaveNoViolations);

afterEach(() => {
  cleanup();
});

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  // jsdom doesn't implement the Pointer Events API at all - Base UI's
  // Switch/Radio (and other) root components branch on `instanceof
  // PointerEvent` in their own click handlers, which throws
  // "is not a constructor" the moment `window.PointerEvent` is undefined.
  // A minimal MouseEvent-based polyfill (the same shape jsdom itself uses
  // for other synthetic pointer-ish events) is enough for these components
  // to read the handful of Pointer Event fields they actually check.
  if (!("PointerEvent" in window)) {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number;
      pointerType: string;
      isPrimary: boolean;
      width: number;
      height: number;
      pressure: number;
      tangentialPressure: number;
      tiltX: number;
      tiltY: number;
      twist: number;

      constructor(type: string, params: PointerEventInit = {}) {
        super(type, params);
        this.pointerId = params.pointerId ?? 0;
        this.pointerType = params.pointerType ?? "mouse";
        this.isPrimary = params.isPrimary ?? false;
        this.width = params.width ?? 1;
        this.height = params.height ?? 1;
        this.pressure = params.pressure ?? 0;
        this.tangentialPressure = params.tangentialPressure ?? 0;
        this.tiltX = params.tiltX ?? 0;
        this.tiltY = params.tiltY ?? 0;
        this.twist = params.twist ?? 0;
      }
    }
    // @ts-expect-error - test environment polyfill
    window.PointerEvent = PointerEventPolyfill;
  }

  if (!("IntersectionObserver" in window)) {
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = "";
      readonly thresholds: ReadonlyArray<number> = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    // @ts-expect-error - test environment polyfill
    window.IntersectionObserver = MockIntersectionObserver;
  }
}
