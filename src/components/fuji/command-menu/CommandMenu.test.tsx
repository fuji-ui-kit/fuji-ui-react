import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("walks the options in the order they are drawn when groups are interleaved", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CommandMenu
        defaultOpen
        items={[
          { id: "a", label: "Alpha", group: "Pages", onSelect: () => onSelect("a") },
          { id: "b", label: "Bravo", group: "Actions", onSelect: () => onSelect("b") },
          { id: "c", label: "Charlie", group: "Pages", onSelect: () => onSelect("c") },
          { id: "d", label: "Delta", onSelect: () => onSelect("d") },
        ]}
      />,
    );
    const combobox = screen.getByRole("combobox");
    // Ungrouped first, then groups in order of first appearance.
    const drawn = screen.getAllByRole("option").map((o) => o.textContent);
    expect(drawn).toEqual(["Delta", "Alpha", "Charlie", "Bravo"]);

    const highlighted = () =>
      screen.getAllByRole("option").find((o) => o.getAttribute("aria-selected") === "true")?.textContent;
    const seen = [highlighted()];
    for (let step = 0; step < 3; step += 1) {
      await user.type(combobox, "{ArrowDown}");
      seen.push(highlighted());
      expect(combobox).toHaveAttribute(
        "aria-activedescendant",
        screen.getByRole("option", { name: seen[seen.length - 1] }).id,
      );
    }
    expect(seen).toEqual(drawn);

    await user.type(combobox, "{Enter}");
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("stays open for an item with closeOnSelect={false}, clearing the query for the next step", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function TwoStep() {
      const [step, setStep] = React.useState<"root" | "theme">("root");
      const rootItems: CommandMenuItem[] = [
        { id: "theme", label: "Change theme…", closeOnSelect: false, onSelect: () => setStep("theme") },
        { id: "other", label: "Other", onSelect: vi.fn() },
      ];
      const themeItems: CommandMenuItem[] = [
        { id: "light", label: "Light", onSelect: vi.fn() },
        { id: "dark", label: "Dark", onSelect: vi.fn() },
      ];
      return (
        <CommandMenu
          defaultOpen
          onOpenChange={onOpenChange}
          items={step === "root" ? rootItems : themeItems}
        />
      );
    }

    render(<TwoStep />);
    const combobox = screen.getByRole("combobox");
    await user.type(combobox, "theme");
    await user.click(screen.getByRole("option", { name: "Change theme…" }));

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Light", "Dark"]);
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");

    // An ordinary item in the second step still closes.
    await user.type(screen.getByRole("combobox"), "{Enter}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("binds no shortcut unless hotkey is given", () => {
    const onOpenChange = vi.fn();
    render(<CommandMenu onOpenChange={onOpenChange} items={items} />);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("toggles on ⌘K and Ctrl+K when hotkey is set, and unbinds on unmount", async () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(<CommandMenu hotkey="k" onOpenChange={onOpenChange} items={items} />);

    const meta = fireEvent.keyDown(document, { key: "k", metaKey: true });
    // fireEvent returns false when the event was cancelled.
    expect(meta).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(await screen.findByRole("combobox")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "K", ctrlKey: true });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("combobox")).not.toBeInTheDocument());

    // Neither a bare K nor a chord something else already claimed.
    fireEvent.keyDown(document, { key: "k" });
    const claimed = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      cancelable: true,
      bubbles: true,
    });
    claimed.preventDefault();
    document.dispatchEvent(claimed);
    expect(onOpenChange).toHaveBeenCalledTimes(2);

    unmount();
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("drives a controlled palette through onOpenChange from the hotkey", () => {
    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <span data-testid="state">{String(open)}</span>
          <CommandMenu hotkey="k" open={open} onOpenChange={setOpen} items={items} />
        </>
      );
    }
    render(<Controlled />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByTestId("state")).toHaveTextContent("true");
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByTestId("state")).toHaveTextContent("false");
  });

  it("has no obvious accessibility violations while open", async () => {
    renderOpen();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
