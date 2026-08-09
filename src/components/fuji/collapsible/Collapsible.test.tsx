import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Collapsible } from "./Collapsible";

function Fixture(props: { defaultOpen?: boolean; hideIcon?: boolean }) {
  return (
    <Collapsible.Root defaultOpen={props.defaultOpen}>
      <Collapsible.Trigger hideIcon={props.hideIcon}>Advanced settings</Collapsible.Trigger>
      <Collapsible.Panel>
        <p>Hidden content</p>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

describe("Collapsible", () => {
  it("starts closed by default and opens on trigger click", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    const trigger = screen.getByRole("button", { name: "Advanced settings" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Hidden content")).toBeVisible();
  });

  it("closes again on a second click", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    const trigger = screen.getByRole("button", { name: "Advanced settings" });
    await user.click(trigger);
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("honors defaultOpen", () => {
    render(<Fixture defaultOpen />);
    expect(screen.getByRole("button", { name: "Advanced settings" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("toggles via the keyboard", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Advanced settings" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Advanced settings" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("hides the chevron icon when hideIcon is set", () => {
    const { container } = render(<Fixture hideIcon />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("has no obvious accessibility violations closed", async () => {
    const { container } = render(<Fixture />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no obvious accessibility violations open", async () => {
    const { container } = render(<Fixture defaultOpen />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
