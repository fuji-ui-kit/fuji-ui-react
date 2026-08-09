import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { RadioGroup } from "./RadioGroup";

function Fixture(props: { defaultValue?: string; onValueChange?: (value: string) => void }) {
  return (
    <RadioGroup
      defaultValue={props.defaultValue}
      onValueChange={(value) => props.onValueChange?.(value as string)}
    >
      <RadioGroup.Item value="light" label="Light" />
      <RadioGroup.Item value="dark" label="Dark" />
      <RadioGroup.Item value="glass" label="Glass" />
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("selects one item and reflects it via aria-checked", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    const light = screen.getByRole("radio", { name: "Light" });
    const dark = screen.getByRole("radio", { name: "Dark" });

    await user.click(light);
    expect(light).toHaveAttribute("aria-checked", "true");
    expect(dark).toHaveAttribute("aria-checked", "false");

    await user.click(dark);
    expect(light).toHaveAttribute("aria-checked", "false");
    expect(dark).toHaveAttribute("aria-checked", "true");
  });

  it("honors an uncontrolled defaultValue", () => {
    render(<Fixture defaultValue="dark" />);
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Light" })).toHaveAttribute("aria-checked", "false");
  });

  it("moves selection with arrow keys", async () => {
    const user = userEvent.setup();
    render(<Fixture defaultValue="light" />);

    screen.getByRole("radio", { name: "Light" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveFocus();
  });

  it("reports selection changes", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Fixture onValueChange={onValueChange} />);

    await user.click(screen.getByRole("radio", { name: "Glass" }));
    expect(onValueChange).toHaveBeenCalledWith("glass");
  });

  it("associates each item's label for click-to-select", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    await user.click(screen.getByText("Glass"));
    expect(screen.getByRole("radio", { name: "Glass" })).toHaveAttribute("aria-checked", "true");
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<Fixture defaultValue="light" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
