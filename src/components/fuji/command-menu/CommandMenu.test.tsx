import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { CommandMenu, type CommandMenuItem } from "./CommandMenu";

const items: CommandMenuItem[] = [
  { id: "profile", label: "Go to profile", onSelect: vi.fn() },
  { id: "calendar", label: "Open calendar", onSelect: vi.fn() },
  { id: "settings", label: "Open settings", onSelect: vi.fn() },
];

function renderOpen(customItems: CommandMenuItem[] = items) {
  return render(<CommandMenu defaultOpen items={customItems} />);
}

describe("CommandMenu", () => {
  it("highlights exactly one option at a time, starting with the first", () => {
    renderOpen();
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
  });

  it("moves the highlight with ArrowDown/ArrowUp without wrapping past either end", async () => {
    const user = userEvent.setup();
    renderOpen();
    const combobox = screen.getByRole("combobox");

    await user.type(combobox, "{ArrowDown}");
    expect(screen.getAllByRole("option").map((o) => o.getAttribute("aria-selected"))).toEqual([
      "false",
      "true",
      "false",
    ]);

    await user.type(combobox, "{ArrowDown}{ArrowDown}");
    expect(screen.getAllByRole("option").map((o) => o.getAttribute("aria-selected"))).toEqual([
      "false",
      "false",
      "true",
    ]);

    await user.type(combobox, "{ArrowUp}");
    expect(screen.getAllByRole("option").map((o) => o.getAttribute("aria-selected"))).toEqual([
      "false",
      "true",
      "false",
    ]);
  });

  it("keeps aria-activedescendant in sync with the highlighted option's id", async () => {
    const user = userEvent.setup();
    renderOpen();
    const combobox = screen.getByRole("combobox");
    const [first, second] = screen.getAllByRole("option");

    expect(combobox).toHaveAttribute("aria-activedescendant", first.id);
    await user.type(combobox, "{ArrowDown}");
    expect(combobox).toHaveAttribute("aria-activedescendant", second.id);
  });

  it("selects the highlighted item and closes on Enter", async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CommandMenu
        defaultOpen
        onOpenChange={onOpenChange}
        items={[{ id: "a", label: "Only item", onSelect }]}
      />,
    );

    await user.type(screen.getByRole("combobox"), "{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets the highlight to the first result when the query narrows the list", async () => {
    const user = userEvent.setup();
    renderOpen();
    const combobox = screen.getByRole("combobox");

    await user.type(combobox, "{ArrowDown}{ArrowDown}");
    expect(screen.getAllByRole("option").map((o) => o.getAttribute("aria-selected"))).toEqual([
      "false",
      "false",
      "true",
    ]);

    await user.type(combobox, "calendar");
    const filtered = screen.getAllByRole("option");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toHaveAttribute("aria-selected", "true");
  });

  it("has no obvious accessibility violations while open", async () => {
    renderOpen();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
