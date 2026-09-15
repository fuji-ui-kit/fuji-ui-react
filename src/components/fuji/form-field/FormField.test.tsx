import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { FormField } from "./index";
import { Input } from "../input";
import { NativeSelect } from "../native-select";

/**
 * Input's slotted-branch wrapper (startSlot/endSlot/clearable) is a plain
 * `<div>`, not a Base UI element, so it can never carry `data-invalid`
 * itself - it can only react to the real `<input>` inside it via `:has()`
 * (see Input.tsx). Pull the `has-[...]:border-fuji-fire` utility actually
 * shipped on `el` (there should be exactly one) and ask the DOM whether the
 * selector it compiles to - `:has(<the bracketed inner selector>)` -
 * matches `el` as currently rendered, instead of merely checking that a
 * class string is present, or that `:has([data-invalid])` matches
 * regardless of whether that class ships at all.
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

  // Regression (Defect 2): `Input` used to write
  // `data-invalid={invalid ? "" : undefined}` on the same element that
  // carries `data-[invalid]:border-fuji-fire`. Passing an explicit
  // `undefined` still occupies the prop key, so it won the merge in Base
  // UI's `useRenderElement` over the `data-invalid` that `Field.Control`
  // already computes automatically from this ancestor `<FormField invalid>`
  // - erasing it whenever the plain `<Input/>` below (matching the real
  // `forms-formfield--invalid` story) had no `invalid` prop of its own.
  // `aria-invalid` was unaffected because Base UI recomputes it later in a
  // separate merge step, which is why the border regressed silently while
  // assistive tech still announced the field correctly. Fails before the
  // fix (no `data-invalid`, so the red border never painted); passes after.
  it("propagates its own invalid state to a plain Input's data-invalid, not just aria-invalid", () => {
    render(
      <FormField invalid>
        <FormField.Label>Email</FormField.Label>
        <Input defaultValue="not-an-email" />
      </FormField>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("data-invalid", "");
  });

  // Gap 1: Input's *slotted* branch (startSlot/endSlot/clearable) renders a
  // plain `<div>` as the visible bordered box, with the real `<input>`
  // nested unstyled inside it. Unlike the unslotted branch above, that div
  // is not a Base UI element - it never participates in Field context, so
  // nothing mirrors this ancestor's invalid state onto it, and the
  // `data-[invalid]:border-fuji-fire` border on `fieldSurface()` never
  // painted for a search-style input with a leading icon even though a bare
  // `<Input/>` in the same `<FormField invalid>` showed it correctly. Fails
  // before the fix (the wrapper has no rule that can react to anything
  // outside itself); passes after Input.tsx adds
  // `has-[[data-invalid]]:border-fuji-fire`, reacting to the real `<input>`
  // inside, which already mirrors this ancestor's state correctly.
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
});
