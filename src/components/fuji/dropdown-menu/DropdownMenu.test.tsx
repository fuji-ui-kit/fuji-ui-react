import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DropdownMenu } from "./DropdownMenu";

describe("DropdownMenu", () => {
  it("forwards side and alignOffset to the positioner alongside align", async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
        <DropdownMenu.Content side="top" align="end" alignOffset={4} data-testid="menu">
          <DropdownMenu.Item>Rename</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );

    const menu = await screen.findByTestId("menu");
    expect(menu).toHaveAttribute("data-side", "top");
    expect(menu).toHaveAttribute("data-align", "end");
    expect(menu).not.toHaveAttribute("side");
  });

  it("still opens below the trigger, start-aligned, by default", async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
        <DropdownMenu.Content data-testid="menu">
          <DropdownMenu.Item>Rename</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    );

    const menu = await screen.findByTestId("menu");
    expect(menu).toHaveAttribute("data-side", "bottom");
    expect(menu).toHaveAttribute("data-align", "start");
  });
});
