import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "./Calendar";

describe("Calendar", () => {
  it("moves the active date cell with arrow keys and wraps rows", async () => {
    const user = userEvent.setup();
    render(<Calendar defaultValue={new Date(2024, 4, 15)} />);

    const grid = screen.getByRole("grid");
    const initiallyActive = grid.querySelector('[tabindex="0"]') as HTMLElement;
    expect(initiallyActive).toHaveTextContent("15");

    initiallyActive.focus();
    await user.keyboard("{ArrowRight}");

    const afterRight = grid.querySelector('[tabindex="0"]') as HTMLElement;
    expect(afterRight).toHaveTextContent("16");
    expect(afterRight).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    const afterDown = grid.querySelector('[tabindex="0"]') as HTMLElement;
    expect(afterDown).toHaveTextContent("23");
  });

  it("selects a date on click and calls onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Calendar defaultValue={new Date(2024, 4, 15)} onChange={onChange} />);

    await user.click(screen.getByText("20"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const selectedDate: Date = onChange.mock.calls[0][0];
    expect(selectedDate.getDate()).toBe(20);
  });

  it("navigates months with PageUp/PageDown", async () => {
    const user = userEvent.setup();
    render(<Calendar defaultValue={new Date(2024, 4, 15)} />);
    expect(screen.getByLabelText(/May 2024/)).toBeInTheDocument();

    const grid = screen.getByRole("grid");
    (grid.querySelector('[tabindex="0"]') as HTMLElement).focus();
    await user.keyboard("{PageDown}");

    expect(screen.getByLabelText(/June 2024/)).toBeInTheDocument();
  });
});
