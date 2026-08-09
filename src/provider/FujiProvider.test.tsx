import * as React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FujiProvider, useFujiConfig } from "./FujiProvider";

function ConfigProbe() {
  const { theme, radius, elevation, setTheme, setRadius, setElevation } = useFujiConfig();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="radius">{radius}</span>
      <span data-testid="elevation">{elevation}</span>
      <button onClick={() => setTheme("dark")}>set-dark</button>
      <button onClick={() => setRadius("soft")}>set-soft</button>
      <button onClick={() => setElevation("floating")}>set-floating</button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("useFujiConfig", () => {
  it("falls back to light/cornered/regular with no provider ancestor", () => {
    render(<ConfigProbe />);
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("radius")).toHaveTextContent("cornered");
    expect(screen.getByTestId("elevation")).toHaveTextContent("regular");
  });
});

describe("FujiProvider", () => {
  it("applies uncontrolled defaults and lets internal setters change them", async () => {
    render(
      <FujiProvider defaultTheme="glass" defaultRadius="soft">
        <ConfigProbe />
      </FujiProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("glass");
    await userEvent.click(screen.getByText("set-dark"));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
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

  it("mirrors theme/radius/elevation as data attributes on its scope wrapper", () => {
    const { container } = render(
      <FujiProvider defaultTheme="dark" defaultRadius="soft" defaultElevation="floating">
        <span>content</span>
      </FujiProvider>,
    );
    const scope = container.querySelector(".fuji-theme-scope");
    expect(scope).toHaveAttribute("data-fuji-theme", "dark");
    expect(scope).toHaveAttribute("data-fuji-radius", "soft");
    expect(scope).toHaveAttribute("data-fuji-elevation", "floating");
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
