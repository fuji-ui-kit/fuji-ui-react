import * as React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FujiProvider, useFujiConfig } from "./FujiProvider";
import { FujiPortal } from "../components/fuji/portal";
import { usePortalThemeAttrs } from "../components/fuji/lib/use-portal-theme-attrs";

function ConfigProbe() {
  const { theme, material, radius, elevation, setTheme, setMaterial, setRadius, setElevation } =
    useFujiConfig();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="material">{material}</span>
      <span data-testid="radius">{radius}</span>
      <span data-testid="elevation">{elevation}</span>
      <button onClick={() => setTheme("dark")}>set-dark</button>
      <button onClick={() => setMaterial("glass")}>set-glass</button>
      <button onClick={() => setMaterial("solid")}>set-solid</button>
      <button onClick={() => setRadius("soft")}>set-soft</button>
      <button onClick={() => setElevation("floating")}>set-floating</button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("useFujiConfig", () => {
  it("falls back to light/solid/cornered/regular with no provider ancestor", () => {
    render(<ConfigProbe />);
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("material")).toHaveTextContent("solid");
    expect(screen.getByTestId("radius")).toHaveTextContent("cornered");
    expect(screen.getByTestId("elevation")).toHaveTextContent("regular");
  });
});

describe("FujiProvider", () => {
  it("applies uncontrolled defaults and lets internal setters change them", async () => {
    render(
      <FujiProvider defaultTheme="dark" defaultMaterial="glass" defaultRadius="soft">
        <ConfigProbe />
      </FujiProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("material")).toHaveTextContent("glass");
    await userEvent.click(screen.getByText("set-solid"));
    expect(screen.getByTestId("material")).toHaveTextContent("solid");
  });

  it("stays pinned to a controlled value and reports changes via onThemeChange instead of switching itself", async () => {
    const onThemeChange = vi.fn();
    render(
      <FujiProvider theme="light" onThemeChange={onThemeChange}>
        <ConfigProbe />
      </FujiProvider>,
    );
    await userEvent.click(screen.getByText("set-dark"));
    expect(onThemeChange).toHaveBeenCalledWith("dark");
    // Controlled: internal state must not have flipped on its own.
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("mirrors theme/material/radius/elevation as data attributes on its scope wrapper", () => {
    const { container } = render(
      <FujiProvider
        defaultTheme="dark"
        defaultMaterial="glass"
        defaultRadius="soft"
        defaultElevation="floating"
      >
        <span>content</span>
      </FujiProvider>,
    );
    const scope = container.querySelector(".fuji-theme-scope");
    expect(scope).toHaveAttribute("data-fuji-theme", "dark");
    expect(scope).toHaveAttribute("data-fuji-material", "glass");
    expect(scope).toHaveAttribute("data-fuji-radius", "soft");
    expect(scope).toHaveAttribute("data-fuji-elevation", "floating");
  });

  it.each([
    ["light", "solid"],
    ["dark", "solid"],
    ["light", "glass"],
    ["dark", "glass"],
  ] as const)(
    "stamps theme=%s material=%s on the scope wrapper, with no data-fuji-glass attribute",
    (theme, material) => {
      const { container } = render(
        <FujiProvider defaultTheme={theme} defaultMaterial={material}>
          <span />
        </FujiProvider>,
      );
      const scope = container.querySelector(".fuji-theme-scope");
      expect(scope).toHaveAttribute("data-fuji-theme", theme);
      expect(scope).toHaveAttribute("data-fuji-material", material);
      // `glass` no longer carries its own tint axis - it inherits `theme`
      // directly, so no `data-fuji-glass` attribute is ever emitted.
      expect(scope).not.toHaveAttribute("data-fuji-glass");
    },
  );

  // Landmine: tokens.css's glass `:not()` exclusion - the rule that keeps a
  // nested opaque provider (e.g. the docs site's theme-comparison grid)
  // opaque inside an otherwise-glass page - is keyed on
  // `[data-fuji-material="solid"]`. It only works because a nested "solid"
  // provider stamps that attribute explicitly, even though "solid" is also
  // its own default; if the wrapper omitted default-valued attributes, that
  // CSS exclusion would never match and the nested provider would go
  // transparent along with the rest of the glass page.
  it('stamps data-fuji-material="solid" on a nested solid provider inside a glass provider', () => {
    const { container } = render(
      <FujiProvider defaultMaterial="glass">
        <FujiProvider defaultMaterial="solid">
          <span />
        </FujiProvider>
      </FujiProvider>,
    );
    const scopes = container.querySelectorAll(".fuji-theme-scope");
    expect(scopes[0]).toHaveAttribute("data-fuji-material", "glass");
    expect(scopes[1]).toHaveAttribute("data-fuji-material", "solid");
  });

  it("persists appearance to localStorage only when persist is set, and hydrates from it", async () => {
    const { unmount } = render(
      <FujiProvider persist defaultTheme="light">
        <ConfigProbe />
      </FujiProvider>,
    );
    await userEvent.click(screen.getByText("set-dark"));
    expect(JSON.parse(window.localStorage.getItem("fuji-appearance")!).theme).toBe("dark");
    unmount();

    render(
      <FujiProvider persist defaultTheme="light">
        <ConfigProbe />
      </FujiProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  // Regression: `persist` must only ever apply a stored value from its
  // post-mount effect, never during the initial render - reading storage
  // there would make the client's first render (which does have `window`,
  // unlike a real server) disagree with the server-rendered HTML, which is
  // exactly the "identical first paint" guarantee docs/ssr.md promises.
  // `renderToString` here stands in for the server (its output never depends
  // on the browser globals it doesn't have anyway); `hydrateRoot` stands in
  // for the client picking that HTML back up with storage already populated -
  // the scenario a returning visitor actually hits.
  it("hydrates without a mismatch even when storage already holds a non-default value", () => {
    window.localStorage.setItem(
      "fuji-appearance",
      JSON.stringify({ theme: "dark", radius: "cornered", elevation: "regular" }),
    );

    const tree = (
      <FujiProvider persist defaultTheme="light">
        <ConfigProbe />
      </FujiProvider>
    );

    const serverHtml = renderToString(tree);
    expect(serverHtml).toContain(">light<");

    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot>;
    act(() => {
      root = hydrateRoot(container, tree);
    });

    const hydrationMismatch = consoleError.mock.calls.some((args) =>
      args.some((arg) => typeof arg === "string" && /hydrat/i.test(arg)),
    );
    expect(hydrationMismatch).toBe(false);

    // The post-mount effect still reconciles to the stored value once
    // mounted - persistence itself keeps working, it just no longer races
    // the initial render.
    expect(container).toHaveTextContent("dark");

    act(() => root.unmount());
    consoleError.mockRestore();
    container.remove();
  });

  it("does not persist or read storage when persist is false (nested/preview providers stay isolated)", async () => {
    window.localStorage.setItem(
      "fuji-appearance",
      JSON.stringify({ theme: "glass", radius: "cornered", elevation: "regular" }),
    );
    render(
      <FujiProvider defaultTheme="light">
        <ConfigProbe />
      </FujiProvider>,
    );
    // A non-persistent provider must not hydrate from storage written by the root.
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    await userEvent.click(screen.getByText("set-dark"));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    // ...and must not write its own changes back to the shared storage key either.
    expect(JSON.parse(window.localStorage.getItem("fuji-appearance")!).theme).toBe("glass");
  });
});

/**
 * Landmine: content that lives outside the provider's own DOM subtree - Base
 * UI's own portals (Select, Dialog, Popover, ...) and consumer-authored
 * `FujiPortal` usage - has no themed ancestor to inherit CSS variables from,
 * so each mechanism re-stamps every `data-fuji-*` axis on its own portaled
 * root. Both must include `data-fuji-material`, or a portal opened inside a
 * glass app silently renders solid.
 */
describe("portal theme attributes", () => {
  function PortalAttrsProbe() {
    const attrs = usePortalThemeAttrs();
    return <div data-testid="portal-attrs" {...attrs} />;
  }

  it("usePortalThemeAttrs mirrors the active material onto Base UI's own portaled primitives", () => {
    render(
      <FujiProvider defaultTheme="dark" defaultMaterial="glass">
        <PortalAttrsProbe />
      </FujiProvider>,
    );
    const node = screen.getByTestId("portal-attrs");
    expect(node).toHaveAttribute("data-fuji-theme", "dark");
    expect(node).toHaveAttribute("data-fuji-material", "glass");
    expect(node).toHaveAttribute("data-fuji-radius", "cornered");
    expect(node).toHaveAttribute("data-fuji-elevation", "regular");
    expect(node).not.toHaveAttribute("data-fuji-glass");
  });

  it("FujiPortal stamps the active material onto its own portaled root", () => {
    render(
      <FujiProvider defaultTheme="dark" defaultMaterial="glass">
        <FujiPortal>
          <span data-testid="portaled-child" />
        </FujiPortal>
      </FujiProvider>,
    );
    expect(screen.getByTestId("portaled-child")).toBeInTheDocument();
    const portalRoot = document.querySelector(".fuji-portal-root");
    expect(portalRoot).toHaveAttribute("data-fuji-theme", "dark");
    expect(portalRoot).toHaveAttribute("data-fuji-material", "glass");
    expect(portalRoot).toHaveAttribute("data-fuji-radius", "cornered");
    expect(portalRoot).toHaveAttribute("data-fuji-elevation", "regular");
    expect(portalRoot).not.toHaveAttribute("data-fuji-glass");
  });
});
