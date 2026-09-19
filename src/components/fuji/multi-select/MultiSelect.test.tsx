import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MultiSelect } from "./MultiSelect";
import { FormField } from "../form-field";

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("MultiSelect", () => {
  it("sets aria-invalid on the input when invalid, and omits it otherwise", () => {
    const { rerender } = render(<MultiSelect items={items} aria-label="Letters" invalid />);
    expect(screen.getByLabelText("Letters")).toHaveAttribute("aria-invalid", "true");

    rerender(<MultiSelect items={items} aria-label="Letters" />);
    expect(screen.getByLabelText("Letters")).not.toHaveAttribute("aria-invalid");
  });

  // Regression: the chevron is a raw <button>; without preflight it got native OS button chrome.
  it("resets native button chrome on the toggle button", () => {
    render(<MultiSelect items={items} aria-label="Letters" />);
    const toggle = screen.getByRole("button", { name: "Toggle options" });
    expect(toggle.className).toEqual(expect.stringContaining("border-0"));
    expect(toggle.className).toEqual(expect.stringContaining("bg-transparent"));
    expect(toggle.className).toEqual(expect.stringContaining("appearance-none"));
  });

  // Regression: an explicit `data-invalid={undefined}` on `Base.InputGroup` won the merge and
  // erased the value Base UI computes from `<FormField invalid>` (same bug as Combobox).
  it("propagates data-invalid from an ancestor FormField without its own invalid prop", () => {
    render(
      <FormField invalid>
        <FormField.Label>Letters</FormField.Label>
        <MultiSelect items={items} aria-label="Letters" />
      </FormField>,
    );
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid", "");
  });

  // Regression: the group hard-coded `min-h-[--fuji-control-h-md]` (and a
  // fixed 24px row), so `size="sm"`/`"lg"` rendered as tall as `md`.
  it.each([
    ["sm", "fj:min-h-[var(--fuji-control-h-sm)]"],
    ["md", "fj:min-h-[var(--fuji-control-h-md)]"],
    ["lg", "fj:min-h-[var(--fuji-control-h-lg)]"],
  ] as const)("sizes the field to the shared control height for size=%s", (size, minHeight) => {
    render(<MultiSelect items={items} aria-label="Letters" size={size} />);
    const classes = screen.getByRole("group").className.split(/\s+/);
    expect(classes).toContain(minHeight);
    expect(classes.filter((c) => c.startsWith("fj:min-h-"))).toHaveLength(1);
    // The fixed field height from the shared recipe must not survive the merge.
    expect(classes.filter((c) => c.startsWith("fj:h-["))).toHaveLength(0);
  });

  it("is labelled by an ancestor FormField, via both label[for] and aria-labelledby", () => {
    render(
      <FormField>
        <FormField.Label>Tags</FormField.Label>
        <MultiSelect items={items} defaultValue={[items[0]]} />
      </FormField>,
    );
    const input = screen.getByRole("combobox", { name: "Tags" });
    const label = screen.getByText("Tags");
    expect(label).toHaveAttribute("for", input.id);
    expect(input).toHaveAttribute("aria-labelledby", label.id);
  });
});
