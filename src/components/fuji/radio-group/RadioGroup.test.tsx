import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { RadioGroup } from "./RadioGroup";

/**
 * Compiles each disabled-dimming class on `el` to its real selector and asks the DOM if it
 * matches, so a variant that can never fire (e.g. `disabled:` on a `<span role="radio">`) fails.
 */
function disabledStylingApplies(el: Element): boolean {
  const relevant = el.className
    .split(/\s+/)
    .filter((c) => /^fj:.+:(opacity-\d+|cursor-not-allowed|pointer-events-none)$/.test(c));
  if (relevant.length === 0) return false;
  return relevant.every((c) => {
    const withoutPrefix = c.slice(3); // strip the "fj:" scoping prefix
    const variant = withoutPrefix.slice(0, withoutPrefix.lastIndexOf(":"));
    const bracketed = /^data-\[(.+)\]$/.exec(variant);
    const selector = bracketed ? `[data-${bracketed[1]}]` : `:${variant}`;
    return el.matches(selector);
  });
}

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

  // Regression: same root cause as Checkbox/Switch - `Radio.Root` defaults to
  // `nativeButton={false}` and renders a `<span role="radio">`, so the
  // `disabled:` pseudo-class variant this control used to ship can never
  // match. Fails before the `data-[disabled]:` fix; passes after.
  it("actually applies the disabled-dimming styling to a disabled item (not just the data attribute)", () => {
    render(
      <RadioGroup defaultValue="light">
        <RadioGroup.Item value="light" label="Light" />
        <RadioGroup.Item value="dark" label="Dark" disabled />
      </RadioGroup>,
    );
    const dark = screen.getByRole("radio", { name: "Dark" });
    expect(dark).toHaveAttribute("data-disabled", "");
    expect(disabledStylingApplies(dark)).toBe(true);
  });
});
