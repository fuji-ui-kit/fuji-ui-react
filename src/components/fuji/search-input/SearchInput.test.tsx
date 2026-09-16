import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  it("shows exactly one clear button once there is a value, and clears on click", async () => {
    const user = userEvent.setup();
    render(<SearchInput aria-label="Search" defaultValue="" />);
    const input = screen.getByRole("searchbox", { name: "Search" });
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();

    await user.type(input, "fuji");
    expect(screen.getAllByRole("button", { name: "Clear search" })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  it("honors clearable={false} by never rendering the clear button", async () => {
    const user = userEvent.setup();
    render(<SearchInput aria-label="Search" defaultValue="" clearable={false} />);
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "fuji");
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  it("keeps its control height in an overflowing flex column", () => {
    render(<SearchInput aria-label="Search" size="sm" />);
    // The visible box is Input's slotted wrapper, one level above the field.
    const root = screen.getByRole("searchbox", { name: "Search" }).parentElement!;
    expect(root).toHaveClass("fj:min-h-[var(--fuji-control-h-sm)]");
  });
});
