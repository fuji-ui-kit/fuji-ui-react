import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

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
