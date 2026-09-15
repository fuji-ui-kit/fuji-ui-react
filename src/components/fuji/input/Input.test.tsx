import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

/**
 * The slotted branch's visible box is a plain `<div>`, not a Base UI
 * element - it can only ever pick up an ancestor `<FormField invalid>`'s
 * state by reacting to the real `<input>` inside it via `:has()` (see
 * Input.tsx), not by carrying `data-invalid` itself. Pull the
 * `has-[...]:border-fuji-fire` utility actually shipped on `el` (there
 * should be exactly one) and ask the DOM whether the selector it compiles to
 * - `:has(<the bracketed inner selector>)` - matches `el` as currently
 * rendered, instead of merely checking that a class string is present or
 * that `:has([data-invalid])` matches regardless of whether that class ships
 * at all.
 */
function invalidStylingApplies(el: Element): boolean {
  const relevant = el.className.split(/\s+/).filter((c) => /^fj:has-\[.+\]:border-fuji-fire$/.test(c));
  if (relevant.length === 0) return false;
  return relevant.every((c) => {
    const withoutPrefix = c.slice(3); // strip the "fj:" scoping prefix
    const variant = withoutPrefix.slice(0, withoutPrefix.lastIndexOf(":"));
    const match = /^has-\[(.+)\]$/.exec(variant);
    return match != null && el.matches(`:has(${match[1]})`);
  });
}

describe("Input", () => {
  it("works uncontrolled, typing freely without a value prop", async () => {
    render(<Input aria-label="Name" defaultValue="" />);
    const input = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "Ada");
    expect(input).toHaveValue("Ada");
  });

  it("stays pinned to a controlled value and only changes through onChange", async () => {
    function Controlled() {
      const [value, setValue] = React.useState("Ada");
      return (
        <Input
          aria-label="Name"
          value={value}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "x");
    // onChange uppercases, so the controlled value reflects that transform,
    // not whatever raw text userEvent typed.
    expect(input).toHaveValue("ADAX");
  });

  it("exposes invalid state via aria-invalid and data-invalid", () => {
    render(<Input aria-label="Email" invalid />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("data-invalid", "");
  });

  // The slotted branch (startSlot/endSlot/clearable) renders a different
  // element tree - a plain `<div>` wrapper carries the visible border, the
  // `<input>` inside it is unstyled - so its own `invalid` prop needs to
  // reach the wrapper independently of the unslotted branch above. The
  // wrapper never carries `data-invalid` itself (see Input.tsx); it reacts
  // to the real `<input>`, which does.
  it("visually flags the wrapper as invalid when rendering a slotted variant", () => {
    render(<Input aria-label="Amount" invalid startSlot={<span>$</span>} />);
    const input = screen.getByRole("textbox", { name: "Amount" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("data-invalid", "");
    expect(invalidStylingApplies(input.parentElement!)).toBe(true);
  });

  it("forwards a ref to the underlying <input>", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input aria-label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("renders start/end slots around the field", () => {
    render(<Input aria-label="Amount" startSlot={<span>$</span>} endSlot={<span>USD</span>} />);
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("does not call onChange for uncontrolled typing unless the consumer passes one", async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Name" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("shows a clear button only once there is a value, and clears on click", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" clearable defaultValue="" />);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

    await user.type(input, "Ada");
    const clearButton = screen.getByRole("button", { name: "Clear" });
    await user.click(clearButton);

    expect(input).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("fires onChange when clearable's clear button resets a controlled value", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState("Ada");
      return (
        <Input aria-label="Name" clearable value={value} onChange={(event) => setValue(event.target.value)} />
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
  });
});
