import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type DataTableColumn } from "./DataTable";

interface Row {
  id: string;
  name: string;
}

const rows: Row[] = [
  { id: "1", name: "Bravo" },
  { id: "2", name: "Alpha" },
];

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name, sortable: true },
];

describe("DataTable", () => {
  it("forwards its ref and spreads native props onto the root, with data present", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <DataTable
        ref={ref}
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        aria-label="People"
        data-testid="data-table-root"
      />,
    );
    const root = screen.getByTestId("data-table-root");
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute("aria-label", "People");
  });

  // The empty state is a separate return path; refs and native props must reach it too.
  it("still forwards its ref and native props when rendering the empty state", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <DataTable
        ref={ref}
        columns={columns}
        data={[]}
        rowKey={(row) => row.id}
        emptyMessage="Nothing here"
        data-testid="data-table-root"
      />,
    );
    const root = screen.getByTestId("data-table-root");
    expect(ref.current).toBe(root);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("sorts by a sortable column on click", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={rows} rowKey={(row) => row.id} />);
    const cellsBefore = screen.getAllByRole("cell").map((cell) => cell.textContent);
    expect(cellsBefore).toEqual(["Bravo", "Alpha"]);

    await user.click(screen.getByRole("button", { name: /^Name/ }));
    const cellsAfter = screen.getAllByRole("cell").map((cell) => cell.textContent);
    expect(cellsAfter).toEqual(["Alpha", "Bravo"]);
  });

  // Regression: the sort toggle is a raw <button>; without preflight it needs native-control-reset.
  it("resets native button chrome on the sort toggle", () => {
    render(<DataTable columns={columns} data={rows} rowKey={(row) => row.id} />);
    const sortButton = screen.getByRole("button", { name: /^Name/ });
    expect(sortButton.className).toEqual(expect.stringContaining("border-0"));
    expect(sortButton.className).toEqual(expect.stringContaining("bg-transparent"));
    expect(sortButton.className).toEqual(expect.stringContaining("appearance-none"));
  });

  it("shows skeleton rows instead of data while loading", () => {
    render(<DataTable columns={columns} data={rows} rowKey={(row) => row.id} loading />);
    expect(screen.queryByText("Bravo")).not.toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("calls rowKey and render/accessor per row without throwing", () => {
    const rowKey = vi.fn((row: Row) => row.id);
    render(<DataTable columns={columns} data={rows} rowKey={rowKey} />);
    expect(rowKey).toHaveBeenCalledTimes(rows.length);
  });
});
