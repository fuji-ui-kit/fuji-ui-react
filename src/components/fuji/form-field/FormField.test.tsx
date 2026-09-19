import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { FormField } from "./index";
import { Input } from "../input";
import { NativeSelect } from "../native-select";
import { Select } from "../select";
import { Combobox } from "../combobox";
import { MultiSelect } from "../multi-select";
import { NumberInput } from "../number-input";
import { Slider } from "../slider";
import { DatePicker } from "../date-picker";
import { TimePicker } from "../time-picker";

const options = [{ value: "a", label: "Alpha" }];

/**
 * Whether the `has-[...]:border-fuji-fire` class shipped on `el` actually matches it in the DOM.
 * Input's slotted wrapper is a plain `<div>` that can only react to its `<input>` via `:has()`.
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

describe("FormField", () => {
  it("wires the label to the control and shows the description", () => {
    render(
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <Input />
        <FormField.Description>We never share it.</FormField.Description>
      </FormField>,
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("We never share it.")).toBeInTheDocument();
  });

  it("shows the error message when the field is forced invalid via the root prop", () => {
    render(
      <FormField invalid>
        <FormField.Label>Email</FormField.Label>
        <Input defaultValue="not-an-email" />
        <FormField.Error>Enter a valid email address.</FormField.Error>
      </FormField>,
    );
    // Base UI's Field.Error only shows for its own validation results; the
    // forced-invalid path must surface the message too (see FormField.tsx).
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  // Regression: an explicit `data-invalid={undefined}` on Input won Base UI's merge and erased
  // the value `Field.Control` computes from `<FormField invalid>`. `aria-invalid` is recomputed
  // later, so the border regressed silently while assistive tech still announced it.
  it("propagates its own invalid state to a plain Input's data-invalid, not just aria-invalid", () => {
    render(
      <FormField invalid>
        <FormField.Label>Email</FormField.Label>
        <Input defaultValue="not-an-email" />
      </FormField>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("data-invalid", "");
  });

  // Input's slotted branch draws its border on a plain `<div>` outside Field context, so only
  // `has-[[data-invalid]]:border-fuji-fire` (reacting to the inner `<input>`) can paint it.
  it("visually flags a slotted Input's wrapper as invalid via an ancestor FormField", () => {
    render(
      <FormField invalid>
        <FormField.Label>Search</FormField.Label>
        <Input startSlot={<span>@</span>} defaultValue="not-an-email" />
      </FormField>,
    );
    const input = screen.getByRole("textbox");
    // The real <input> is Field-aware and already correctly mirrors the
    // ancestor FormField's invalid state onto itself (fixed previously).
    expect(input).toHaveAttribute("data-invalid", "");
    // The visible bordered box is its plain, non-Field-aware <div> wrapper.
    expect(invalidStylingApplies(input.parentElement!)).toBe(true);
  });

  // Same mechanism, a different Field.Control-based leaf: NativeSelect's
  // real `<select>` element carried the identical stomping pattern.
  it("propagates its own invalid state to a plain NativeSelect's data-invalid", () => {
    render(
      <FormField invalid>
        <FormField.Label>Country</FormField.Label>
        <NativeSelect>
          <option value="us">United States</option>
        </NativeSelect>
      </FormField>,
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("data-invalid", "");
  });

  it("hides the error message while the field is valid", () => {
    render(
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <Input />
        <FormField.Error>Enter a valid email address.</FormField.Error>
      </FormField>,
    );
    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
  });

  it("has no axe violations when invalid", async () => {
    const { container } = render(
      <FormField invalid>
        <FormField.Label>Email</FormField.Label>
        <Input defaultValue="not-an-email" />
        <FormField.Error>Enter a valid email address.</FormField.Error>
      </FormField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  // Every field must take its accessible name from `FormField.Label`. DatePicker/TimePicker
  // weren't Field-aware, and Combobox/MultiSelect/NumberInput erased the label id with
  // `aria-labelledby={undefined}`, staying named only through `label[for]`.
  it.each([
    ["Select", <Select key="c" items={options} />, "combobox"],
    ["Combobox", <Combobox key="c" items={options} />, "combobox"],
    ["MultiSelect", <MultiSelect key="c" items={options} />, "combobox"],
    ["NumberInput", <NumberInput key="c" />, "textbox"],
    ["Slider", <Slider key="c" defaultValue={10} />, "slider"],
    ["DatePicker", <DatePicker key="c" />, "button"],
    ["TimePicker", <TimePicker key="c" />, "button"],
  ] as const)("names a %s from FormField.Label", (_name, control, role) => {
    render(
      <FormField>
        <FormField.Label>Field label</FormField.Label>
        {control}
      </FormField>,
    );
    const element = screen.getByRole(role, { name: "Field label" });
    const label = screen.getByText("Field label");
    expect(label).toHaveAttribute("for", element.id);
  });

  it.each([
    ["Combobox", <Combobox key="c" items={options} />, "combobox"],
    ["MultiSelect", <MultiSelect key="c" items={options} />, "combobox"],
    ["NumberInput", <NumberInput key="c" />, "textbox"],
    ["DatePicker", <DatePicker key="c" />, "button"],
    ["TimePicker", <TimePicker key="c" />, "button"],
  ] as const)("keeps aria-labelledby pointing at the label on a %s", (_name, control, role) => {
    render(
      <FormField>
        <FormField.Label>Field label</FormField.Label>
        {control}
      </FormField>,
    );
    expect(screen.getByRole(role, { name: "Field label" })).toHaveAttribute(
      "aria-labelledby",
      screen.getByText("Field label").id,
    );
  });
});
