import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";

function Fixture({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog onOpenChange={onOpenChange}>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Delete item</Dialog.Title>
        <Dialog.Description>This can't be undone.</Dialog.Description>
        <button>Confirm</button>
      </Dialog.Content>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("opens on trigger click and closes on Escape, restoring focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);

    expect(await screen.findByRole("dialog", { name: "Delete item" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it("closes via the built-in close button and reports open state changes", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<Fixture onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(onOpenChange.mock.lastCall?.[0]).toBe(true);

    await user.click(screen.getByRole("button", { name: "Close dialog" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onOpenChange.mock.lastCall?.[0]).toBe(false);
  });
});
