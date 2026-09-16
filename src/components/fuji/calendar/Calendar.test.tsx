import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { axe } from "jest-axe";
import { Calendar } from "./Calendar";
import { clampDate, isDayOutOfRange } from "./date-utils";

const cell = (name: string | RegExp) => screen.getByRole("gridcell", { name });

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

  // Regression: `minDate={new Date()}` carries the current time of day, and
  // the old timestamp comparison put today's midnight grid cell "before" it -
  // so the one date a "no past dates" picker must allow was disabled.
  it("compares minDate and maxDate by calendar day, ignoring the time of day", () => {
    const today = new Date(2024, 4, 15);
    render(
      <Calendar
        today={today}
        minDate={new Date(2024, 4, 15, 15, 30)}
        maxDate={new Date(2024, 4, 20, 0, 0)}
      />,
    );

    expect(cell("Wednesday, May 15, 2024")).toBeEnabled();
    expect(cell("Tuesday, May 14, 2024")).toBeDisabled();
    // maxDate at midnight still allows that whole day...
    expect(cell("Monday, May 20, 2024")).toBeEnabled();
    expect(cell("Tuesday, May 21, 2024")).toBeDisabled();
  });

  it("clamps and range-checks by day in the shared date helpers", () => {
    const min = new Date(2024, 4, 15, 23, 59);
    expect(isDayOutOfRange(new Date(2024, 4, 15, 0, 0), min)).toBe(false);
    expect(isDayOutOfRange(new Date(2024, 4, 14, 23, 59), min)).toBe(true);
    const sameDay = new Date(2024, 4, 15, 8, 0);
    expect(clampDate(sameDay, min)).toBe(sameDay);
    expect(clampDate(new Date(2024, 4, 1), min)).toEqual(new Date(2024, 4, 15));
  });

  it("uses the today prop for aria-current and the initial month", () => {
    render(<Calendar today={new Date(2031, 1, 10, 18, 45)} />);
    expect(screen.getByRole("grid")).toHaveAccessibleName("February 2031");
    expect(cell("Monday, February 10, 2031")).toHaveAttribute("aria-current", "date");
    expect(screen.getByRole("grid").querySelectorAll('[aria-current="date"]')).toHaveLength(1);
  });

  it("renders a today prop identically on the server, with no clock dependency", () => {
    const html = renderToString(<Calendar today={new Date(2031, 1, 10)} />);
    expect(html).toContain('aria-label="February 2031"');
    expect(html).toMatch(/aria-current="date"[^>]*>10</);
  });

  it("marks dates from a list, matched by calendar day, in the accessible name", () => {
    render(
      <Calendar
        today={new Date(2024, 4, 1)}
        markedDates={[new Date(2024, 4, 20, 9, 30), new Date(2024, 4, 22)]}
        markedDateLabel="has tasks"
      />,
    );
    expect(cell("Monday, May 20, 2024, has tasks")).toBeInTheDocument();
    expect(cell("Wednesday, May 22, 2024, has tasks")).toBeInTheDocument();
    expect(cell("Tuesday, May 21, 2024")).toBeInTheDocument();
    expect(cell("Monday, May 20, 2024, has tasks").querySelector("[data-marked]")).not.toBeNull();
    expect(cell("Tuesday, May 21, 2024").querySelector("[data-marked]")).toBeNull();
  });

  it("marks dates from a predicate with the default label", () => {
    render(<Calendar today={new Date(2024, 4, 1)} markedDates={(date) => date.getDate() === 13} />);
    expect(cell("Monday, May 13, 2024, marked")).toBeInTheDocument();
    expect(screen.getAllByRole("gridcell", { name: /, marked$/ })).toHaveLength(1);
  });

  it("has no axe violations with marked dates", async () => {
    const { container } = render(
      <Calendar today={new Date(2024, 4, 1)} markedDates={[new Date(2024, 4, 1), new Date(2024, 4, 9)]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
