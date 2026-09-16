import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Tree, type TreeNode } from "./Tree";

const data: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "index", label: "index.ts" },
      { id: "utils", label: "utils.ts" },
    ],
  },
  { id: "readme", label: "README.md" },
];

describe("Tree", () => {
  it("exposes tree semantics (level/posinset/setsize) directly on the focusable node", () => {
    render(<Tree data={data} defaultExpandedIds={["src"]} />);
    const item = screen.getByText("index.ts").closest('[role="treeitem"]')!;
    expect(item).toHaveAttribute("aria-level", "2");
    expect(item).toHaveAttribute("aria-posinset", "1");
    expect(item).toHaveAttribute("aria-setsize", "2");
    expect(item).toHaveAttribute("tabindex");
  });

  it("expands a node with ArrowRight and collapses it with ArrowLeft", async () => {
    const user = userEvent.setup();
    render(<Tree data={data} />);
    const srcItem = screen.getByText("src").closest('[role="treeitem"]') as HTMLElement;
    srcItem.focus();

    expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("index.ts")).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
  });

  it("moves the roving tabindex/focus with ArrowDown/ArrowUp", async () => {
    const user = userEvent.setup();
    render(<Tree data={data} defaultExpandedIds={["src"]} />);
    const srcItem = screen.getByText("src").closest('[role="treeitem"]') as HTMLElement;
    srcItem.focus();

    await user.keyboard("{ArrowDown}");
    const indexItem = screen.getByText("index.ts").closest('[role="treeitem"]') as HTMLElement;
    expect(indexItem).toHaveFocus();
    expect(indexItem).toHaveAttribute("tabindex", "0");
    expect(srcItem).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{ArrowUp}");
    expect(srcItem).toHaveFocus();
  });

  it("selects and toggles a node with Enter, matching click behavior", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Tree data={data} onSelect={onSelect} />);
    const srcItem = screen.getByText("src").closest('[role="treeitem"]') as HTMLElement;
    srcItem.focus();

    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(data[0]);
    expect(screen.getByText("index.ts")).toBeInTheDocument();
  });

  it("forwards its ref and spreads native props onto the tree root", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Tree ref={ref} data={data} aria-label="Project files" data-testid="tree-root" />);
    const root = screen.getByTestId("tree-root");
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute("role", "tree");
    expect(root).toHaveAttribute("aria-label", "Project files");
  });

  it("jumps to the first/last visible node with Home/End", async () => {
    const user = userEvent.setup();
    render(<Tree data={data} defaultExpandedIds={["src"]} />);
    const srcItem = screen.getByText("src").closest('[role="treeitem"]') as HTMLElement;
    srcItem.focus();

    await user.keyboard("{End}");
    expect(screen.getByText("README.md").closest('[role="treeitem"]')).toHaveFocus();

    await user.keyboard("{Home}");
    expect(srcItem).toHaveFocus();
  });

  it("toggles and selects together on a row click by default", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Tree data={data} onSelect={onSelect} />);
    await user.click(screen.getByText("src"));
    expect(onSelect).toHaveBeenCalledWith(data[0]);
    expect(screen.getByText("index.ts")).toBeInTheDocument();
  });

  describe("expandOnSelect={false}", () => {
    const item = (label: string) => screen.getByText(label).closest('[role="treeitem"]') as HTMLElement;

    it("selects a parent on row click without toggling it", async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<Tree data={data} onSelect={onSelect} expandOnSelect={false} />);
      await user.click(screen.getByText("src"));
      expect(onSelect).toHaveBeenCalledWith(data[0]);
      expect(item("src")).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
    });

    it("selects with Enter/Space without toggling", async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<Tree data={data} onSelect={onSelect} expandOnSelect={false} defaultExpandedIds={["src"]} />);
      item("src").focus();
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      expect(onSelect).toHaveBeenCalledTimes(2);
      expect(item("src")).toHaveAttribute("aria-expanded", "true");
    });

    it("toggles from the chevron without selecting", async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<Tree data={data} onSelect={onSelect} expandOnSelect={false} />);
      const toggle = container.querySelector("[data-tree-toggle]") as HTMLElement;
      await user.click(toggle);
      expect(screen.getByText("index.ts")).toBeInTheDocument();
      await user.click(toggle);
      expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("still expands and collapses with ArrowRight/ArrowLeft", async () => {
      const user = userEvent.setup();
      render(<Tree data={data} expandOnSelect={false} />);
      item("src").focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByText("index.ts")).toBeInTheDocument();
      await user.keyboard("{ArrowLeft}");
      expect(screen.queryByText("index.ts")).not.toBeInTheDocument();
    });

    it("has no obvious accessibility violations", async () => {
      const { container } = render(
        <Tree
          data={data}
          aria-label="Files"
          selectedId="src"
          expandOnSelect={false}
          defaultExpandedIds={["src"]}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
