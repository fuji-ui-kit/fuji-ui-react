import * as React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BottomNavigation,
  Calendar,
  LineChart,
  DataTable,
  Dropzone,
  Navbar,
  Sidebar,
  Timeline,
} from "./index";

/**
 * Cross-component accessibility contracts, kept together because a system-wide rule enforced in
 * eight files drifts. Add a new component joining one of these families to its list here.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

describe("navigation landmarks are named", () => {
  it("Navbar defaults to a named navigation landmark", () => {
    render(<Navbar items={[{ label: "Home", href: "/" }]} />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("BottomNavigation defaults to a named navigation landmark", () => {
    render(<BottomNavigation items={[{ label: "Home", icon: <svg />, href: "/" }]} />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("Sidebar is a navigation landmark, not a complementary one", () => {
    render(
      <Sidebar>
        <Sidebar.Item href="/">Home</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.getByRole("navigation", { name: "Sidebar" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("lets a consumer override the default label", () => {
    render(<Navbar aria-label="Product" items={[{ label: "Home", href: "/" }]} />);
    expect(screen.getByRole("navigation", { name: "Product" })).toBeInTheDocument();
  });
});

describe("active state is announced, not just colored", () => {
  it("Navbar marks the active link with aria-current", () => {
    render(
      <Navbar
        items={[
          { label: "Home", href: "/" },
          { label: "Docs", href: "/docs", active: true },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("BottomNavigation marks the active link with aria-current", () => {
    render(
      <BottomNavigation
        items={[
          { label: "Home", icon: <svg />, href: "/" },
          { label: "Profile", icon: <svg />, href: "/me", active: true },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "page");
  });
});

describe("Sidebar link safety", () => {
  it("drops an unsafe href and warns in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Sidebar>
        <Sidebar.Item href="javascript:alert(1)">Bad</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.getByText("Bad")).not.toHaveAttribute("href");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Refused to render the href"));
  });

  it("keeps a normal href", () => {
    render(
      <Sidebar>
        <Sidebar.Item href="/settings">Settings</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
  });
});

describe("DataTable sort state", () => {
  const columns = [
    { key: "name", header: "Name", accessor: (r: { name: string }) => r.name, sortable: true },
    { key: "plain", header: "Plain", accessor: (r: { name: string }) => r.name },
  ];
  const rows = [{ name: "Bravo" }, { name: "Alpha" }];

  it("exposes aria-sort on the sortable header cell and cycles it", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={rows} rowKey={(row) => row.name} />);

    const header = screen.getByRole("columnheader", { name: /^Name/ });
    expect(header).toHaveAttribute("aria-sort", "none");

    await user.click(screen.getByRole("button", { name: /^Name/ }));
    expect(header).toHaveAttribute("aria-sort", "ascending");

    await user.click(screen.getByRole("button", { name: /^Name/ }));
    expect(header).toHaveAttribute("aria-sort", "descending");
  });

  it("leaves non-sortable columns without aria-sort", () => {
    render(<DataTable columns={columns} data={rows} rowKey={(row) => row.name} />);
    expect(screen.getByRole("columnheader", { name: "Plain" })).not.toHaveAttribute("aria-sort");
  });

  it("names the sort direction in the toggle's accessible name", () => {
    render(<DataTable columns={columns} data={rows} rowKey={(row) => row.name} />);
    expect(screen.getByRole("button", { name: "Name , not sorted" })).toBeInTheDocument();
  });

  it("marks the body busy while loading", () => {
    const { container } = render(
      <DataTable columns={columns} data={rows} rowKey={(row) => row.name} loading />,
    );
    expect(container.querySelector("tbody")).toHaveAttribute("aria-busy", "true");
  });
});

describe("Calendar day cells", () => {
  it("names each cell with its full date rather than the day number alone", () => {
    render(<Calendar value={new Date(2026, 2, 14)} locale="en-US" />);
    expect(screen.getByRole("gridcell", { name: "Saturday, March 14, 2026" })).toBeInTheDocument();
  });

  it("marks today with aria-current and a non-color cue", () => {
    const { container } = render(<Calendar value={new Date()} />);
    const today = container.querySelector('[aria-current="date"]');
    expect(today).not.toBeNull();
    // The dot is a real element, so "today" survives a color-blind or
    // high-contrast rendering where the accent hue does not.
    expect(today?.querySelector("span[aria-hidden]")).not.toBeNull();
  });
});

describe("Timeline status", () => {
  it("gives every status variant a text equivalent", () => {
    render(
      <Timeline
        items={[
          { title: "Deploy failed", variant: "danger" },
          { title: "Build queued", variant: "info" },
        ]}
      />,
    );
    expect(screen.getByText("Error:")).toBeInTheDocument();
    expect(screen.getByText("Info:")).toBeInTheDocument();
  });

  it("emits nothing for the default variant", () => {
    render(<Timeline items={[{ title: "Plain entry" }]} />);
    expect(screen.queryByText(/^(Error|Info|Success|Warning):/)).not.toBeInTheDocument();
  });

  it("lets an item override or suppress its status text", () => {
    render(
      <Timeline
        items={[
          { title: "Échec", variant: "danger", statusLabel: "Erreur" },
          { title: "Silent", variant: "danger", statusLabel: "" },
        ]}
      />,
    );
    expect(screen.getByText("Erreur:")).toBeInTheDocument();
    expect(screen.queryByText("Error:")).not.toBeInTheDocument();
  });
});

describe("Chart keyboard surface", () => {
  const series = [{ name: "Revenue", data: [{ label: "Jan", value: 10 }] }];

  it("is a single tab stop, not one per data point", () => {
    const { container } = render(<LineChart title="Revenue" series={series} />);
    expect(container.querySelectorAll("[tabindex]")).toHaveLength(1);
    expect(container.querySelector("svg")).toHaveAttribute("tabindex", "0");
  });

  it("still exposes every value as text", () => {
    render(<LineChart title="Revenue" series={series} />);
    expect(screen.getByRole("rowheader", { name: "Revenue, Jan" })).toBeInTheDocument();
  });
});

describe("Dropzone naming", () => {
  it("names the target by purpose and describes it with the prose", () => {
    render(<Dropzone description="Drag and drop files here" />);
    const zone = screen.getByRole("button", { name: "Upload files" });
    expect(zone).toBeInTheDocument();
    expect(zone).toHaveAccessibleDescription("Drag and drop files here");
  });

  it("takes a custom label so two Dropzones are distinguishable", () => {
    render(
      <>
        <Dropzone label="Upload avatar" />
        <Dropzone label="Upload attachments" />
      </>,
    );
    expect(screen.getByRole("button", { name: "Upload avatar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload attachments" })).toBeInTheDocument();
  });
});
