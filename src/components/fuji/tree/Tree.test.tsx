import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
});
