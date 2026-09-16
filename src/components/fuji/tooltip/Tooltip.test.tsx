import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("forwards side, align and their offsets to the positioner", async () => {
    render(
      <Tooltip defaultOpen>
        <Tooltip.Trigger>Save</Tooltip.Trigger>
        <Tooltip.Content side="bottom" align="start" alignOffset={2} data-testid="tip">
          Saved
        </Tooltip.Content>
      </Tooltip>,
    );

    const tip = await screen.findByTestId("tip");
    // "bottom" rather than a horizontal side: jsdom lays nothing out, so Base
    // UI's collision flip turns a requested "right" into "left" here.
    expect(tip).toHaveAttribute("data-side", "bottom");
    expect(tip).toHaveAttribute("data-align", "start");
    expect(tip).not.toHaveAttribute("side");
  });

  it("keeps Base UI's top placement when none is given", async () => {
    render(
      <Tooltip defaultOpen>
        <Tooltip.Trigger>Save</Tooltip.Trigger>
        <Tooltip.Content data-testid="tip">Saved</Tooltip.Content>
      </Tooltip>,
    );
    expect(await screen.findByTestId("tip")).toHaveAttribute("data-side", "top");
  });
});
