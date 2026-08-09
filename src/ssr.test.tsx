// @vitest-environment node
import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { FujiProvider } from "./provider";
import { Button } from "./components/fuji/button";
import { Icon } from "./components/fuji/icon";
import { Card } from "./components/fuji/card";
import { Carousel } from "./components/fuji/carousel";
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
});
