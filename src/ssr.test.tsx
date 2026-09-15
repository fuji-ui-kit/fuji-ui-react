// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { FujiProvider } from "./provider";
import { Button } from "./components/fuji/button";
import { Icon } from "./components/fuji/icon";
import { Card } from "./components/fuji/card";
import { Carousel } from "./components/fuji/carousel";
import { Keyboard } from "./components/fuji/keyboard";
import { Kbd } from "./components/fuji/kbd";
import { Check } from "lucide-react";

// This file runs under Node (no window/document - see the environment pragma
// above), the same conditions a framework's server render executes under.
// Every "use client" component here still needs to server-render without
// touching `window` during the initial render pass.
describe("SSR (no DOM globals)", () => {
  it("renders FujiProvider + static components to a string without throwing", () => {
    expect(typeof window).toBe("undefined");

    const html = renderToString(
      <FujiProvider defaultTheme="dark" defaultRadius="soft">
        <Card>
          <Button tone="default">Continue</Button>
          <Icon icon={Check} label="Done" />
        </Card>
      </FujiProvider>,
    );

    expect(html).toContain('data-fuji-theme="dark"');
    expect(html).toContain('data-fuji-radius="soft"');
    expect(html).toContain("Continue");
  });

  it("renders a client-interactive component (Carousel) without accessing window", () => {
    const html = renderToString(
      <Carousel aria-label="Demo" autoplay={false}>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Carousel>,
    );
    expect(html).toContain("Slide 1");
  });

  it("falls back to light/cornered/regular defaults with no provider", () => {
    const html = renderToString(<Button>Plain</Button>);
    expect(html).toContain("Plain");
  });

  it("server-renders a glass provider without touching window, and the material attribute survives renderToString", () => {
    expect(typeof window).toBe("undefined");

    const html = renderToString(
      <FujiProvider defaultTheme="dark" defaultMaterial="glass">
        <Button tone="default">Continue</Button>
      </FujiProvider>,
    );

    expect(html).toContain('data-fuji-theme="dark"');
    expect(html).toContain('data-fuji-material="glass"');
    expect(html).toContain("Continue");
  });

  it("renders a Keyboard with its browser-API props on (captureKeys, sound) without touching window", () => {
    const html = renderToString(<Keyboard layout="numpad" captureKeys sound label="Number pad" />);
    expect(html).toContain('aria-label="Number pad"');
    expect(html).toContain('data-fuji-key="Numpad5"');
  });

  it("renders a floating Keyboard's board when open, and nothing while closed", () => {
    const openHtml = renderToString(<Keyboard floating open layout="numpad" label="Number pad" />);
    expect(openHtml).toContain('aria-label="Number pad"');
    expect(openHtml).toContain('data-fuji-key="Numpad5"');

    // Not open and no defaultOpen: the board's outside-dismiss/Escape effect
    // never runs, and the component itself renders nothing to hydrate onto.
    const closedHtml = renderToString(<Keyboard floating layout="numpad" />);
    expect(closedHtml).toBe("");
  });

  it("renders Kbd, a plain presentational component with no client boundary, to a string", () => {
    const html = renderToString(<Kbd>⌘K</Kbd>);
    expect(html).toContain("⌘K");
    expect(html).toContain("<kbd");

    // renderToString succeeding here proves nothing about the directive itself
    // - "use client" is inert to a plain Node render - so the guarantee that
    // Kbd stays a Server Component (no directive, first line or otherwise) is
    // pinned directly against its source instead.
    const source = fs.readFileSync(path.join(__dirname, "components/fuji/kbd/Kbd.tsx"), "utf8");
    expect(source.startsWith('"use client"')).toBe(false);
  });
});
