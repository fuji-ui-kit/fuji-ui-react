import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "./FileUpload";

function makeFile(name: string) {
  return new File(["content"], name, { type: "text/plain" });
}

describe("FileUpload", () => {
  it("adds a chosen file to the list and resets the input value (so the same file can be re-picked)", async () => {
    const onChange = vi.fn();
    render(<FileUpload onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("a.txt");

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("a.txt")).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith([file]);
    expect(input.value).toBe("");
  });

  it("removes a file via its remove button", async () => {
    const user = userEvent.setup();
    render(<FileUpload defaultValue={[makeFile("a.txt")]} />);
    expect(screen.getByText("a.txt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove a.txt" }));
    expect(screen.queryByText("a.txt")).not.toBeInTheDocument();
  });

  it("re-selecting the exact same file after removal fires onChange again", async () => {
    const onChange = vi.fn();
    render(<FileUpload onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("a.txt");

    fireEvent.change(input, { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledTimes(1);

    // Remove it, then pick the identical file again: the reset input value makes this a real change.
    fireEvent.change(input, { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("supports a controlled value", () => {
    const file = makeFile("controlled.txt");
    render(<FileUpload value={[file]} onChange={() => {}} />);
    expect(screen.getByText("controlled.txt")).toBeInTheDocument();
  });
});
