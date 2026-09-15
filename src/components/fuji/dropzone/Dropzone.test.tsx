import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropzone } from "./Dropzone";

function makeFile(name: string) {
  return new File(["content"], name, { type: "text/plain" });
}

function dataTransferWith(files: File[]) {
  return { files, items: files.map((f) => ({ kind: "file", type: f.type })), types: ["Files"] };
}

describe("Dropzone", () => {
  it("accepts a dropped file", () => {
    const onChange = vi.fn();
    render(<Dropzone onChange={onChange} />);
    const zone = screen.getByRole("button", { name: /upload files/i });
    const file = makeFile("a.txt");

    fireEvent.drop(zone, { dataTransfer: dataTransferWith([file]) });

    expect(onChange).toHaveBeenCalledWith([file]);
    expect(screen.getByText("a.txt")).toBeInTheDocument();
  });

  it("opens the file picker on Enter/Space (keyboard accessible)", async () => {
    // user-event also synthesizes its own click for role="button" elements
    // on Enter/Space (a testing convenience real browsers don't apply to
    // plain divs) - so this only asserts the picker opens, not an exact
    // call count, to avoid coupling to that tooling behavior.
    const user = userEvent.setup();
    render(<Dropzone />);
    const zone = screen.getByRole("button", { name: /upload files/i });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    zone.focus();
    await user.keyboard("{Enter}");
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockClear();
    await user.keyboard(" ");
    expect(clickSpy).toHaveBeenCalled();
  });

  it("ignores drops and keyboard activation while disabled", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Dropzone disabled onChange={onChange} />);
    const zone = screen.getByRole("button", { name: /upload files/i });
    expect(zone).toHaveAttribute("aria-disabled", "true");
    expect(zone).toHaveAttribute("tabindex", "-1");

    fireEvent.drop(zone, { dataTransfer: dataTransferWith([makeFile("a.txt")]) });
    expect(onChange).not.toHaveBeenCalled();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    zone.focus();
    await user.keyboard("{Enter}");
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("resets the input value after a selection so the same file can be re-picked", () => {
    const onChange = vi.fn();
    render(<Dropzone onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("a.txt");

    fireEvent.change(input, { target: { files: [file] } });
    expect(input.value).toBe("");

    fireEvent.change(input, { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("removes a file via its remove button", async () => {
    const user = userEvent.setup();
    render(<Dropzone defaultValue={[makeFile("a.txt")]} />);
    await user.click(screen.getByRole("button", { name: "Remove a.txt" }));
    expect(screen.queryByText("a.txt")).not.toBeInTheDocument();
  });
});

/**
 * The drag-over fill was dead code for its entire life and nothing noticed,
 * because nothing tested the state that drives it. The element also carries
 * `.fuji-glass-surface-subtle` (for its backdrop blur), which lives in the
 * `fuji.components` layer - ordered AFTER `fuji.utilities` - so the old
 * `fj:bg-*` utility never won and the fill never painted, in any theme. The
 * state now drives `.fuji-dropzone[data-drag-active]` in base.css instead.
 * jsdom cannot evaluate cascade layers, so this pins the part it CAN see: that
 * the attribute the rule keys on is actually set, and cleared, at the right
 * moments. Verified by removing the `data-drag-active` prop and watching this
 * go red.
 */
describe("Dropzone drag state", () => {
  const zone = () => screen.getByRole("button", { name: /upload files/i });

  it("marks itself drag-active while a file is dragged over it", () => {
    render(<Dropzone />);
    expect(zone()).not.toHaveAttribute("data-drag-active");
    fireEvent.dragEnter(zone(), { dataTransfer: dataTransferWith([makeFile("a.txt")]) });
    fireEvent.dragOver(zone(), { dataTransfer: dataTransferWith([makeFile("a.txt")]) });
    expect(zone()).toHaveAttribute("data-drag-active");
  });

  it("clears drag-active when the drag leaves", () => {
    render(<Dropzone />);
    fireEvent.dragOver(zone(), { dataTransfer: dataTransferWith([makeFile("a.txt")]) });
    fireEvent.dragLeave(zone());
    expect(zone()).not.toHaveAttribute("data-drag-active");
  });

  it("clears drag-active on drop", () => {
    render(<Dropzone />);
    fireEvent.dragOver(zone(), { dataTransfer: dataTransferWith([makeFile("a.txt")]) });
    fireEvent.drop(zone(), { dataTransfer: dataTransferWith([makeFile("a.txt")]) });
    expect(zone()).not.toHaveAttribute("data-drag-active");
  });

  it("never enters drag-active while disabled", () => {
    render(<Dropzone disabled />);
    fireEvent.dragOver(zone(), { dataTransfer: dataTransferWith([makeFile("a.txt")]) });
    expect(zone()).not.toHaveAttribute("data-drag-active");
  });

  it("carries the class the drag-active rule targets", () => {
    // The rule is `.fuji-dropzone[data-drag-active]`; the attribute alone
    // styles nothing if this class is ever renamed away.
    render(<Dropzone />);
    expect(zone()).toHaveClass("fuji-dropzone");
  });
});
