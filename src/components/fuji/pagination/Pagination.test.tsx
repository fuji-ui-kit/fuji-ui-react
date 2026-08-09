import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("calls onPageChange with the clicked page number", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables the previous button on the first page and the next button on the last page", () => {
    const { rerender } = render(<Pagination page={1} pageCount={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).not.toBeDisabled();

    rerender(<Pagination page={3} pageCount={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("marks the current page with aria-current", () => {
    render(<Pagination page={2} pageCount={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute("aria-current");
  });

  // Regression: page-number buttons are raw <button> elements with no
  // border/background of their own, so without Tailwind preflight they fall
  // back to native OS button chrome unless native-control-reset is applied.
  // Checked on a non-active page: the active page's own `bg-fuji-default`
  // legitimately wins over the reset's `bg-transparent` via tailwind-merge.
  it("resets native button chrome on page-number buttons", () => {
    render(<Pagination page={1} pageCount={3} onPageChange={vi.fn()} />);
    const pageButton = screen.getByRole("button", { name: "2" });
    expect(pageButton.className).toEqual(expect.stringContaining("border-0"));
    expect(pageButton.className).toEqual(expect.stringContaining("bg-transparent"));
    expect(pageButton.className).toEqual(expect.stringContaining("appearance-none"));
  });
});
