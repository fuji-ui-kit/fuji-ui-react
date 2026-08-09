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
    const zone = screen.getByRole("button", { name: /drag and drop/i });
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
    const zone = screen.getByRole("button", { name: /drag and drop/i });
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
    const zone = screen.getByRole("button", { name: /drag and drop/i });
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
